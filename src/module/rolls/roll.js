import { DiceSFRPG } from "../dice.js";
const { terms, Roll } = foundry.dice;
// Documentation typedefs
/**
 * A data structure for outputing any metadata that is rendered at the bottom
 * of a Roll chat card.
 *
 * @typedef {Object}    Tag
 * @property {string}   tag     Text that will be addeded as a class on an HTMLElement
 * @property {string}   text    The text rendered on the card.
 */

/**
 * A structure for holding data defining roll criteria. These indicate what a roll can do,
 * whether it can be evaluated against a target number (AC, DC, etc.), critical/fumble values,
 * and the roll's type
 *
 * @typedef     {Object}    RollCriteria
 * @property    {boolean}   canEvaluate     Whether it's possible to evaluate the roll against a target number (AC, DC, etc.)
 * @property    {string}    mainDie         A string representing the main die to be rolled as part of the roll (e.g. "1d20"). null for damage and healing rolls
 * @property    {string}    rollType        The type of roll (options in CONFIG.SFRPG.rollTypes)
 * @property    {number}    [critical]      The die value at or above which is deemed a critical success
 * @property    {number}    [evalValue]     The value that a roll is evaluated against
 * @property    {number}    [fumble]        The die value at or below which is deemed a fumble
 */

/**
 * A custom implementation for the foundry {@link foundry.dice.Roll} class.
 *
 * @inheritdoc
 */
export default class SFRPGRoll extends Roll {
    constructor(formula, data = {}, options = {}) {
        if (!options.rollCriteria) {
            options.rollCriteria = SFRPGRoll.createRollCriteria("roll");
        }
        Hooks.callAll("onBeforeRoll", {formula, data, options});
        super(formula, data, options);
    }

    /**
     * Return the tags passed to a roll
     *
     * @type {Tag[]}
     */
    get tags() {
        return this.options.tags ?? [];
    }

    /**
     * Return the roll's breakdown
     *
     * @type {String}
     */
    get breakdown() {
        return this.options.breakdown ?? "";
    }

    /**
     * Return the roll's type
     *
     * @type {string}
     */
    get rollType() {
        return this.options.rollCriteria.rollType ?? "";
    }

    /**
     * Return the roll's evaluation value (if present)
     *
     * @type {string}
     */
    get evalValue() {
        if (this.options.rollCriteria.canEvaluate) return this.options.rollCriteria.evalValue;
        else return null;
    }

    /**
    * Determine if a roll was a critical success or not
    * Only attack rolls, gunnery checks, saves, and starship actions can be fumbles.
    *
    * @type {Boolean}   `true` if a critical success, `false` otherwise
    */
    get isCritical() {
        if (!this?.dice?.length || !this.options.rollCriteria.canEvaluate) return false;
        if (!["attack", "gunnery", "save", "starshipAction"].includes(this.rollType)) return false;
        const mainDie = this.options.rollCriteria.mainDie;
        const dieSize = mainDie ? Number(mainDie.split('d')[1]) : null;
        const critValue = this.options.rollCriteria.critical;

        for (const d of this.dice) {
            if (d.faces === dieSize && d.results.length === 1 && critValue) {
                if (d.total >= critValue) return true;
            }
        }

        return false;
    }

    /**
     * Determine if a roll is a "damage roll" (i.e. is intended to be applied to HP or SP).
     *
     * @returns {Boolean}   `true` if rollType is "damage" or "healing"
     */
    get isDamageRoll() {
        return ["damage", "healing"].includes(this.options.rollCriteria.rollType);
    }

    /**
    * Determine if a roll was a fumble or not.
    * Only attack rolls, gunnery checks, saves, and starship actions can be fumbles.
    *
    * @returns {Boolean}    `true` if a fumble, `false` otherwise
    */
    get isFumble() {
        if (!this?.dice?.length || !this.options.rollCriteria.canEvaluate) return false;
        if (!["attack", "gunnery", "save", "starshipAction"].includes(this.rollType)) return false;
        const mainDie = this.options.rollCriteria.mainDie;
        const dieSize = mainDie ? Number(mainDie.split('d')[1]) : null;
        const fumbleValue = this.options.rollCriteria.fumble;

        for (const d of this.dice) {
            if (d.faces === dieSize && d.results.length === 1 && fumbleValue) {
                if (d.total <= fumbleValue) return true;
            }
        }

        return false;
    }

    /**
     * Return the roll's full set of criteria
     *
     * @type {RollCriteria}
     */
    get rollCriteria() {
        return this.options.rollCriteria;
    }

    /**
     * Return a prettified formula of the roll with Math terms such as "floor()" and "lookupRange()" resolved.
     *
     * Used for before the prettified formula created by Roll.evaluate() is available.
     * @type {string}
     */
    get simplifiedFormula() {
        if (this._evaluated) return this.formula;
        const newterms = this.terms.map(t => {
            if (t instanceof terms.OperatorTerm || t instanceof terms.StringTerm) return t;
            if (t.isDeterministic) {
                let total = 0;
                try {
                    total = t?.total || Roll.safeEval(t.expression);
                } catch {
                    total = Roll.safeEval(t.expression);
                }
                return new terms.NumericTerm({number: total});
            }
            if (t instanceof terms.Die) {
                if (t._number.isDeterministic) {
                    let total = 0;
                    try {
                        total = t?.total || Roll.safeEval(t._number);
                    } catch {
                        total = Roll.safeEval(t._number);
                    }
                    return new terms.Die({faces: t.faces, number: total});
                }
            }
            return t;
        });
        return DiceSFRPG.simplifyRollFormula(Roll.fromTerms(newterms).formula) || "0";
    }

    /**
     * @override
     * Evaluates whether a roll is a success or a failure, if an evalValue is present (typically only for d20 rolls)
     * Does not account for critical success or fumbles; check this.isCritical and this.isFumble.
     *
     * @type {Boolean}  returns false for failure, true for success, null if not evaluated
     */
    get product() {
        const total = this.total;
        const evalValue = this.evalValue;
        if ((evalValue !== null) && (typeof total === "number")) {
            return total >= evalValue;
        } else {
            return null;
        }
    }

    /** @override */
    async render(chatOptions = {}) {
        chatOptions = foundry.utils.mergeObject({
            author: game.user.id,
            flavor: null,
            template: this.constructor.CHAT_TEMPLATE,
            blind: false,
            tags: this.tags,
            breakdown: this.breakdown,
            evalValue: this.evalValue,
            rollCriteria: this.rollCriteria
        }, chatOptions);
        const isPrivate = chatOptions.isPrivate;

        // Execute the roll, if needed
        if (!this._evaluated) await this.evaluate();

        // Define chat data
        const chatData = {
            formula: isPrivate ? "???" : this.formula,
            flavor: isPrivate ? null : chatOptions.flavor,
            author: chatOptions.user,
            tooltip: isPrivate ? "" : await this.getTooltip(),
            customTooltip: chatOptions.customTooltip,
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
            tags: chatOptions.tags,
            breakdown: chatOptions.breakdown
        };

        // Render the roll display template
        return foundry.applications.handlebars.renderTemplate(chatOptions.template, chatData);
    }

    /** @inheritdoc */
    static CHAT_TEMPLATE = "systems/sfrpg/templates/dice/roll.hbs";
    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = "systems/sfrpg/templates/dice/tooltip.hbs";

    static MATH_PROXY = new Proxy(Math, {
        has: () => true, // Include everything
        get: (t, k) => k === Symbol.unscopables ? undefined : t[k]
        // set: () => console.error("You may not set properties of the Roll.MATH_PROXY environment") // Yes-op!
    });

    static registerMathFunctions() {
        function lookup(value) {
            for (let i = 1; i < arguments.length - 1; i += 2) {
                if (arguments[i] === value) {
                    return arguments[i + 1];
                }
            }
            return 0;
        }

        function lookupRange(value, lowestValue) {
            let baseValue = lowestValue;
            for (let i = 2; i < arguments.length - 1; i += 2) {
                if (arguments[i] > value) {
                    return baseValue;
                }
                baseValue = arguments[i + 1];
            }
            return baseValue;
        }

        this.MATH_PROXY = foundry.utils.mergeObject(this.MATH_PROXY, {
            eq: (a, b) => a === b,
            gt: (a, b) => a > b,
            gte: (a, b) => a >= b,
            lt: (a, b) => a < b,
            lte: (a, b) => a <= b,
            ne: (a, b) => a !== b,
            ternary: (condition, ifTrue, ifFalse) => (condition ? ifTrue : ifFalse),
            lookup,
            lookupRange
        });

    }

    /**
     * @override
     * Wrapper around Roll.parse to try and wrap loose function terms (e.g `floor(...)d6`) in parentheses to appease the roll parser.
     * We try the core parser first (as to not create any unintended side effects), and if that fails, try again with our transformation.
     * @param {string} formula  The original string expression to parse.
     * @param {object} data     A data object used to substitute for attributes in the formula.
     * @returns {RollTerm[]}
     */
    static parse(formula, data) {
        if (!formula) return [];

        try {
            return super.parse(formula, data);
        } catch (error) {
            console.debug(`Starfinder | Parsing formula ${formula}, deferring to custom system parsing. ${error}`);

            const regex = new RegExp(`\\b\\w+\\(([^()]|\\([^()]*\\))*\\)d(\\d|\\()`, "g");

            // Find all matches
            const matches = [...formula.matchAll(regex)];

            // Iterate over the matches and wrap them in parentheses
            let wrappedFormula = formula;

            // Go in reverse to prevent the positions from changing
            matches.reverse().forEach(match => {
                const originalMatch = match[0];
                const startPos = match.index;
                const dPos = originalMatch.lastIndexOf('d'); // Find the position of 'd'
                const wrappedMatch = `(${originalMatch.slice(0, dPos)})${originalMatch.slice(dPos)}`;

                // Replace the match in the formula using the calculated positions
                wrappedFormula = wrappedFormula.slice(0, startPos) + wrappedMatch + wrappedFormula.slice(startPos + originalMatch.length);
            });

            return super.parse(wrappedFormula, data);
        }
    }

    static replaceFormulaData(formula, data, options = {missing: 0, warn: true}) {
        formula = SFRPGRoll._insertValueProperty(formula, data);
        return super.replaceFormulaData(formula, data, options);
    }

    /**
    * A helper function to add the `.value` string to the end of referenced objects with the `value` subproperty.
    * This allows a property at the address `object.property.value` to be referenced in formulas as just `object.property`
    * @param {String} formula  A roll formula string
    * @param {Object} rollData The roll context data
    * @returns {String}        A modified roll formula string
    */
    static _insertValueProperty(formula, rollData) {
        const formulaVariables = [...formula.matchAll(/@[A-z0-9.]*/g)];
        if (!formulaVariables.length) return formula;
        for (const formulaVariable of formulaVariables) {
            const prop = formulaVariable[0].slice(1);
            const target = `${prop}.value`;
            if (foundry.utils.hasProperty(rollData, target)) {
                formula = formula.replace(prop, target);
            }
        }
        return formula;
    }

    /**
     * A helper function to generate a default RollCriteria object based on a given rollType
     * @param {string}          rollType    The type of roll to create a default RollCriteria object for
     * @returns {RollCriteria}
     */
    static createRollCriteria(rollType, options = {}) {
        let rollCriteria = {};
        switch (rollType) {
            case "abilityCheck":
            case "attack":
            case "gunnery":
            case "save":
            case "skillCheck":
                rollCriteria = {
                    canEvaluate: true,
                    critical: 20,
                    fumble: 1,
                    mainDie: "1d20",
                    rollType
                };
                break;
            case "concealment":
                rollCriteria = {
                    canEvaluate: true,
                    mainDie: "1d100",
                    rollType
                };
                break;
            case "damage":
            case "healing":
                rollCriteria = {
                    canEvaluate: false,
                    mainDie: null,
                    rollType
                };
                break;
            case "initiative":
                rollCriteria = {
                    canEvaluate: false,
                    mainDie: "1d20",
                    rollType
                };
                break;
            default:
                // "roll", "none", or otherwise
                rollCriteria = {
                    canEvaluate: false,
                    mainDie: null,
                    rollType
                };
        }
        return foundry.utils.mergeObject(rollCriteria, options, {overwrite: true});
    }
}
