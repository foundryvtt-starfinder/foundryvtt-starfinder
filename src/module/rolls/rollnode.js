import { SFRPGModifierType } from "../modifiers/types.js";
import RollTree from "./rolltree.js";

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

        this.baseValue = sparseOpts.baseValue ?? null;
        this.referenceModifier = sparseOpts.referenceModifier ?? null;
        this.isVariable = sparseOpts.isVariable ?? false;
        this.isEnabled = sparseOpts.isEnabled ?? true;

        this.resolvedValue = undefined;
        this.childNodes = {};
        this.nodeContext = null;
        this.variableTooltips = null;
        this.rollTooltips = null;
        this.calculatedMods = null;
    }

    populate(nodes, contexts) {
        if (this.isVariable) {
            const [context, remainingVariable] = RollNode.getContextForVariable(this.formula, contexts);
            this.nodeContext = context;

            const availableRolledMods = RollNode.getRolledModifiers(remainingVariable, this.getContext());
            this.calculatedMods = RollNode.getCalculatedModifiers(remainingVariable, this.getContext());
            this.variableTooltips = RollNode.getTooltips(remainingVariable, this.getContext());
            this.rollTooltips = RollNode.getTooltips(remainingVariable, this.getContext(), ".rollTooltip");

            for (const mod of availableRolledMods) {
                const modKey = mod.bonus._id ?? (mod.bonus.modifier[0] === '@' ? mod.bonus.modifier.substring(1) : mod.bonus.name);

                let existingNode = nodes[modKey];
                if (!existingNode) {
                    const childNode = new RollNode(mod.bonus.modifier, this, this.options, {
                        referenceModifier: mod.bonus,
                        isEnabled: mod.bonus.enabled,
                    });
                    nodes[modKey] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[modKey] = existingNode;
            }
        } else {
            const variableMatches = new Set(this.formula.match(/@([a-zA-Z.0-9_-]+)/g));
            for (const fullVariable of variableMatches) {
                const variable = fullVariable.substring(1);
                const [context, remainingVariable] = RollNode.getContextForVariable(variable, contexts);
                this.nodeContext = context;

                let variableValue = 0;
                try {
                    variableValue = RollNode._readValue(this.getContext().data, remainingVariable);
                } catch (error) {
                    console.log(["error reading value", remainingVariable, this, error]);
                }

                let existingNode = nodes[variable];
                if (!existingNode) {
                    const childNode = new RollNode(variable, this, this.options, {
                        baseValue: variableValue,
                        isVariable: true,
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

    getContext() {
        if (this.nodeContext) return this.nodeContext;
        let parent = this.parentNode;
        while (parent && !this.nodeContext) {
            this.nodeContext = parent.nodeContext;
            parent = parent.parentNode;
        }
        return this.nodeContext;
    }

    /** @returns {ResolvedRoll} */
    resolve(depth = 0) {
        if (this.resolvedValue) {
            return this.resolvedValue;
        } else {
            // console.log(['Resolving', depth, this]);
            this.resolvedValue = {
                finalRoll: "",
                formula: ""
            };

            if (this.isVariable && !this.baseValue) {
                this.baseValue = "0";
            }

            if (this.baseValue) {
                if (this.baseValue !== "n/a") {
                    const joinedTooltips = this.variableTooltips.join(',\n');

                    this.resolvedValue.finalRoll = this.baseValue;
                    this.resolvedValue.formula = this.baseValue + "[";
                    if (this.options.useRawStrings) {
                        this.resolvedValue.formula += (this.referenceModifier?.name || "@" + this.formula);
                    } else {
                        this.resolvedValue.formula += "<span";
                        if (joinedTooltips) {
                            this.resolvedValue.formula += ` title="${joinedTooltips}"`;
                        }
                        this.resolvedValue.formula += `>`;
                        this.resolvedValue.formula += (this.referenceModifier?.name || "@" + this.formula);
                        this.resolvedValue.formula += `</span>`;
                    }
                    this.resolvedValue.formula += "]";
                }

                // formula
                const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);
                for (const childNode of enabledChildNodes) {
                    const childResolution = childNode.resolve(depth + 1);
                    if (this.resolvedValue.finalRoll !== "") {
                        this.resolvedValue.finalRoll += " + ";
                    }
                    this.resolvedValue.finalRoll += childResolution.finalRoll;

                    if (this.resolvedValue.formula !== "") {
                        this.resolvedValue.formula += " + ";
                    }

                    if (childResolution.formula.endsWith("]")) {
                        this.resolvedValue.formula += childResolution.formula;
                    } else {
                        this.resolvedValue.formula += childResolution.formula + `[${childNode.referenceModifier.name}]`;
                    }
                }
            } else {
                let valueString = this.formula;
                let formulaString = this.formula;
                const variableMatches = new Set(formulaString.match(/@([a-zA-Z.0-9_-]+)/g));
                for (const fullVariable of variableMatches) {
                    const regexp = new RegExp(fullVariable, "gi");
                    const variable = fullVariable.substring(1);
                    const existingNode = this.childNodes[variable];
                    // console.log(["testing var", depth, this, fullVariable, variable, existingNode]);
                    if (existingNode) {
                        const childResolution = existingNode.resolve(depth + 1);
                        valueString = valueString.replace(regexp, childResolution.finalRoll);
                        formulaString = formulaString.replace(regexp, childResolution.formula);
                        // console.log(['Result', depth, childResolution, valueString, formulaString]);
                    } else {
                        // console.log(['Result', depth, "0"]);
                        valueString = valueString.replace(regexp, "0");
                        formulaString = formulaString.replace(regexp, "0");
                    }
                }

                valueString = valueString.trim();
                while (valueString.endsWith("+")) {
                    valueString = valueString.substring(0, valueString.length - 1).trim();
                }

                /** Remove any naming from the valueString. */
                let limit = 5;
                while (valueString.includes("[") && valueString.includes("]") && limit > 0) {
                    const openIndex = valueString.indexOf("[");
                    const closeIndex = valueString.indexOf("]");
                    if (closeIndex > openIndex) {
                        valueString = valueString.substring(0, openIndex) + valueString.substring(closeIndex + 1);
                    }
                    limit--;
                }

                formulaString = formulaString.trim();
                while (formulaString.endsWith("+")) {
                    formulaString = formulaString.substring(0, formulaString.length - 1).trim();
                }

                this.resolvedValue.finalRoll = valueString;
                this.resolvedValue.formula = formulaString;
            }
            // console.log(["Resolved", depth, this, this.resolvedValue]);
            return this.resolvedValue;
        }
    }

    resolveForRoll(depth = 0, rollMods) {
        // console.log(['Resolving', depth, this]);
        this.resolvedValue = {
            finalRoll: "",
            formula: ""
        };

        if (this.isVariable && !this.baseValue) {
            this.baseValue = "0";
        }

        if (this.baseValue) {
            if (this.baseValue !== "n/a") {
                // Bound which rollmods we apply to the value by it's calculated mods.
                // Potentially don't even need the rolled Mods and could just use the calculated mods but would require further testing.
                const calcMods = this.calculatedMods.filter(mod => mod.bonus.enabled === true);
                const constantMods = rollMods.filter(mod => calcMods.some(x => x.bonus._id === mod._id) && mod.modifierType === SFRPGModifierType.CONSTANT);
                const modSum = constantMods.reduce((accumulator, value) => accumulator + value.max, 0);
                this.baseValue = (Number(this.baseValue) - modSum).toString();

                const joinedTooltips = this.rollTooltips?.length > 0 ? this.rollTooltips.join(',\n') : this.variableTooltips.join(',\n');

                this.resolvedValue.finalRoll = this.baseValue;
                this.resolvedValue.formula = this.baseValue + "[";
                if (this.options.useRawStrings) {
                    this.resolvedValue.formula += (this.referenceModifier?.name || "@" + this.formula);
                } else {
                    this.resolvedValue.formula += "<span";
                    if (joinedTooltips) {
                        this.resolvedValue.formula += ` title="${joinedTooltips}"`;
                    }
                    this.resolvedValue.formula += `>`;
                    this.resolvedValue.formula += (this.referenceModifier?.name || "@" + this.formula);
                    this.resolvedValue.formula += `</span>`;
                }
                this.resolvedValue.formula += "]";
            }

            // formula
            const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);
            for (const childNode of enabledChildNodes) {
                const childResolution = childNode.resolveForRoll(depth + 1, rollMods);
                if (this.resolvedValue.finalRoll !== "") {
                    this.resolvedValue.finalRoll += " + ";
                }
                this.resolvedValue.finalRoll += childResolution.finalRoll;

                if (this.resolvedValue.formula !== "") {
                    this.resolvedValue.formula += " + ";
                }

                if (childResolution.formula.endsWith("]")) {
                    this.resolvedValue.formula += childResolution.formula;
                } else {
                    this.resolvedValue.formula += childResolution.formula + `[${childNode.referenceModifier.name}]`;
                }
            }
        } else {
            let valueString = this.formula;
            let formulaString = this.formula;
            const variableMatches = new Set(formulaString.match(/@([a-zA-Z.0-9_-]+)/g));

            for (const fullVariable of variableMatches) {
                const regexp = new RegExp(fullVariable, "gi");
                const variable = fullVariable.substring(1);
                const existingNode = this.childNodes[variable];
                // console.log(["testing var", depth, this, fullVariable, variable, existingNode]);
                if (existingNode) {
                    const childResolution = existingNode.resolveForRoll(depth + 1, rollMods);
                    valueString = valueString.replace(regexp, childResolution.finalRoll);
                    formulaString = formulaString.replace(regexp, childResolution.formula);
                } else {
                    valueString = valueString.replace(regexp, "0");
                    formulaString = formulaString.replace(regexp, "0");
                }
            }

            valueString = valueString.trim();
            while (valueString.endsWith("+")) {
                valueString = valueString.substring(0, valueString.length - 1).trim();
            }

            /** Remove any naming from the valueString. */
            let limit = 5;
            while (valueString.includes("[") && valueString.includes("]") && limit > 0) {
                const openIndex = valueString.indexOf("[");
                const closeIndex = valueString.indexOf("]");
                if (closeIndex > openIndex) {
                    valueString = valueString.substring(0, openIndex) + valueString.substring(closeIndex + 1);
                }
                limit--;
            }

            formulaString = formulaString.trim();
            while (formulaString.endsWith("+")) {
                formulaString = formulaString.substring(0, formulaString.length - 1).trim();
            }

            this.resolvedValue.finalRoll = valueString;
            this.resolvedValue.formula = formulaString;
        }
        // console.log(["Resolved", depth, this, this.resolvedValue]);
        return this.resolvedValue;
    }

    static getContextForVariable(variable, contexts) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (contexts.allContexts[firstToken]) {
            // console.log(["getContextForVariable", variable, contexts, contexts.allContexts[firstToken]]);
            return [contexts.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (contexts.mainContext ? contexts.allContexts[contexts.mainContext] : null);
        // console.log(["getContextForVariable", variable, contexts, context]);
        return [context, variable];
    }

    static getRolledModifiers(variable, context) {
        let variableString = variable + ".rolledMods";
        let variableRolledMods = RollNode._readValue(context.data, variableString);
        if (!variableRolledMods) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + ".rolledMods";
            variableRolledMods = RollNode._readValue(context.data, variableString);
        }
        // console.log(["getRolledModifiers", variable, context, variableString, variableRolledMods]);
        return variableRolledMods || [];
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
        return variableCalculatedMods || [];
    }

    static getTooltips(variable, context, tooltipPath = ".tooltip") {
        let variableString = variable + tooltipPath;
        let variableRolledMods = RollNode._readValue(context.data, variableString);
        if (!variableRolledMods) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + tooltipPath;
            variableRolledMods = RollNode._readValue(context.data, variableString);
        }
        // if we are looking for ranks then don't include all the tooltips just the ones for ranks
        if (variableRolledMods && variable.substring(variable.lastIndexOf('.') + 1) === "ranks") {
            variableRolledMods = variableRolledMods.filter((x) => x.toLowerCase().includes("rank"));
        }
        // console.log(["getRolledModifiers", variable, context, variableString, variableRolledMods]);
        return variableRolledMods || [];
    }

    static _readValue(object, key) {
        // console.log(["_readValue", key, object]);
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }
}
