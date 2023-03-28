import BaseEnricher from "./base.js";

/**
 * Create a gameplay icon, such as Solarian mode icons
 * @class
 */
export default class IconEnricher extends BaseEnricher {
    // @Icon[type:graviton]
    // @Icon[type:mind-affecting]
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
        const name = game.i18n.localize(
            // Kebab case to Pascal case
            this.args.type.split('-')
                .map(word => word.capitalize())
                .join('')
        );

        img.dataset.action = this.enricherType;
        img.dataset.type = this.args.type;
        img.dataset.tooltip = `SFRPG.Enrichers.Icon.Types.${name}`;

        img.width = 20;
        img.height = 20;
        img.alt = name;
        img.src = this.icons[this.args.type];

        return img;
    }

    static hasListener = false;
}
