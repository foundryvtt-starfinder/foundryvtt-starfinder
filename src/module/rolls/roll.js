// Documentation typedefs
/**
 * A data structure for outputing any metadata that is rendered at the bottom
 * of a Roll chat card.
 *
 * @typedef {Object} Tag
 * @property {string} tag Text that will be addeded as a class on an HTMLElement
 * @property {string} text The text rendered on the card.
 */

import { DiceSFRPG } from "../dice.js";

/**
 * A structure for passing data into an HTML for for use in data- attributes.
 *
 * @typedef {Object} HtmlData
 * @property {string} name The name of the data property sans data-
 * @property {string} value The value of the data property.
 */

/**
 * A custom implementation for the foundry {@link Roll} class.
 *
 * @inheritdoc
 */
export default class SFRPGRoll extends Roll {
    constructor(formula, data = {}, options = {}) {
        const rollData = {
            formula: formula,
            data: data,
            options: options
        };
        Hooks.callAll("onBeforeRoll", rollData);

        super(rollData.formula, rollData.data, rollData.options);

        /** @type {Tag[]} */
        this.tags = rollData.data.tags;
        /** @type {string} */
        this.breakdown = rollData.data.breakdown;
        /** @type {HtmlData[]} */
        this.htmlData = rollData.data.htmlData;
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
            if (t instanceof OperatorTerm || t instanceof StringTerm) return t;
            if (t.isDeterministic) {
                let total = 0;
                try {
                    total = t?.total || Roll.safeEval(t.expression);
                } catch {
                    total = Roll.safeEval(t.expression);
                }
                return new NumericTerm({number: total});
            }
            return t;
        });
        return DiceSFRPG.simplifyRollFormula(Roll.fromTerms(newterms).formula) || "0";
    }

    /** @inheritdoc */
    static CHAT_TEMPLATE = "systems/sfrpg/templates/dice/roll.hbs";
    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = "systems/sfrpg/templates/dice/tooltip.hbs";

    /** @override */
    async render(chatOptions = {}) {
        chatOptions = mergeObject({
            user: game.user.id,
            flavor: null,
            template: this.constructor.CHAT_TEMPLATE,
            blind: false
        }, chatOptions);
        const isPrivate = chatOptions.isPrivate;

        if (chatOptions?.breakdown) this.breakdown = chatOptions.breakdown;
        if (chatOptions?.tags) this.tags = chatOptions.tags;
        if (chatOptions?.htmlData) this.htmlData = chatOptions.htmlData;

        // Execute the roll, if needed
        if (!this._evaluated) this.evaluate();

        // Define chat data
        const chatData = {
            formula: isPrivate ? "???" : this.formula,
            flavor: isPrivate ? null : chatOptions.flavor,
            user: chatOptions.user,
            tooltip: isPrivate ? "" : await this.getTooltip(),
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
            tags: this.tags,
            breakdown: this.breakdown,
            htmlData: this.htmlData,
            rollNotes: this.htmlData?.find(x => x.name === "rollNotes")?.value
        };

        // Render the roll display template
        return renderTemplate(chatOptions.template, chatData);
    }
}
