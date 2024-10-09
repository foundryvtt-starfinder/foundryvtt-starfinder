import RollDialog from "../apps/roll-dialog.js";
import RollNode from "./rollnode.js";

export default class RollTree {
    constructor(options = {}) {
        /** @type {RollNode} */
        this.rootNode = null;
        /** @type {RollNode} */
        this.nodes = {};
        this.options = options;
        this.rollMods = [];
    }

    /**
     * Method used to build the roll data needed for a Roll.
     *
     * @param {string} formula The formula for the Roll
     * @param {RollContext} contexts The data context for this roll
     * @param {onRollBuilt} callback Function called when the Roll is built.
     * @returns Stuff
     */
    async buildRoll(formula, contexts, callback) {
        this.formula = formula;
        this.contexts = contexts;

        /** Initialize selectors. */
        if (this.contexts.selectors) {
            for (const selector of this.contexts.selectors) {
                const selectorTarget = selector.target;
                const firstValue = selector.options[0];
                if (selectorTarget && firstValue) {
                    this.contexts.allContexts[selectorTarget] = this.contexts.allContexts[firstValue];
                }
            }
        }

        /** Verify variable contexts, replace bad ones with 0. */
        const variableMatches = new Set(this.formula.match(/@([a-zA-Z.0-9_\-]+)/g));
        for (const variable of variableMatches) {
            const [context, remainingVariable] = RollNode.getContextForVariable(variable, contexts);
            if (!context) {
                console.log(`Cannot find context for variable '${variable}', substituting with a 0.`);
                const regexp = new RegExp(variable, "gi");
                this.formula = this.formula.replace(regexp, "0");
            }
        }

        const allRolledMods = this.populate();

        let button, rollMode, bonus, enabledParts;
        if (this.options.skipUI) {
            button = this.options.defaultButton || (this.options.buttons ? (Object.values(this.options.buttons)[0].id ?? Object.values(this.options.buttons)[0].label) : "roll");
            rollMode = game.settings.get("core", "rollMode");
            bonus = null;
            // TODO(levirak): don't roll every part when skipping UI? (E.g., when holding SHIFT)
            enabledParts = this.options.parts?.filter(x => x.isDamageSection);
        } else {
            let parts;
            ({button, rollMode, bonus, parts} = await this.displayUI(formula, contexts, allRolledMods));
            enabledParts = parts?.filter(x => x.enabled);
        }

        let callbackResult = null;
        if (button === null) {
            console.log('Roll was cancelled');
            await callback('cancel', "none", null);
            return;
        }

        for (const [key, value] of Object.entries(this.nodes)) {
            if (value.referenceModifier) {
                value.isEnabled = value.referenceModifier.enabled;
            }
        }

        const finalRollFormula = this.rootNode.resolve(0, this.rollMods);
        if (enabledParts?.length > 0) {
            for (const [partIndex, part] of enabledParts.entries()) {
                const finalSectionFormula = foundry.utils.deepClone(finalRollFormula);

                if (finalSectionFormula.finalRoll.includes("<damageSection>")) {
                    const damageSectionFormula = part?.formula ?? "0";
                    if (part.isPrimarySection) {
                        finalSectionFormula.finalRoll = finalSectionFormula.finalRoll.replace("<damageSection>", damageSectionFormula);
                        finalSectionFormula.formula = finalSectionFormula.formula.replace("<damageSection>", damageSectionFormula);
                    } else {
                        finalSectionFormula.finalRoll = damageSectionFormula;
                        finalSectionFormula.formula = damageSectionFormula;
                    }

                }

                if (bonus) {
                    // TODO(levirak): should the bonus be applied to every damage section?
                    const operators = ['+', '-', '*', '/'];
                    if (!operators.includes(bonus[0])) {
                        finalSectionFormula.finalRoll += " +";
                        finalSectionFormula.formula += " +";
                    }
                    finalSectionFormula.finalRoll += " " + bonus;
                    finalSectionFormula.formula += game.i18n.format("SFRPG.Rolls.Dice.Formula.AdditionalBonus", { "bonus": bonus });
                }

                if (this.options.debug) {
                    console.log([`Final roll results outcome`, formula, allRolledMods, finalSectionFormula]);
                }

                if (callback) {
                    if (enabledParts.length > 1) {
                        part.partIndex = game.i18n.format("SFRPG.Damage.PartIndex", {partIndex: partIndex + 1, partCount: enabledParts.length});
                    }
                    callbackResult = await callback(button, rollMode, finalSectionFormula, part, this.rootNode, this.rollMods, bonus);
                }
            }
        } else {
            if (finalRollFormula.finalRoll.includes("<damageSection>")) {
                finalRollFormula.finalRoll = finalRollFormula.finalRoll.replace("<damageSection>", "0");
                finalRollFormula.formula = finalRollFormula.formula.replace("<damageSection>", "0");
            }

            if (bonus) {
                const operators = ['+', '-', '*', '/'];
                if (!operators.includes(bonus[0])) {
                    finalRollFormula.finalRoll += " +";
                    finalRollFormula.formula += " +";
                }
                finalRollFormula.finalRoll += " " + bonus;
                finalRollFormula.formula += game.i18n.format("SFRPG.Rolls.Dice.Formula.AdditionalBonus", { "bonus": bonus });
            }

            if (this.options.debug) {
                console.log([`Final roll results outcome`, formula, allRolledMods, finalRollFormula]);
            }

            if (callback) {
                callbackResult = await callback(button, rollMode, finalRollFormula, this.rootNode, this.rollMods, bonus);
            }
        }

        if (this.options.skipUI) {
            return {button, rollMode, finalRollFormula, callbackResult};
        }
        else {
            return {button, rollMode, bonus, parts, callbackResult};
        }
    }

    populate() {
        if (this.options.debug) {
            console.log(`Resolving '${this.formula}'`);
            console.log(this.contexts);
        }

        this.rootNode = new RollNode(this, this.formula, null, null, false, true, null, this.options);
        this.nodes = {};
        this.rollMods = [];

        this.nodes[this.formula] = this.rootNode;
        this.rootNode.populate(this.nodes, this.contexts);

        const allRolledMods = RollTree.getAllRolledModifiers(this.nodes);

        for (const [key, value] of Object.entries(this.nodes)) {
            if (value.referenceModifier) {
                this.rollMods.push(value.referenceModifier);
            }
            if (value.calculatedMods) {
                for (let calcModsI = 0; calcModsI < value.calculatedMods.length; calcModsI++) {
                    const mod = value.calculatedMods[calcModsI];
                    if (this.rollMods.findIndex((x) => x.name === mod.bonus.name) === -1 && this.formula.indexOf(mod.bonus.name) === -1) {
                        this.rollMods.push(mod.bonus);
                    }
                }
            }
        }

        const availableModifiers = [].concat(allRolledMods.map(x => x.referenceModifier));
        return availableModifiers;
    }

    displayUI(formula, contexts, availableModifiers) {
        if (this.options.debug) {
            console.log(["Available modifiers", availableModifiers]);
        }
        return RollDialog.showRollDialog(
            this,
            formula,
            contexts,
            availableModifiers,
            this.options.mainDie,
            {
                buttons: this.options.buttons,
                defaultButton: this.options.defaultButton,
                title: this.options.title,
                dialogOptions: this.options.dialogOptions,
                parts: this.options.parts?.filter(x => x.isDamageSection)
            });
    }

    static getAllRolledModifiers(nodes) {
        return Object.values(nodes).filter(x => x.referenceModifier !== null);
    }
}
