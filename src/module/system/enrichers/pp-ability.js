import BaseEnricher from "./base.js";

/**
 * Enricher for mech Power Point (PP) abilities.
 * Syntax: @PPAbility[cost:2]{Power Jump} or @PPAbility[cost:1|variable:true]{Anti-Magic Targeting}
 * @class
 */
export default class PPAbilityEnricher extends BaseEnricher {

    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "PPAbility";
    }

    /** Not used - PP abilities use cost instead of type */
    get validTypes() {
        return [];
    }

    /** @inheritdoc */
    get icons() {
        return { "PPAbility": "fa-bolt" };
    }

    /**
     * @override Validate cost instead of type
     */
    isValid() {
        const cost = parseInt(this.args.cost);
        if (isNaN(cost) || cost < 0) {
            return this._failValidation("Cost");
        }
        return true;
    }

    /** @override */
    validateName() {
        this.name ||= game.i18n.localize("SFRPG.Enrichers.PPAbility.DefaultName");
    }

    /**
     * @override Build the anchor element directly
     * @returns {HTMLAnchorElement}
     */
    createElement() {
        const a = document.createElement("a");
        const cost = parseInt(this.args.cost);
        const isVariable = this.args.variable === "true";

        a.dataset.action = "PPAbility";
        a.dataset.cost = cost;
        if (isVariable) a.dataset.variable = "true";

        a.classList.add("enriched-link");
        a.draggable = false;

        const costLabel = isVariable
            ? game.i18n.format("SFRPG.Enrichers.PPAbility.CostLabelVariable", { cost })
            : game.i18n.format("SFRPG.Enrichers.PPAbility.CostLabel", { cost });

        a.innerHTML = `<i class="fas fa-bolt"></i>${this.name} ${costLabel}`;

        return a;
    }

    static hasListener = true;

    /**
     * Handle PP ability click
     * @param {Event} event
     */
    static async listener(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
        const baseCost = parseInt(element.dataset.cost);
        const isVariable = element.dataset.variable === "true";
        const abilityName = element.textContent.replace(/\s*\(\d+\+?\s*PP\)\s*$/, "").trim();

        // Resolve actor from selected token
        const token = canvas.tokens?.controlled[0];
        const actor = token?.actor;

        if (!actor || actor.type !== "mech") {
            return ui.notifications.warn(
                game.i18n.localize("SFRPG.Enrichers.PPAbility.NoMechSelected")
            );
        }

        let cost = baseCost;

        // For variable cost abilities, prompt for amount
        if (isVariable) {
            const available = actor.system.attributes.pp.value;
            cost = await PPAbilityEnricher._promptVariableCost(baseCost, available);
            if (cost === null) return; // Cancelled
        }

        const currentPP = actor.system.attributes.pp.value;
        const maxPP = actor.system.attributes.pp.max;

        // Check sufficient PP
        if (currentPP < cost) {
            return ui.notifications.warn(
                game.i18n.format("SFRPG.Enrichers.PPAbility.InsufficientPP", {
                    name: abilityName,
                    cost,
                    current: currentPP
                })
            );
        }

        // Deduct PP
        const newPP = currentPP - cost;
        await actor.update({ "system.attributes.pp.value": newPP });

        // Extract description text from sibling nodes
        const parentP = element.closest("p");
        let description = "";
        if (parentP) {
            const clone = parentP.cloneNode(true);
            // Remove the enricher link from the clone
            const link = clone.querySelector('a[data-action="PPAbility"]');
            if (link) link.remove();
            description = clone.innerHTML.trim();
            // Remove leading dash, colon, or whitespace
            description = description.replace(/^[\s:—–-]+/, "").trim();
        }

        // Render chat card
        const templateData = {
            actorImg: actor.img,
            actorName: actor.name,
            abilityName,
            cost,
            description,
            remaining: newPP,
            max: maxPP,
            ppSpent: game.i18n.format("SFRPG.Enrichers.PPAbility.PPSpent", { cost }),
            ppRemaining: game.i18n.format("SFRPG.Enrichers.PPAbility.PPRemaining", {
                remaining: newPP,
                max: maxPP
            })
        };

        const content = await renderTemplate(
            "systems/sfrpg/templates/chat/pp-ability-card.hbs",
            templateData
        );

        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor, token }),
            content
        });
    }

    /**
     * Show a dialog prompting the user for a variable PP cost
     * @param {number} min Minimum PP cost
     * @param {number} available Available PP
     * @returns {Promise<number|null>} The chosen cost, or null if cancelled
     */
    static _promptVariableCost(min, available) {
        return new Promise((resolve) => {
            new Dialog({
                title: game.i18n.localize("SFRPG.Enrichers.PPAbility.VariableCostTitle"),
                content: `
                    <form>
                        <div class="form-group">
                            <label>${game.i18n.format("SFRPG.Enrichers.PPAbility.VariableCostPrompt", { min, available })}</label>
                            <input type="number" name="cost" value="${min}" min="${min}" max="${available}" autofocus />
                        </div>
                    </form>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("SFRPG.Enrichers.PPAbility.Confirm"),
                        callback: (html) => {
                            const val = parseInt(html.find('[name="cost"]').val());
                            if (isNaN(val) || val < min) resolve(min);
                            else resolve(val);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel"),
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }
}
