/**
 * Override default tooltip class because tooltips appearing immediately when a tooltip is currently visible sucks.
 * Unfortunately the anything worth touching is private so we have to copy a lot of it. :/
 */
export default class TooltipManagerSFRPG extends TooltipManager {

    /**
     * Is the tooltip currently active?
     * @type {boolean}
     */
    #active = false;

    /**
     * A reference to a window timeout function when an element is activated.
     */
    #activationTimeout;

    /**
     * A reference to a window timeout function when an element is deactivated.
     */
    #deactivationTimeout;

    /**
     * An element which is pending tooltip activation if hover is sustained
     * @type {HTMLElement|null}
     */
    #pending;

    /**
     * Maintain state about active locked tooltips in order to perform appropriate automatic dismissal.
     * @type {{elements: Set<HTMLElement>, boundingBox: Rectangle}}
     */
    #locked = {
        elements: new Set(),
        boundingBox: {}
    };

    /* -------------------------------------------- */

    /**
     * Activate interactivity by listening for hover events on HTML elements which have a data-tooltip defined.
     */
    activateEventListeners() {
        document.body.addEventListener("pointerenter", this.#onActivate.bind(this), true);
        document.body.addEventListener("pointerleave", this.#onDeactivate.bind(this), true);
        document.body.addEventListener("pointerup", this._onLockTooltip.bind(this), true);
        document.body.addEventListener("pointermove", this.#testLockedTooltipProximity.bind(this), {
            capture: true,
            passive: true
        });
    }

    /* -------------------------------------------- */

    /**
     * Handle hover events which activate a tooltipped element.
     * @param {PointerEvent} event    The initiating pointerenter event
     */
    #onActivate(event) {
        if (Tour.tourInProgress) return; // Don't activate tooltips during a tour

        const element = event.target;
        if (!element.dataset.tooltip) {
        // Check if the element has moved out from underneath the cursor and pointerenter has fired on a non-child of the
        // tooltipped element.
            if (this.#active && !this.element.contains(element)) this.#startDeactivation();
            return;
        }

        // Don't activate tooltips if the element contains an active context menu or is in a matching link tooltip
        if (element.matches("#context-menu") || element.querySelector("#context-menu")) return;

        // If the tooltip is currently active, we can move it to a new element immediately
        /* if ( this.#active ) this.activate(element);
        else */

        // Deactivate any existing tooltips
        this.#startDeactivation();

        // Otherwise, delay activation to determine user intent
        this.#pending = element;
        this.#activationTimeout = window.setTimeout(() => {
            this.activate(element);
        }, this.constructor.TOOLTIP_ACTIVATION_MS);
    }

    /* -------------------------------------------- */

    /**
     * Handle hover events which deactivate a tooltipped element.
     * @param {PointerEvent} event    The initiating pointerleave event
     */
    #onDeactivate(event) {
        if (event.target !== (this.element ?? this.#pending)) return;

        this.#startDeactivation();

        const parent = event.target.parentElement.closest("[data-tooltip]");
        if (parent) {
            this.#pending = parent;
            this.#activationTimeout = window.setTimeout(() => {
                this.activate(parent);
            }, this.constructor.TOOLTIP_ACTIVATION_MS);
        }
    }

    /* -------------------------------------------- */

    /**
     * Start the deactivation process.
     */
    #startDeactivation() {
        // Clear any existing activation workflow
        this.clearPending();

        // Delay deactivation to confirm whether some new element is now pending
        this.#clearDeactivation();
        /* if ( !this.#pending )  */this.deactivate();
    }

    /* -------------------------------------------- */

    /**
     * Clear any existing deactivation workflow.
     */
    #clearDeactivation() {
        window.clearTimeout(this.#deactivationTimeout);
        this.#pending = this.#deactivationTimeout = null;
    }

    /**
     * Clear any pending activation workflow.
     * @internal
     */
    clearPending() {
        window.clearTimeout(this.#activationTimeout);
        this.#pending = this.#activationTimeout = null;
    }

    /* -------------------------------------------- */

    /**
     * Check whether the user is moving away from the locked tooltips and dismiss them if so.
     * @param {MouseEvent} event  The mouse move event.
     */
    #testLockedTooltipProximity(event) {
        if ( !this.#locked.elements.size ) return;
        const {clientX: x, clientY: y} = event;
        const buffer = this.#locked.boundingBox.clone().pad(this.constructor.LOCKED_TOOLTIP_BUFFER_PX);
        if ( !buffer.contains(x, y) ) this.dismissLockedTooltips();
    }
}
