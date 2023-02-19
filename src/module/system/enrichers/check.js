import SkillNameHelper from "../../utils/skill-names.js";
import BaseEnricher from "./base.js";

export default class CheckEnricher extends BaseEnricher {

    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Check";
    }

    /** @inheritdoc */
    get validTypes() {
        return [
            ...Object.keys(CONFIG.SFRPG.skills),
            ...Object.keys(CONFIG.SFRPG.saves),
            ...Object.keys(CONFIG.SFRPG.abilities),
            "caster-level"
        ];
    }

    /** @inheritdoc */
    get icons() {
        return {
            "acrobatics": "fa-person-walking",
            "athletics": "fa-dumbbell",
            "bluff": "fa-comment-xmark",
            "computers": "fa-computer",
            "culture": "fa-flag",
            "diplomacy": "fa-handshake",
            "disguise": "fa-face-disguise",
            "engineering": "fa-gear",
            "intimidate": "fa-face-angry",
            "life-science": "fa-dna",
            "medicine": "fa-syringe",
            "mysticism": "fa-sparkles",
            "perception": "fa-magnifying-glass",
            "profession": "fa-user-tie",
            "physical-science": "fa-flask",
            "piloting": "fa-plane",
            "sense-motive": "fa-person-circle-question",
            "sleight-of-hand": "fa-hands",
            "stealth": "fa-moon",
            "survival": "fa-campfire",

            "fortitude": "fa-shield-heart",
            "reflex": "fa-person-running",
            "will": "fa-brain",

            "strength": "fa-weight-hanging",
            "dexterity": "fa-feather",
            "constitution": "fa-heart-pulse",
            "intelligence": "fa-glasses",
            "wisdom": "fa-book-sparkles",
            "charisma": "fa-user-group",

            "caster-level": "fa-wand-magic-sparkles"
        };
    }

    /**
     * @override to check using the 3-letter identifier for the type against the valid types (which are 3 letter identifiers).
     * Inputted types are full names.
     */
    typeIsValid() {
        if (!this.args.type || !this.validTypes.includes(SkillNameHelper.shortFormName(this.args.type))) {
            const strong = document.createElement("strong");
            strong.innerText = `${this.match[1]} parsing failed! Type is invalid.`;
            this.element = strong;
            return false;
        }

        return true;
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        if (this.args.filters) a.dataset.filters = parseInt(this.args.dc);

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${this.name}`;

        return a;

    }

    static hasListener = true;

    static listener(ev, data) {
        let browser, filters;

        // Gotta double parse this to get rid of escape characters from the HTML.
        try {
            if (data.filters) filters = JSON.parse(JSON.parse(data.filters));
        } catch (err) {
            return ui.notifications.error(`Error parsing filters: ${err}`);
        }

        switch (data.type) {
            case "spell":
                browser = getSpellBrowser();
                break;
            case "equipment":
                browser = getEquipmentBrowser();
                break;
            case "starship":
                browser = getStarshipBrowser();
                break;
            case "alien":
                browser = getAlienArchiveBrowser();
                break;
            default:
                ui.notifications.error("Invalid type.");
        }
        if (browser) browser.renderWithFilters(filters);
    }

}
