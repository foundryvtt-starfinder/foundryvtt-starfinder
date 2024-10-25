import { SFRPGModifierType } from "../modifiers/types.js";
import RollTree from "./rolltree.js";

/** Pattern matching exterior characters of a formula that should be trimmed */
const exteriorPattern = /^\s+|[\s\+]+$/g;

/** Pattern matching a formula attribute */
const variablePattern = /@[a-zA-Z.0-9_-]+/g;

/** Pattern matching the square bracket descriptions in roll formulae */
const bracketPattern = /\[[^\]]*\]/g;

/**
 * A data structure for storing data about damage types
 *
 * @typedef {Object} ResolvedRoll
 * @property {string} finalRoll
 * @property {string} formula
 */

export default class RollNode {
    constructor(formula, parent, options, sparseOpts = {}) {
        this.formula = formula;
        this.options = options;
        if (parent instanceof RollNode) {
            this.parentNode = parent;
            this.tree = parent.tree;
        } else if (parent instanceof RollTree) {
            this.parentNode = null;
            this.tree = parent;
        } else {
            throw new Error('RollNode constructed with unsupported parent.');
        }

        /** The value of this node. A non-null value implies that this node is a variable node. */
        this.variableValue = sparseOpts.variableValue ?? null;

        /** Modifier. A non-null value implies that this node represents a rolled modifier */
        this.referenceModifier = sparseOpts.referenceModifier ?? null;

        /** Flag indicating if this node is available */
        this.isEnabled = sparseOpts.isEnabled ?? true;

        this.childNodes = {};
        this.variableTooltips = null;
        this.rollTooltips = null;

        /** @type {Map<SFRPGModifier>} */
        this.calculatedMods = null;
    }

    populate(nodes, contexts) {
        if (this.variableValue !== null) {
            const [context, remainingVariable] = RollNode.getContextForVariable(this.formula, contexts);

            const availableRolledMods = RollNode.getRolledModifiers(remainingVariable, context);
            this.calculatedMods = RollNode.getCalculatedModifiers(remainingVariable, context);
            this.variableTooltips = RollNode.getTooltips(remainingVariable, context, "tooltip");
            this.rollTooltips = RollNode.getTooltips(remainingVariable, context, "rollTooltip");

            // TODO(levirak): could calculatedMods also be added as child nodes?
            for (const bonus of availableRolledMods.values()) {
                const modKey = bonus._id ?? (bonus.modifier[0] === '@' ? bonus.modifier.substring(1) : bonus.name);

                let existingNode = nodes[modKey];
                if (!existingNode) {
                    const childNode = new RollNode(bonus.modifier, this, this.options, {
                        referenceModifier: bonus,
                        isEnabled: bonus.enabled,
                    });
                    nodes[modKey] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[modKey] = existingNode;
            }
        } else {
            const variableMatches = new Set(this.formula.match(variablePattern));
            for (const fullVariable of variableMatches) {
                const variable = fullVariable.substring(1);
                const [context, remainingVariable] = RollNode.getContextForVariable(variable, contexts);

                let existingNode = nodes[variable];
                if (!existingNode) {
                    const childNode = new RollNode(variable, this, this.options, {
                        variableValue: RollNode._readValue(context.data, remainingVariable) ?? '0',
                    });
                    nodes[variable] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[variable] = existingNode;
            }
        }

        for (const childNode of Object.values(this.childNodes)) {
            childNode.populate(nodes, contexts);
        }
    }

    /**
     * @param {SFRPGModifier[]} rollMods  All modifiers applied to this roll.
     * @returns {ResolvedRoll}
     */
    resolveForRoll(rollMods) {
        let resolvedValue = {
            finalRoll: "",
            formula: ""
        };

        if (this.variableValue !== null) {
            if (this.variableValue !== "n/a") {
                // This value has any enabled calculated mods pre-addeded into it.
                // They need to be subtracted back out if they are also being rolled
                let variableValue = rollMods
                    .filter(bonus => this.calculatedMods.get(bonus._id)?.enabled)
                    .reduce((value, bonus) => value - bonus.max, Number(this.variableValue));

                let formulaDescription = this.referenceModifier?.name || "@" + this.formula;
                if (!this.options.useRawStrings) {
                    let tooltip = this.rollTooltips.join(',\n') || this.variableTooltips.join(',\n');
                    let spanTag = tooltip ? `span title="${tooltip}"` : 'span';
                    formulaDescription = `<${spanTag}>${formulaDescription}</span>`;
                }

                resolvedValue.finalRoll = `${variableValue}`;
                resolvedValue.formula = `${variableValue}[${formulaDescription}]`;
            }

            // formula
            const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);
            for (const childNode of enabledChildNodes) {
                const childResolution = childNode.resolveForRoll(rollMods);

                resolvedValue.finalRoll = [
                    resolvedValue.finalRoll,
                    childResolution.finalRoll,
                ].filter(Boolean).join(' + ');

                resolvedValue.formula = [
                    resolvedValue.formula,
                    childResolution.formula.endsWith("]")
                        ? childResolution.formula
                        : `${childResolution.formula}[${childNode.referenceModifier.name}]`,
                ].filter(Boolean).join(' + ');
            }
        } else {
            let finalRoll = this.formula;
            let formula = this.formula;

            const variableMatches = new Set(formula.match(variablePattern));
            for (const fullVariable of variableMatches) {
                const variable = fullVariable.substring(1);
                const existingNode = this.childNodes[variable];

                if (existingNode) {
                    const childResolution = existingNode.resolveForRoll(rollMods);
                    finalRoll = finalRoll.replaceAll(fullVariable, childResolution.finalRoll);
                    formula = formula.replaceAll(fullVariable, childResolution.formula);
                } else {
                    finalRoll = finalRoll.replaceAll(fullVariable, "0");
                    formula = formula.replaceAll(fullVariable, "0");
                }
            }

            finalRoll = finalRoll.replaceAll(bracketPattern, '');

            resolvedValue.finalRoll = finalRoll.replaceAll(exteriorPattern, '');
            resolvedValue.formula = formula.replaceAll(exteriorPattern, '');
        }

        return resolvedValue;
    }

    static getContextForVariable(variable, contexts) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (contexts.allContexts[firstToken]) {
            return [contexts.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (contexts.mainContext ? contexts.allContexts[contexts.mainContext] : null);
        return [context, variable];
    }

    static getRolledModifiers(variable, context) {
        let variableString = variable + ".rolledMods";
        let variableRolledMods = RollNode._readValue(context.data, variableString);
        if (!variableRolledMods) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + ".rolledMods";
            variableRolledMods = RollNode._readValue(context.data, variableString);
        }

        return (variableRolledMods ?? []).reduce((map, mod) => {
            map.set(mod.bonus._id, mod.bonus);
            return map;
        }, new Map());
    }

    static getCalculatedModifiers(variable, context) {
        let variableString = variable + ".calculatedMods";
        const words = variable.split('.');
        let variableCalculatedMods = RollNode._readValue(context.data, variableString);
        // we don't want to include mods for skill ranks or ability.mod as those are standalone values
        if (!variableCalculatedMods && !words.includes("ranks") && !(words.includes("abilities") && !words.includes("abilityCheckBonus"))) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + ".calculatedMods";
            variableCalculatedMods = RollNode._readValue(context.data, variableString);
        }

        return (variableCalculatedMods ?? []).reduce((map, mod) => {
            map.set(mod.bonus._id, mod.bonus);
            return map;
        }, new Map());
    }

    static getTooltips(variable, context, tooltipProp) {
        let variableString = `${variable}.${tooltipProp}`;
        let tooltips = RollNode._readValue(context.data, variableString);

        if (!tooltips) {
            variableString = `${variable.substring(0, variable.lastIndexOf('.'))}.${tooltipProp}`;
            tooltips = RollNode._readValue(context.data, variableString);
        }

        // if we are looking for ranks then don't include all the tooltips just the ones for ranks
        if (variable.substring(variable.lastIndexOf('.') + 1) === "ranks") {
            tooltips = tooltips?.filter((x) => x.toLowerCase().includes("rank"));
        }
        return tooltips ?? [];
    }

    static _readValue(object, key) {
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }
}
