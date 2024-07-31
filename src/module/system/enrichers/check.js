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

    get checkType() {
        const shortName = CheckNameHelper.shortFormName(this.args.type);
        const C = CONFIG.SFRPG;

        if (shortName in C.skills) return "skill";
        else if (shortName in C.saves) return "save";
        else if (shortName in C.abilities) return "ability";
        else return null;
    }

    get localizedType() {
        const C = CONFIG.SFRPG;
        const { type } = this.args;

        switch (this.checkType) {
            case "skill": return C.skills[type];
            case "save": return C.saves[type];
            case "ability": return C.abilities[type];
            default: return "";
        }
    }

    /**
     * @override to check using the 3-letter identifier for the type against the valid types (which are 3 letter identifiers).
     * Inputted types are full names.
     */
    isValid() {
        if (!this.args.type || !this.validTypes.includes(CheckNameHelper.shortFormName(this.args.type))) {
            return this._failValidation("Type");
        }

        return true;
    }

    validateName() {
        const i18nPath = this.checkType === save ? "SFRPG.Save" : "SFRPG.Check";
        const localizedCheck = game.i18n.localize(i18nPath);

        this.name ||= `${this.localizedType} ${localizedCheck}`;
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        if (this.args.dc) a.dataset.dc = parseInt(this.args.dc);

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${a.innerHTML}`;

        return a;

    }

    static hasRepost = true;
    static hasListener = true;

    static listener(event) {
        const data = event.currentTarget.dataset;

        const actor = _token?.actor ?? game.user?.character;
        if (!actor) return ui.notifications.error("You must have a token or an actor selected.");
        const id = CheckNameHelper.shortFormName(data.type);

        if      (id in CONFIG.SFRPG.skills)    actor.rollSkill(id);
        else if (id in CONFIG.SFRPG.saves)     actor.rollSave(id);
        else if (id in CONFIG.SFRPG.abilities) actor.rollAbility(id);

    }

}
