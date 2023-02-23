/**
 * @typedef {Object} CustomEnricher
 * @property {RegExp} pattern
 * @property {EnricherFunction} enricher
 */

/**
 * Abstract base class for enrichers which carries validation and basic element creation.
 * @abstract
 * @class
 */
export default class BaseEnricher {

    /** @type {CustomEnricher} */
    constructor() {
        if (this.constructor === BaseEnricher) throw new Error(
            "The BaseEnricher class is an abstract class and may not be instantiated."
        );
        this.pattern = this.regex;
        this.enricher = this.enricherFunc.bind(this);
    }

    /**
     * The RegExp to capture the text.
     * @returns {RegExp}
     */
    get regex() {
        return new RegExp(`(@${this.enricherType})(\\[[^\\]]+)](?:{([^}]+)})?`, "gm");
    }

    /**
     * The type of custom enricher, i.e the word following the @
     * @returns {String}
    */
    get enricherType() {
        throw new Error("This method must be implemented on subclasses of BaseEnricher.");
    }

    /**
     * Valid options for the type argument
     * @returns {String[]}
     */
    get validTypes() {
        throw new Error("This method must be implemented on subclasses of BaseEnricher.");
    }

    /**
     * An object of FA icons to be used in the element
     * @returns {Object}
     */
    get icons() {
        throw new Error("This method must be implemented on subclasses of BaseEnricher.");
    }

    /**
     * Transform the Regex match array into an enriched element, performing validation.
     * @callback EnricherFunction
     * @param {RegExp} match A Regex match array from the inputted text
     * @param {Object} options
     * @returns {HTMLElement} The enriched element
     */
    enricherFunc(match, options) {
        this.match = match;

        if (this.match[3]) this.name = this.match[3];
        else this.name = undefined;

        this.parseArgs();

        // Early return an error element if invalid
        if (!this.typeIsValid()) return this.element;

        this.validateName();

        this.element = this.createElement();

        return this.element;
    }

    /**
     * Transform the args in the orginal text to an object
     */
    parseArgs() {
        // Split each argument from the square brackets
        const args = this.match[2].split("|");

        this.args = args.reduce((obj, i) => {
            // Split each arg into a key and a value
            // Matches a colon with a letter before, and either a letter or JSON after.
            // Set up as to not split colons in JSONs
            const split = i.match(/(\w*):({.*}?|[\w-]+)/);
            if (split?.length > 0) obj[split[1]] = split[2];

            return obj;
        }, {});
    }

    /**
     * Checks if there is a type argument, and that it is valid for the enricher's type.
     * Sets this.element if invalid for an early return.
     * @returns {Boolean}
     */
    typeIsValid() {
        if (!this.args.type || !this.validTypes.includes(this.args.type)) {
            const strong = document.createElement("strong");
            strong.innerText = game.i18n.format("SFRPG.Enrichers.TypeError", {enricherType: this.match[1]});
            this.element = strong;
            return false;
        }

        return true;
    }

    /**
     * Sets a default name if none was given
     */
    validateName() {
        this.name ||= `${this.args.type.capitalize()} ${this.enricherType}`;
    }

    /**
     * Create a HTML element and affix some data.
     * Can be called in subclasses by assigning the super to a local variable.
     * @returns {HTMLAnchorElement}
     */
    createElement() {
        const a = document.createElement("a");

        a.dataset.action = this.enricherType;
        a.dataset.type = this.args.type;

        a.classList.add("enriched-link");
        a.draggable = false;

        a.innerText = this.name;

        return a;
    }

    /**
     * Whether the enricher has an event listener.
     * @type {Boolean}
     */
    static hasListener = false;

    /**
     * A callback function to run when the element is clicked.
     * @param {Event} ev The DOM event that triggers the listener
     * @param {HTMLDataset} data The element's dataset
     * @returns {*}
     */
    static listener(ev, data) {}
}

/** --------------------------------
 * Add listeners
    ----------------------------- */

const sheets = [
    "ActorSheet",
    "ItemSummary",
    "ItemCollectionSheet",
    "ItemSheet",
    "ChatMessage",
    "JournalPageSheet"
];

for (const sheet of sheets) {
    Hooks.on(`render${sheet}`, (app, html, options) => {
        for (const [action, cls] of Object.entries(CONFIG.SFRPG.enricherTypes)) {
            if (!cls.hasListener) continue;

            const enricherListener = cls.listener;
            html[sheet !== "JournalPageSheet" ? 0 : 2]?.querySelectorAll(`a[data-action=${action}]`)
                ?.forEach(i => {
                    i.addEventListener("click", (ev) => enricherListener(ev, i.dataset));
                });
        }
    });
}
