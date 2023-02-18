import BaseEnricher from "./base.js";

export default class IconEnricher extends BaseEnricher {

    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Icon";
    }

    /** @inheritdoc */
    get validTypes() {
        return ["photon", "graviton", "language-dependent", "mind-affecting", "sense-dependent"];
    }

    /** @inheritdoc */
    get icons() {
        return {
            "photon": "systems/sfrpg/images/cup/gameplay/photon.webp",
            "graviton": "systems/sfrpg/images/cup/gameplay/graviton.webp",
            "language-dependent": "systems/sfrpg/images/cup/gameplay/language.webp",
            "mind-affecting": "systems/sfrpg/images/cup/gameplay/mind.webp",
            "sense-dependent": "systems/sfrpg/images/cup/gameplay/sense.webp"
        };
    }

    /**
     * @overrides BaseEnricher
     * @returns {HTMLImageElement} */
    createElement() {
        const img = document.createElement("img");

        img.dataset.action = this.enricherType;
        img.dataset.type = this.args.type;

        img.width = 20;
        img.height = 20;
        img.src = this.icons[this.args.type];

        return img;
    }

    static hasListener = false;
}
