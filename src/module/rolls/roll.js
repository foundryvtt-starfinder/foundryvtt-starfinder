/**
 * A custom implementaion for the foundry {@link Roll} class.
 * 
 * @inheritdoc
 */
export default class SFRPGRoll extends Roll {
    constructor(formula, data={}, options={}) {
        super(formula, data, options);
    }

    /** @inheritdoc */
    static CHAT_TEMPLATE = "systems/sfrpg/templates/dice/roll.html";
    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = "systems/sfrpg/templates/dice/tooltip.html";
}