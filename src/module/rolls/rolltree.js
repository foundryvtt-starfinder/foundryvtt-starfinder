import RollDialog from "../apps/roll-dialog.js";
import RollNode from "./rollnode.js";

/**
 * @typedef {Object} RollInfo
 * @property {string}          button
 * @property {string}          mode
 * @property {SFRPGModifier[]} modifiers
 * @property {string?}         bonus
 * @property {EachRoll[]}      rolls
 */

/**
 * @typedef {Object} EachRoll
 * @property {ResolvedRoll} formula
 * @property {RollNode}     node
 */

export default class RollTree {

    /** @type {RollNode} */
    rootNode = null;

    /** @type {RollNode} */
    nodes = {};

    constructor(formula, contexts, options = {}) {
        /** Initialize selectors. */
        if (contexts.selectors) {
            for (const selector of contexts.selectors) {
                const selectorTarget = selector.target;
                const firstValue = selector.options[0];
                if (selectorTarget && firstValue) {
                    contexts.allContexts[selectorTarget] = contexts.allContexts[firstValue];
                }
            }
        }

        /** Verify variable contexts, replace bad ones with 0. */
        const variableMatches = new Set(formula.match(/@([a-zA-Z.0-9_-]+)/g));
        for (const variable of variableMatches) {
            const [context] = RollNode.getContextForVariable(variable, contexts);
            if (!context) {
                console.log(`Cannot find context for variable '${variable}', substituting with a 0.`);
                formula = formula.replaceAll(variable, "0");
            }
        }

        this.formula = formula;
        this.options = options;

        this.populate(contexts);
    }

    /**
     * @param {Object} request
     * @param {string} request.button
     * @param {string} request.mode
     * @param {string} [request.bonus]
     * @param {DamagePart[]} [request.enabledParts]
     * @returns {RollInfo}
     */
    #processRollRequest(request) {
        const result = {
            button: request.button ?? 'cancel',
            mode: request.mode,
            modifiers: this.getModifiers(),
            bonus: request.bonus,
            rolls: []
        };

        if (result.button === 'cancel') {
            /* no-op. roll was canceled */
        } else if (request.enabledParts?.length > 0) {
            /* When the roll tree is passed parts, the primary formula & root node instead describes the bonuses that
             * are added to the primary section */

            const rootRollFormula = this.rootNode.resolveForRoll([]); // TODO(levirak): pass modifiers?
            for (const [partIndex, part] of request.enabledParts.entries()) {
                const finalSectionFormula = {
                    finalRoll: [
                        part.formula,
                        part.isPrimarySection ? rootRollFormula.finalRoll : ''
                    ].filter(Boolean).join(' + ') || '0',
                    formula: [
                        part.formula,
                        part.isPrimarySection ? rootRollFormula.formula : ''
                    ].filter(Boolean).join(' + ') || '0'
                };

                if (result.bonus) {
                    // TODO(levirak): should the bonus be applied to every damage section?
                    const operators = ['+', '-', '*', '/'];
                    if (!operators.includes(result.bonus[0])) {
                        finalSectionFormula.finalRoll += " +";
                        finalSectionFormula.formula += " +";
                    }
                    finalSectionFormula.finalRoll += " " + result.bonus;
                    finalSectionFormula.formula += game.i18n.format("SFRPG.Rolls.Dice.Formula.AdditionalBonus", { "bonus": result.bonus });
                }

                if (request.enabledParts.length > 1) {
                    part.partIndex = game.i18n.format("SFRPG.Damage.PartIndex", {partIndex: partIndex + 1, partCount: request.enabledParts.length});
                }

                if (this.options.debug) {
                    console.log([`Final roll results outcome`, formula, this.getRolledModifiers(), finalSectionFormula]);
                }

                result.rolls.push({ formula: finalSectionFormula, node: part });
            }
        } else {
            const finalRollFormula = this.rootNode.resolveForRoll([]); // TODO(levirak): pass modifiers?
            if (result.bonus) {
                const operators = ['+', '-', '*', '/'];
                if (!operators.includes(result.bonus[0])) {
                    finalRollFormula.finalRoll += " +";
                    finalRollFormula.formula += " +";
                }
                finalRollFormula.finalRoll += " " + result.bonus;
                finalRollFormula.formula += game.i18n.format("SFRPG.Rolls.Dice.Formula.AdditionalBonus", { "bonus": result.bonus });
            }

            if (this.options.debug) {
                console.log([`Final roll results outcome`, formula, this.getRolledModifiers(), finalRollFormula]);
            }

            result.rolls.push({ formula: finalRollFormula, node: this.rootNode });
        }

        return result;
    }

    /**
     * Method used to build the roll data needed for a Roll.
     *
     * @param {string} formula The formula for the Roll
     * @param {RollContext} contexts The data context for this roll
     * @param {Object} [options]
     * @param {DamagePart[]} [options.parts]
     * @param {boolean} [options.debug]
     * @returns {RollInfo}
     */
    static buildRollSync(formula, contexts, options = {rollType: "roll"}) {
        return new RollTree(formula, contexts, options).#processRollRequest({
            button: options.defaultButton || (options.buttons ? (Object.values(options.buttons)[0].id ?? Object.values(options.buttons)[0].label) : "roll"),
            mode: game.settings.get("core", "rollMode"),
            bonus: null,
            // TODO(levirak): don't roll every part when skipping UI? (E.g., when holding SHIFT)
            enabledParts: options.parts ?? [],
            debug: options.debug
        });
    }

    /**
     * Method used to build the roll data needed for a Roll.
     *
     * @param {string} formula The formula for the Roll
     * @param {RollContext} contexts The data context for this roll
     * @param {Object} [options]
     * @param {boolean} [options.skipUI] Do not show the UI. Default false.
     * @param {DamagePart[]} [options.parts]
     * @param {boolean} [options.debug]
     * @param {String} [options.rollType] Type of roll
     * @returns {Promise<RollInfo>}
     */
    static async buildRoll(formula, contexts, options = {rollType: "roll"}) {
        let result;

        if (options.skipUI) {
            result = RollTree.buildRollSync(formula, contexts, options);
        } else {
            const tree = new RollTree(formula, contexts, options);
            const allRolledMods = tree.getRolledModifiers();

            if (options.debug) {
                console.log(["Available modifiers", allRolledMods]);
            }

            const uiResult = await RollDialog.showRollDialog(tree, formula, contexts, allRolledMods, options.mainDie, {
                buttons: options.buttons,
                defaultButton: options.defaultButton,
                dialogOptions: options.dialogOptions,
                parts: options.parts,
                rollType: options.rollType,
                title: options.title
            });

            /* make sure anything toggled in the UI is correctly enabled */
            for (const value of Object.values(tree.nodes)) {
                if (value.referenceModifier) {
                    value.isEnabled = value.referenceModifier.enabled;
                }
            }

            result = tree.#processRollRequest({
                button: uiResult.button,
                mode: uiResult.rollMode,
                bonus: uiResult.bonus,
                enabledParts: uiResult.parts?.filter(part => part.enabled),
                debug: options.debug
            });
        }

        return result;
    }

    /**
     * Populate `this.rootNode` and `this.nodes` with values according to `contexts`
     * @param {RollContext} contexts The data context used to populate this tree's nodes
     */
    populate(contexts) {
        if (this.options.debug) {
            console.log(`Resolving '${this.formula}'`);
            console.log(contexts);
            console.log(this.options);
        }

        this.rootNode = new RollNode(this.formula, this, this.options);
        this.nodes = {};

        this.nodes[this.formula] = this.rootNode;
        this.rootNode.populate(this.nodes, contexts);
    }

    /**
     * Get the rolled modifiers from this objects nodes.
     * @returns {SFRPGModifier[]}
     */
    getRolledModifiers() {
        return Object.values(this.nodes)
            .filter(x => x.referenceModifier !== null)
            .map(x => x.referenceModifier);
    }

    /**
     * Get the rolled and calculated modifiers from this objects nodes.
     * @returns {SFRPGModifier[]}
     */
    getModifiers() {
        const rollMods = [];
        for (const value of Object.values(this.nodes)) {
            if (value.referenceModifier) {
                rollMods.push(value.referenceModifier);
            }
            if (value.calculatedMods) {
                for (const bonus of value.calculatedMods.values()) {
                    if (rollMods.findIndex((x) => x.name === bonus.name) === -1 && this.formula.indexOf(bonus.name) === -1) {
                        rollMods.push(bonus);
                    }
                }
            }
        }
        return rollMods;
    }
}
