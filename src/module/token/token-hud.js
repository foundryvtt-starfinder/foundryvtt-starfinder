export class SFRPGTokenHUD extends TokenHUD {

    /**
     * @override
     * Toggles active and overlay classes on the status images.
     */
    refreshStatusIcons() {
        const effects = this.element.find(".status-effects")[0];
        const statuses = this.object.actor?.system?.conditions;
        if (!statuses) return;

        const pics = $("picture.effect-control", effects);

        for (const pic of pics) {
            const enabled = statuses[pic.dataset.statusId] ?? false;

            pic.classList.toggle("active", enabled);
        }
    }

    /**
     * @override
     * Calls super then adds a remove all button and optionally reformats the grid with text.
     */
    async _render(force, options) {
        const render = await super._render(force, options);
        this.modifyConditions(this.element);
        this.refreshStatusIcons();

        return render;
    }

    // #endregion Overrides

    /**
     * Modifies the status effects (conditions) formatting
     * Adds names, classes, and a button to remove all conditions
     * @param {any} html - document element
     */
    modifyConditions([html]) {
        // Add a button to remove all conditions
        const label = game.i18n.localize("SFRPG.Canvas.TokenHud.RemoveAll");
        const content = game.settings.get('sfrpg', 'tokenConditionLabels') ? `${label} <i class="fas fa-times-circle" />` : `<i class="fas fa-times-circle" />`;

        const button = document.createElement("button");
        button.classList.add("remove-all");
        button.setAttribute("title", label);
        button.innerHTML = content;
        button.addEventListener("click", this.onRemoveAllConditions.bind(this));

        const gridContainer = $(".status-effects", html);
        gridContainer.append(button);

        // Reformat the grid
        if (!(game.settings.get('sfrpg', 'tokenConditionLabels'))) return;

        // allow alternate styling
        html.classList.add('modified');

        const allStatusImages = html.querySelectorAll(".status-effects > img");

        for (const image of allStatusImages) {
            // Replace the img element with a picture element, which can display ::after content
            const name = image.dataset.tooltip ?? "";

            const picture = document.createElement("picture");
            picture.classList.add("effect-control");
            picture.dataset.statusId = image.dataset.statusId;
            picture.title = name;
            const iconSrc = image.getAttribute("src");
            picture.setAttribute("src", iconSrc);
            const newIcon = document.createElement("img");
            newIcon.src = iconSrc;
            picture.append(newIcon);
            image.replaceWith(picture);

            const nameLabel = document.createElement("a");
            nameLabel.classList.add("name-label");
            nameLabel.setAttribute("title", name);
            nameLabel.innerText = name;

            picture.append(nameLabel);

            picture.addEventListener("click", event => this._onClickEffect(event, picture, false));
            picture.addEventListener("contextmenu", event => this._onClickEffect(event, picture, true));
        }
    }

    async _onClickEffect(event, pic, overlay) {
        event.preventDefault();
        event.stopPropagation();

        const isEnabled = pic.classList.contains('active');
        const token = this.object;
        const actor = token?.actor;

        const conditionId = pic.dataset.statusId;
        if (!(conditionId && actor)) return;

        if (overlay) await actor.toggleStatusEffect(conditionId, {overlay, active: !isEnabled});

        return actor.setCondition(conditionId, !isEnabled);

    }

    /**
     * @listens
     * Sets all conditions to false
     * @param {Event} event - standard event interface
     */
    async onRemoveAllConditions(event) {
        event.preventDefault();
        const statuses = this.object.actor?.system?.conditions;
        if (!statuses) return;

        const promises = [];

        for (const [condition, enabled] of Object.entries(statuses)) {
            if (enabled) promises.push(this.object.actor.setCondition(condition, false, {overlay: false}));
        }

        for (const effect of this.object.actor.effects) {
            promises.push(effect.delete());
        }

        return Promise.all(promises);
    }
}
