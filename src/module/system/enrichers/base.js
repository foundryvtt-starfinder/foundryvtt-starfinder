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

    /** --------
    |           |
    |  Getters  |
    |           |
    ----------*/

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

    /** -------------------
    |                      |
    |  Element Generation  |
    |                      |
    ----------------------*/

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
        if (!this.isValid()) return this.element;

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
            // Matches a colon with a letter before, and either a JSON or character after.
            // Set up as to not split colons in JSONs
            const split = i.match(/(\w*):({.*}?|.+)/);
            if (split?.length > 0) obj[split[1]] = split[2];

            return obj;
        }, {});
    }

    /**
     * Checks if there is a type argument, and that it is valid for the enricher's type.
     * Sets this.element if invalid for an early return.
     * @returns {Boolean}
     */
    isValid() {
        if (!this.args.type || !this.validTypes.includes(this.args.type)) {
            return this._failValidation("Type");
        }

        return true;
    }

    /**
     * Create an error element after isValid() fails
     * @param {String} failedArg The argument that failed validation, to be used in the error element
     * @returns {false}
     */
    _failValidation(failedArg) {
        const strong = document.createElement("strong");
        strong.innerText = `${this.enricherType} parsing failed! ${failedArg} is invalid.`;
        this.element = strong;
        return false;
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
        let a = document.createElement("a");

        a.dataset.action = this.enricherType;
        a.dataset.type = this.args.type;

        a.classList.add("enriched-link");
        a.draggable = false;

        a.innerText = this.name;

        if (this.#_hasRepost) a = this.addRepost(a);

        return a;
    }

    /** -------
    |          |
    |  Repost  |
    |          |
    -----------*/

    /**
     * Should this enricher have a repost button appended to created elements?
     * Create both a publicly accessible static variable and an internal instance one.
     * @type {Boolean}
     */
    static hasRepost = false;
    /** @type {Boolean} */
    #_hasRepost = this.constructor.hasRepost;

    /**
     * Take an anchor element and append a repost button
     * @param {HTMLAnchorElement} a The original anchor
     * @returns The inputted Anchor, with a repost button appended
     */
    addRepost(a) {
        const repost = document.createElement("i");
        repost.classList.add("fas", "fa-comment-alt", "repost");
        repost.dataset.tooltip = "SFRPG.Enrichers.SendToChat";

        a.append(repost);

        return a;
    }

    /**
     * Handle repost button click, sending a chat message of the current target to chat.
     * @param {Event} event
     * @returns Create a chat message
     */
    static repostListener(event) {
        event.stopPropagation();

        return ChatMessage.create({content: event.currentTarget.parentElement.outerHTML});
    }

    /** ---------
    |            |
    |  Listener  |
    |            |
    ------------*/

    /**
     * Whether the enricher has an event listener.
     * @type {Boolean}
     */
    static hasListener = false;

    /**
     * A callback function to run when the element is clicked.
     * @param {Event} event The DOM event that triggers the listener
     * @returns {void}
     */
    static listener(event) {}

    /**
     * Add Event listeners to the DOM body at startup.
     */
    static addListeners() {
        const body = $("body");
        body.on("click", `i.repost`, this.repostListener);
        for (const [action, cls] of Object.entries(CONFIG.SFRPG.enricherTypes)) {
            if (cls.hasListener) body.on("click", `a[data-action="${action}"]`, cls.listener);
        }
    }
}
