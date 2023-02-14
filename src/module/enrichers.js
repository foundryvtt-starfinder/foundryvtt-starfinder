import { getAlienArchiveBrowser } from "./packs/alien-archive-browser.js";
import { getEquipmentBrowser } from "./packs/equipment-browser.js";
import { getSpellBrowser } from "./packs/spell-browser.js";
import { getStarshipBrowser } from "./packs/starship-browser.js";

/**
 * @typedef {Object} CustomEnricher
 * @property {RegExp} pattern
 * @property {EnricherFunction} enricher
 */

const enricherListeners = {
    "Browser": _browserOnClick
};

Hooks.on("renderJournalPageSheet", (app, html, options) => {
    for (const action of CONFIG.SFRPG.enricherTypes) {
        const enricherListener = enricherListeners[action];
        html[2]?.querySelectorAll(`a[data-action=${action}]`)
            ?.forEach(i => {
                i.addEventListener("click", (ev) => enricherListener(ev, i.dataset));
            });

    }
});

function _browserOnClick(ev, data) {
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

/**
 * Abstract base class for enrichers which carries validation and basic element creation
 * @abstract
 * @class
 */
class BaseEnricher {

    /** @type {CustomEnricher} */
    constructor() {
        this.pattern = new RegExp(`(@${this.enricherType})\\[(.+?)\\](?:{(.+?)})?`, "gm");
        this.enricher = this.enricherFunc.bind(this);
    }

    /**
     * The type of custom enricher, i.e the word following the @
     * @returns {String}
    */
    get enricherType() {
        return "";
    }

    /**
     * Valid options for the type argument
     * @returns {Array}
     */
    get validTypes() {
        return [];
    }

    /**
     * An object of FA icons to be used in the element
     * @returns {Object}
     */
    get icons() {
        return {};
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
            const split = i.match(/(\w+):(\w+|{.+})/);
            if (split?.length > 0) {
                obj[split[1]] = split[2];
            }

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
            strong.innerText = `${this.match[1]} parsing failed! Type is invalid.`;
            this.element = strong;
            return false;
        }
        return true;
    }

    /**
     * Sets a default name if none was given
     */
    validateName() {
        if (!this.name) {
            this.name = this.args.type.capitalize() + " Browser";
        }
    }

    /**
     * Create a HTML element and affix some data.
     * Can be called in subclasses by assigning the super to a local variable.
     * @returns {HTMLElement}
     */
    createElement() {
        const a = document.createElement("a");

        a.dataset.action = this.enricherType;
        a.dataset.type = this.args.type;

        a.classList.add("enriched-link");
        a.draggable = false;

        a.innerHTML = this.name;

        return a;
    }
}

export class BrowserEnricher extends BaseEnricher {
    // E.g @Browser[type:equipment|filters:{"equipmentTypes":"weapon","weaponTypes":"smallA","weaponCategories":"cryo","search":"Big Gun"}]
    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Browser";
    }

    /** @inheritdoc */
    get validTypes() {
        return ["spell", "equipment", "starship", "alien"];
    }

    /** @inheritdoc */
    get icons() {
        return {
            equipment: "fa-gun",
            spell: "fa-sparkles",
            starship: "fa-rocket",
            alien: "fa-alien"
        };
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        if (this.args.filters) a.dataset.filters = JSON.stringify(this.args.filters);

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${this.name}`;

        return a;

    }

}
