import { ItemSFRPG } from "../../item/item.js";
import BaseEnricher from "./base.js";
/** @import { SFRPGItemEffect } from "../../data/_module.mjs" */

/**
 * Create a link to a condition by slug, allowing for alterations
 * @class
 */
export default class ConditionEnricher extends BaseEnricher {

    /** @inheritdoc */
    get enricherType() {
        return /** @type {const}*/("Condition");
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
        const modified = this.getModifiedSource({
            duration: this.args.duration,
            unit: this.args.unit
        });

        const durationString = /** @type {SFRPGItemEffect}*/(new ItemSFRPG(modified).system).getTextDurationString();

        this.name ||= durationString;
    }

    isValid() {
        if (this.args.damage && !Roll.validate(this.args.damage)) {
            return this._failValidation("Damage", this.args.damage);
        }

        if (this.args.damageType) {
            const types = this.parseDamageTypes(this.args.damageType);

            if (types.some(i => !Object.keys(CONFIG.SFRPG.damageTypes).includes(i)))
                return this._failValidation("Damage Type", this.args.damageType);

        }

        if (this.args.trigger && !Object.keys(CONFIG.SFRPG.effectEndTypes).includes(this.args.trigger)) {
            return this._failValidation("Trigger", this.args.trigger);
        }

        return true;
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement}
     */
    createElement() {
        const a = super.createElement();

        a.dataset.condition = this.conditionSlug;
        if (this.args.duration) a.dataset.duration = this.args.duration;
        if (this.args.unit) a.dataset.unit = this.args.unit;
        if (this.args.damage) a.dataset.damage = this.args.damage;
        if (this.args.damageType) a.dataset.damageType = this.args.damageType;
        if (this.args.trigger) a.dataset.trigger = this.args.trigger;

        a.draggable = true;

        a.innerHTML = `<i class="fas fa-stopwatch"></i>${a.innerHTML}`;

        return a;

    }

    listeners = {
        "click": this.#onClick,
        "dragstart": this.#onDragStart
    };

    /** @param {PointerEvent} event */
    async #onClick(event) {
        const { duration, unit, damage, damageType, trigger } = this.getDatasetfromEvent(event);

        const modified = this.getModifiedSource({ duration, unit, damage, damageType, trigger });

        new ItemSFRPG(modified).sheet.render(true, {editable: false});
    }

    /** @param {DragEvent} event */
    async #onDragStart(event) {
        const { duration, unit, damage, damageType, trigger } = this.getDatasetfromEvent(event);

        const modified = this.getModifiedSource({ duration, unit, damage, damageType, trigger });

        event.dataTransfer.setData("text/plain", JSON.stringify({data: modified, type: "Item", uuid: this.condition.uuid}));
    }

    /**
     * Apply modifications to the condition source. Returns the unchanged source if none are supplied.
     * @param {Record<string, ?string|undefined>} [obj={}]
     * @returns {object}
     */
    getModifiedSource({duration = null, unit = null, damage = null, damageType = null, trigger = null} = {}) {
        const condition = this.condition.toObject();

        if (duration) condition.system.activeDuration.value = duration;

        if (unit && Object.keys(CONFIG.SFRPG.durationTypes).includes(unit)) condition.system.activeDuration.unit = unit;

        if (damage && damageType) condition.system.turnEvents = condition.system.turnEvents.concat([
            {
                type: "roll",
                formula: damage,
                damageTypes: this.parseDamageTypes(damageType).reduce((obj, type) => {
                    obj[type] = true;
                    return obj;
                }, {}),
                trigger: trigger || "onTurnStart"
            }
        ]);

        return condition;
    }

    /**
     * Take a damage type string like `"fire,cold,acid"` and return an array of damage types, accounting for potential whitespace.
     * @param {string} damageTypes
     * @returns {(keyof typeof CONFIG.SFRPG.damageTypes)[]}
     */
    parseDamageTypes(damageTypes) {
        const types = damageTypes.toLowerCase().split(",");

        return types.map(t => t.trim());
    }

}
