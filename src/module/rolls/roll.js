// Documentation typedefs
/**
 * A data structure for outputing any metadata that is rendered at the bottom
 * of a Roll chat card.
 * 
 * @typedef {Object} Tag
 * @property {string} tag Text that will be addeded as a class on an HTMLElement
 * @property {string} text The text rendered on the card.
 */

/**
 * A custom implementaion for the foundry {@link Roll} class.
 * 
 * @inheritdoc
 */
export default class SFRPGRoll extends Roll {
    constructor(formula, data={}, options={}) {
        super(formula, data, options);

        /** @type {Tag[]} */
        this.tags = data.tags;
        /** @type {string} */
        this.breakdown = data.breakdown;
    }

    /** @inheritdoc */
    static CHAT_TEMPLATE = "systems/sfrpg/templates/dice/roll.html";
    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = "systems/sfrpg/templates/dice/tooltip.html";

    /** @override */
    async render(chatOptions={}) {
        chatOptions = foundry.utils.mergeObject({
          user: game.user.id,
          flavor: null,
          template: this.constructor.CHAT_TEMPLATE,
          blind: false
        }, chatOptions);
        const isPrivate = chatOptions.isPrivate;

        if (chatOptions?.breakdown) this.breakdown = chatOptions.breakdown;
        if (chatOptions?.tags) this.tags = chatOptions.tags;
    
        // Execute the roll, if needed
        if (!this._evaluated) this.evaluate();
    
        // Define chat data
        const chatData = {
          formula: isPrivate ? "???" : this._formula,
          flavor: isPrivate ? null : chatOptions.flavor,
          user: chatOptions.user,
          tooltip: isPrivate ? "" : await this.getTooltip(),
          total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
          tags: this.tags,
          breakdown: this.breakdown
        };
    
        // Render the roll display template
        return renderTemplate(chatOptions.template, chatData);
      }
}