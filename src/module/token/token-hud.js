/**
 * @import { ApplicationRenderContext, ApplicationRenderOptions } from "@client/applications/_types.mjs"
 * @import { ActorSFRPG } from "../actor/actor.js";
*/

export class SFRPGTokenHUD extends foundry.applications.hud.TokenHUD {

    /**
     * @param {ApplicationRenderContext} context Prepared context data
     * @param {ApplicationRenderOptions} options Provided render options
     * @override
     */
    async _onRender(context, options) {
        this.modifyConditions(this.element);
        this.refreshStatusIcons();
    }

    /** Toggles active and overlay classes on the status images. */
    refreshStatusIcons() {
        const effects = this.element.querySelector(".status-effects");
        const statuses = this.object.actor?.system?.conditions;
        if (!statuses) return;

        const pics = $("picture.effect-control", effects);

        for (const pic of pics) {
            const enabled = statuses[pic.dataset.statusId] ?? false;

            pic.classList.toggle("active", enabled);
        }
    }

    /**
     * Modifies the status effects (conditions) formatting
     * Adds names, classes, and a button to remove all conditions
     */
    modifyConditions() {
        const html = this.element;

        // Add a button to remove all conditions
        const label = game.i18n.localize("SFRPG.Canvas.TokenHud.RemoveAll");
        const content = game.settings.get('sfrpg', 'tokenConditionLabels') ? `${label} <i class="fas fa-times-circle" />` : `<i class="fas fa-times-circle" />`;

        const button = document.createElement("button");
        button.classList.add("remove-all");
        button.setAttribute("title", label);
        button.innerHTML = content;
        button.addEventListener("click", this._onRemoveAllConditions.bind(this));

        const gridContainer = html.querySelector(".status-effects");
        gridContainer.append(button);

        // Optionally reformat the grid
        if (!(game.settings.get('sfrpg', 'tokenConditionLabels'))) return;

        // Add a class for the alternate styling
        html.classList.add('modified');

        const allStatusImages = html.querySelectorAll(".status-effects > img");

        for (const image of allStatusImages) {
            // Replace the img element with a picture element, which can display ::after content and allows child elements.
            const name = image.dataset.tooltipText ?? "";
            const statusId = image.dataset.statusId ?? "";

            const picture = document.createElement("picture");
            picture.classList.add("effect-control");
            picture.dataset.statusId = statusId;
            picture.title = name;

            const iconSrc = image.getAttribute("src");
            const newIcon = document.createElement("img");
            newIcon.src = iconSrc;
            picture.append(newIcon);
            image.replaceWith(picture);

            const nameLabel = document.createElement("a");
            nameLabel.classList.add("name-label");
            nameLabel.setAttribute("title", name);
            nameLabel.innerText = name;

            picture.append(nameLabel);

            picture.addEventListener("click", (event) => this._onClickEffect(event, picture, false));
            picture.addEventListener("contextmenu", (event) => this._onClickEffect(event, picture, true));

        }
    }

    /**
     * Handle creating the condition item, and optionally an overlay effect.
     * @param {Event} event The event
     * @param {HTMLPictureElement} pic The clicked Picture element
     * @param {Boolean} overlay Whether to also create an overlay status effect as well as a condition item
     * @returns {Boolean} Whether the effect is now enabled or not.
     */
    async _onClickEffect(event, pic, overlay) {
        event.preventDefault();
        event.stopPropagation();

        const isEnabled = pic.classList.contains('active');

        /** @type {ActorSFRPG} */
        const actor = this.object?.actor;

        const conditionId = pic.dataset.statusId;
        if (!(conditionId && actor)) return;

        if (overlay) await actor.toggleStatusEffect(conditionId, {overlay, active: !isEnabled});

        return actor.setCondition(conditionId, !isEnabled);

    }

    /**
     * @listens
     * Sets all conditions to false
     * @param {Event} event The event
     */
    async _onRemoveAllConditions(event) {
        event.preventDefault();
        event.stopPropagation();

        const statuses = this.object.actor?.system?.conditions;
        if (!statuses) return;

        for (const [condition, enabled] of Object.entries(statuses)) {
            if (enabled) this.object.actor.setCondition(condition, false);
        }

        for (const effect of this.object.actor.effects) {
            effect.delete();
        }

    }
}
