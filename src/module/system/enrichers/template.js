import AbilityTemplate from "../../canvas/ability-template.js";
import BaseEnricher from "./base.js";

/**
 * Place a template
 * @class
 */
export default class TemplateEnricher extends BaseEnricher {
    // @Check[type:sphere|distance:30|color:#ff0000|texture:some/file/path]
    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Template";
    }

    /** @inheritdoc */
    get validTypes() {
        return Object.keys(CONFIG.SFRPG.spellAreaShapes).filter(t => !["", "other"].includes(t));
    }

    /** @inheritdoc */
    get icons() {
        return {
            "sphere": "fa-circle",
            "cone": "fa-triangle",
            "cube": "fa-square",
            "cylinder": "fa-circle",
            "line": "fa-grip-lines-vertical"
        };
    }

    /**
     * @override to check if distance is valid too
     */
    isValid() {
        if (!this.args.type || !this.validTypes.includes(this.args.type)) {
            return this._failValidation("Type");
        }
        if (!this.args.distance || !this.args.distance > 0) {
            return this._failValidation("Distance");
        }

        return true;
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        a.dataset.distance = parseInt(this.args.distance);
        if (this.args.color) {
            this.args.color.startsWith("#") ? a.dataset.color = this.args.color : a.dataset.color = `#${this.args.color}`;
        }
        if (this.args.texture) a.dataset.texture = this.args.texture;

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${a.innerHTML}`;

        return a;

    }

    static hasRepost = true;
    static hasListener = true;

    static async listener(event) {
        let { type, distance, color, texture } = event.currentTarget.dataset;

        type = {
            "sphere": "circle",
            "cone": "cone",
            "cube": "rect",
            "cylinder": "circle",
            "line": "ray"
        }[type] || null;

        if (!type) return;

        const template = AbilityTemplate.fromData({
            type: type || "circle",
            distance: distance ||  0,
            color: color || null,
            texture: texture || null,
            hidden: event.altKey
        });

        if (!template) return;

        const placed = await template.drawPreview();
        if (placed) template.place(); // If placement is confirmed

    }

}
