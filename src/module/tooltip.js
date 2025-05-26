/**
 * Override default tooltip class because tooltips appearing immediately when a tooltip is currently visible sucks.
 * Unfortunately anything worth touching is private so we have to copy a lot of it. :/
 */
export default class TooltipManagerSFRPG extends foundry.helpers.interaction.TooltipManager {

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
        if (foundry.nue.Tour.tourInProgress) return; // Don't activate tooltips during a tour

        const element = event.target;
        if (!element.dataset.tooltip && element.getAttribute("aria-label")) {
            // If the element has an aria-label but no tooltip, set the tooltip to the aria-label value
            element.setAttribute("data-tooltip", element.getAttribute("aria-label"));
        }

        if (!element.dataset.tooltip && !element.dataset.tooltipHtml) {
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

    /**
   * Compute the unified bounding box from the set of locked tooltip elements.
   */
    #computeLockedBoundingBox() {
        let bb = null;
        for ( const element of this.#locked.elements.values() ) {
            const {x, y, width, height} = element.getBoundingClientRect();
            const rect = new PIXI.Rectangle(x, y, width, height);
            if ( bb ) bb.enlarge(rect);
            else bb = rect;
        }
        this.#locked.boundingBox = bb;
    }

    /**
   * Lock the current tooltip.
   * @returns {HTMLElement}
   */
    lockTooltip() {
        const clone = this.tooltip.cloneNode(false);
        // Steal the content from the original tooltip rather than cloning it, so that listeners are preserved.
        while ( this.tooltip.firstChild ) clone.appendChild(this.tooltip.firstChild);
        clone.removeAttribute("id");
        clone.classList.add("locked-tooltip", "active");
        document.body.appendChild(clone);
        this.deactivate();
        clone.addEventListener("contextmenu", this._onLockedTooltipDismiss.bind(this));
        this.#locked.elements.add(clone);

        // If the tooltip's contents were injected via setting innerHTML, then immediately requesting the bounding box will
        // return incorrect values as the browser has not had a chance to reflow yet. For that reason we defer computing the
        // bounding box until the next frame.
        requestAnimationFrame(() => this.#computeLockedBoundingBox());
        return clone;
    }

    /**
   * Dismiss the set of active locked tooltips.
   */
    dismissLockedTooltips() {
        for ( const element of this.#locked.elements.values() ) {
            element.remove();
        }
        this.#locked.elements = new Set();
    }
}
