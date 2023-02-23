import CheckNameHelper from "../../utils/skill-names.js";
import BaseEnricher from "./base.js";

/**
 * Roll a specific check
 * @class
 */
export default class CheckEnricher extends BaseEnricher {
    // @Check[type:athletics]
    // @Check[type:life-science]
    // @Check[type:reflex]
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
            "bluff": "fa-comment",
            "computers": "fa-computer",
            "culture": "fa-flag",
            "diplomacy": "fa-handshake",
            "disguise": "fa-mask",
            "engineering": "fa-gear",
            "intimidate": "fa-face-angry",
            "life-science": "fa-dna",
            "medicine": "fa-syringe",
            "mysticism": "fa-hand-sparkles",
            "perception": "fa-magnifying-glass",
            "profession": "fa-user-tie",
            "physical-science": "fa-flask",
            "piloting": "fa-plane",
            "sense-motive": "fa-person-circle-question",
            "sleight-of-hand": "fa-hands",
            "stealth": "fa-moon",
            "survival": "fa-campground",

            "fortitude": "fa-shield-heart",
            "reflex": "fa-person-running",
            "will": "fa-brain",

            "strength": "fa-weight-hanging",
            "dexterity": "fa-feather-pointed",
            "constitution": "fa-heart-pulse",
            "intelligence": "fa-glasses",
            "wisdom": "fa-mountain-sun",
            "charisma": "fa-people-arrows",

            "caster-level": "fa-wand-magic-sparkles"
        };
    }

    /**
     * @override to check using the 3-letter identifier for the type against the valid types (which are 3 letter identifiers).
     * Inputted types are full names.
     */
    typeIsValid() {
        if (!this.args.type || !this.validTypes.includes(CheckNameHelper.shortFormName(this.args.type))) {
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

        if (this.args.dc) a.dataset.dc = parseInt(this.args.dc);

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${this.name}`;

        return a;

    }

    static hasListener = true;

    static listener(ev, data) {
        const actor = _token?.actor ?? game.user?.character;
        if (!actor) return ui.notifications.error("You must have a token or an actor selected.");
        const id = CheckNameHelper.shortFormName(data.type);

        if      (Object.keys(CONFIG.SFRPG.skills).includes(id))    actor.rollSkill(CheckNameHelper.shortFormName(data.type));
        else if (Object.keys(CONFIG.SFRPG.saves).includes(id))     actor.rollSave(CheckNameHelper.shortFormName(data.type));
        else if (Object.keys(CONFIG.SFRPG.abilities).includes(id)) actor.rollAbility(CheckNameHelper.shortFormName(data.type));

    }

}
