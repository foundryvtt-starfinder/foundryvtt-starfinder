import BaseEnricher, { getDatasetfromEvent } from "./base.js";
/** @import { ItemSFRPG } from "../../item/item.js" */

/**
 * Create a link to a condition by slug, allowing for alterations
 * @class
 */
export default class ConditionEnricher extends BaseEnricher {
    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Condition";
    }

    /** @inheritdoc */
    get validTypes() {
        return Object.keys(CONFIG.SFRPG.conditions);
    }

    /** @returns {string} */
    get conditionSlug() {
        return this.args.type.slugify({replacement: "_", strict: true});
    }

    /** @returns {ItemSFRPG} */
    get condition() {
        return game.sfrpg.conditionCache.get(this.conditionSlug);
    }

    async validateName() {
        let string = `${this.condition.name} `;

        if (this.args.unit === "permanent") string += game.i18n.localize("SFRPG.Enrichers.Condition.Permanently");

        else if (this.args.duration && this.args.unit) {
            string += game.i18n.format("SFRPG.Enrichers.Condition.Duration", {
                duration: this.args.duration,
                unit: CONFIG.SFRPG.effectDurationTypes[this.args.unit] || this.args.unit
            });
        }

        else if (this.args.duration) {
            string += game.i18n.format("SFRPG.Enrichers.Condition.Duration", {
                duration: this.args.duration,
                unit: CONFIG.SFRPG.effectDurationTypes[this.condition.system.activeDuration.unit] || this.condition.system.activeDuration.unit
            });
        }

        this.name ||= string.trim();
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        a.dataset.condition = this.conditionSlug;
        if (a.dataset.duration) a.dataset.duration = this.args.duration;
        if (a.dataset.unit) a.dataset.unit = this.args.unit;

        a.draggable = true;

        a.innerHTML = `<i class="fas fa-stopwatch"></i>${a.innerHTML}`;

        return a;

    }

    static listeners = {
        "click": this.#onClick,
        "dragstart": this.#onDragStart
    };

    /** @param {PointerEvent} event */
    static async #onClick(event) {
        const data = getDatasetfromEvent(event);
        const condition = game.sfrpg.conditionCache.get(data.condition);

        condition.sheet.render({force: true});
    }

    /** @param {DragEvent} event */
    static async #onDragStart(event) {
        const data = getDatasetfromEvent(event);
        const doc = game.sfrpg.conditionCache.get(data.condition);
        const condition = doc.toObject();

        if (data.duration) condition.system.activeDuration.value = data.duration;

        if (data.unit && Object.keys(CONFIG.SFRPG.durationTypes).includes(data.unit)) condition.system.activeDuration.unit = data.unit;

        event.dataTransfer.setData("text/plain", JSON.stringify({data: condition, type: "Item", uuid: doc.uuid}));
    }

}
