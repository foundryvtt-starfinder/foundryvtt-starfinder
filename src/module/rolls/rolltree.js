import RollNode from "./rollnode.js";
import RollContext from "./rollcontext.js";
import RollDialog from "../apps/roll-dialog.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";

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

        const allRolledMods = await this.populate();

        if (this.options.skipUI) {
            const button = this.options.defaultButton || (this.options.buttons ? (Object.values(this.options.buttons)[0].id ?? Object.values(this.options.buttons)[0].label) : "roll");
            const rollMode = game.settings.get("core", "rollMode");

            for (const [key, value] of Object.entries(this.nodes)) {
                if (value.referenceModifier) {
                    value.isEnabled = value.referenceModifier.enabled;
                }
            }

            const parts = this.options.parts?.filter(x => x.isDamageSection);
            const finalRollFormula = this.rootNode.resolve(0, this.rollMods);
            if (parts?.length > 0) {
                for (const part of parts) {
                    const finalSectionFormula = duplicate(finalRollFormula);

                    if (finalSectionFormula.finalRoll.includes("<damageSection>")) {
                        const damageSectionFormula = part?.formula ?? "0";
                        finalSectionFormula.finalRoll = finalSectionFormula.finalRoll.replace("<damageSection>", damageSectionFormula);
                        finalSectionFormula.formula = finalSectionFormula.formula.replace("<damageSection>", damageSectionFormula);
                    }

                    if (this.options.debug) {
                        console.log([`Final roll results outcome`, formula, allRolledMods, finalSectionFormula]);
                    }

                    if (callback) {
                        if (parts.length > 1) {
                            const partIndex = parts.indexOf(part);
                            const partCount = parts.length;
                            part.partIndex = game.i18n.format("SFRPG.Damage.PartIndex", {partIndex: partIndex + 1, partCount: partCount});
                        }
                        await callback(button, rollMode, finalSectionFormula, part);
                    }
                }
            } else {
                if (this.options.debug) {
                    console.log([`Final roll results outcome`, formula, allRolledMods, finalRollFormula]);
                }

                if (callback) {
                    await callback(button, rollMode, finalRollFormula, this.rootNode, this.rollMods);
                }
            }

            return {button: button, rollMode: rollMode, finalRollFormula: finalRollFormula};
        }

        const uiPromise = this.displayUI(formula, contexts, allRolledMods);
        uiPromise.then(async ([button, rollMode, bonus, parts]) => {
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
            const enabledParts = parts?.filter(x => x.enabled);
            if (enabledParts?.length > 0) {
                for (const part of enabledParts) {
                    const finalSectionFormula = duplicate(finalRollFormula);

                    if (finalSectionFormula.finalRoll.includes("<damageSection>")) {
                        const damageSectionFormula = part?.formula ?? "0";
                        finalSectionFormula.finalRoll = finalSectionFormula.finalRoll.replace("<damageSection>", damageSectionFormula);
                        finalSectionFormula.formula = finalSectionFormula.formula.replace("<damageSection>", damageSectionFormula);
                    }

                    bonus = bonus.trim();
                    if (bonus) {
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
                            const partIndex = enabledParts.indexOf(part);
                            const partCount = enabledParts.length;
                            part.partIndex = game.i18n.format("SFRPG.Damage.PartIndex", {partIndex: partIndex + 1, partCount: partCount});
                        }
                        await callback(button, rollMode, finalSectionFormula, part);
                    }
                }
            } else {
                if (finalRollFormula.finalRoll.includes("<damageSection>")) {
                    finalRollFormula.finalRoll = finalRollFormula.finalRoll.replace("<damageSection>", "0");
                    finalRollFormula.formula = finalRollFormula.formula.replace("<damageSection>", "0");
                }

                bonus = bonus.trim();
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

                await callback(button, rollMode, finalRollFormula, this.rootNode, this.rollMods, bonus);
            }
        });
        return uiPromise;
    }

    async populate() {
        if (this.options.debug) {
            console.log(`Resolving '${this.formula}'`);
            console.log(duplicate(this.contexts));
        }

        this.rootNode = new RollNode(this, this.formula, null, null, false, true, null, this.options);
        this.nodes = {};

        this.nodes[this.formula] = this.rootNode;
        this.rootNode.populate(this.nodes, this.contexts);

        const allRolledMods = RollTree.getAllRolledModifiers(this.nodes);

        for (const [key, value] of Object.entries(this.nodes)) {
            if (value.referenceModifier) {
                this.rollMods.push(value.referenceModifier);
            }
            if (value.calculatedMods) {
                for (let calcModsI = 0; calcModsI < value.calculatedMods.length; calcModsI++) {
                    this.rollMods.push(value.calculatedMods[calcModsI].bonus);
                }
            }
        }

        const availableModifiers = [].concat(allRolledMods.map(x => x.referenceModifier));
        return availableModifiers;
    }

    async displayUI(formula, contexts, availableModifiers) {
        if (this.options.debug) {
            console.log(["Available modifiers", availableModifiers]);
        }
        if (this.options.skipUI) {
            const firstButton = this.options.defaultButton || (this.options.buttons ? Object.values(this.options.buttons)[0].id ?? Object.values(this.options.buttons)[0].label : "roll");
            const defaultRollMode = game.settings.get("core", "rollMode");
            return new Promise((resolve) => { resolve([firstButton, defaultRollMode, ""]); });
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
