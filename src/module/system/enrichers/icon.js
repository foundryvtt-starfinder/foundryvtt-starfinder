import BaseEnricher from "./base.js";

/**
 * Create a gameplay icon, such as Solarian mode icons
 * @class
 */
export default class IconEnricher extends BaseEnricher {
    // @Icon[type:graviton]
    // @Icon[type:mind-affecting]

    /** @inheritdoc */
    get enricherType() {
        return /** @type {const}*/("Icon");
    }

    /** @inheritdoc */
    get validTypes() {
        return /** @type {const}*/(["photon", "graviton", "language-dependent", "mind-affecting", "sense-dependent"]);
    }

    /** @inheritdoc */
    get icons() {
        return /** @type {const}*/({
            "photon": "systems/sfrpg/images/cup/gameplay/photon.webp",
            "graviton": "systems/sfrpg/images/cup/gameplay/graviton.webp",
            "language-dependent": "systems/sfrpg/images/cup/gameplay/language.webp",
            "mind-affecting": "systems/sfrpg/images/cup/gameplay/mind.webp",
            "sense-dependent": "systems/sfrpg/images/cup/gameplay/sense.webp"
        });
    }

    /**
     * @overrides BaseEnricher
     * @returns {HTMLImageElement}
     */
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

        img.classList.add("icon-enricher");
        img.alt = name;
        img.src = this.icons[this.args.type];
        img.loading = "lazy";

        return img;
    }
}
