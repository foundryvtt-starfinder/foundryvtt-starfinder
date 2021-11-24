export class SFRPGTokenHUD extends TokenHUD {

    /**
     * @override
     * Calls setCondition from the SFRPG actor
     * @param {Event} event 
     * @param {any} param1 contains overlay boolean
     * @returns {Boolean} the new enabled state of the condition
     */
    async _onToggleEffect(event, { overlay = false } = {}) {
        event.preventDefault();
        event.stopPropagation();

        const img = event.currentTarget;
        const isEnabled = $(img).hasClass('active');

        if (img.dataset.statusId && this.object.actor) {
            const conditionId = img.dataset.statusId;
            await this.object.actor.setCondition(conditionId, !isEnabled, {overlay: overlay});
        }

        return !isEnabled;
    }

    /**
     * @override
     * Toggles active and overlay classes on the status images.
     */
    refreshStatusIcons() {
        const effects = this.element.find(".status-effects")[0];
        const statuses = this._getStatusEffectChoices();

        for (const img of $('[src]', effects)) {
            const status = statuses[img.getAttribute("src")] || {};

            img.classList.toggle("overlay", !!status.isOverlay);
            img.classList.toggle("active", !!status.isActive);
        }
    }

    /**
     * @override
     * Calls super then adds a remove all button and optionally reformats the grid with text.
     */
    async _render(force, options) {
        const result = super._render(force, options).then((success, fail) => {
            SFRPGTokenHUD.modifyConditions.call(this, this.element);
        });

        return result;
    }

    //#endregion Overrides

    /**
     * Modifies the status effects (conditions) formatting
     * Adds names, classes, and a button to remove all conditions
     * @param {any} html - document element
     */
    static modifyConditions(html) {
        const statuses = this._getStatusEffectChoices();

        // Reformat the grid
        if (game.settings.get('sfrpg', 'tokenConditionLabels')) {

            // allow alternate styling
            $('#token-hud').addClass('modified');

            const allStatusImages = $('.col.right .control-icon[data-action="effects"] .status-effects > img');

            for (const image of allStatusImages) {
                const name      = $(image).attr('title');
                const nameLabel = $('<div>').addClass('condition-name').html(name);
                const container = $('<div>').addClass('condition').attr('title', name);

                // Insert the container and append the image and the name inside
                container.insertAfter(image)
                    .append(image)
                    .append(nameLabel);
            }
        }

        // Add a button to remove all conditions
        const label = game.i18n.localize("SFRPG.Canvas.TokenHud.RemoveAll");
        const content = game.settings.get('sfrpg', 'tokenConditionLabels') ? `${label} <i class="fas fa-times-circle" />` : `<i class="fas fa-times-circle" />`;

        const button = $('<div>').addClass('remove-all').attr('title', label).html(content)
            .on("click", SFRPGTokenHUD.onRemoveAllConditions.bind(this));

        const gridContainer = $('.col.right .control-icon[data-action="effects"] .status-effects', html);
        gridContainer.append(button);
    }

    /**
     * @listens
     * Sets all conditions to false
     * @param {Object} event - standard event interface
     */
    static async onRemoveAllConditions(event) {
        event.preventDefault();
        const statuses = this._getStatusEffectChoices();

        for (const [k, status] of Object.entries(statuses)) {
            if (status.isActive) {
                await this.object.actor.setCondition(status.id, false, {overlay: status.isOverlay});
            }
        }
    }
}