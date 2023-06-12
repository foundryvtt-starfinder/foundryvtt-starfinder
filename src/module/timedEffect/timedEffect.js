
export default class SFRPGTimedEffect {
    /**
     * An object that holds information about a timedEffect
     * @param {Object}  data the data of the timedEffect
     * @param {ID}      data.itemId the id of the original item that this timed effect was derived from
     * @param {ID}      data.actorId Id of the actor that owns this timedEffect
     * @param {UUID}    data.uuid The Foundry UUID of the item
     * @param {Boolean} data.enabled is this effect enabled or not
     * @param {String}  data.name name of the timedEffect
     * @param {String}  data.type this is for later use of different effect types
     * @param {UUID}    data.sourceActorId Id of the actor that this effect originates from
     * @param {Boolean} data.showOnToken should this effect be shown on token or not
     * @param {Array}   data.modifiers the modifiers that apply from this effect
     * @param {String}  data.notes general notes
     * @param {Object}  data.activeDuration an object that contains the information on how long this effect lasts and when it was activated.
     */
    constructor({
        itemId = '',
        actorId = '',
        uuid = '',
        name = '',
        type = '', // this is for later use of different effect types
        enabled = true,
        sourceActorId = '',
        showOnToken = true,
        modifiers = [],
        notes = '',
        activeDuration = {
            unit: '',
            value: 0,
            activationTime: 0,
            activationEnd: 0,
            expiryMode: "turn",
            expiryInit: 0,
            remaining: 0,
            endsOn: ''
        }
    }) {
        this.itemId = itemId;
        this.actorId = actorId;
        this.uuid = uuid;
        this.name = name;
        this.type = type;
        this.enabled = enabled;
        this.sourceActorId = sourceActorId;
        this.showOnToken = showOnToken;
        this.modifiers = modifiers;
        this.notes = notes;
        this.activeDuration = activeDuration;
    }

    get actor() {
        return game.actors.get(this.actorId);
    }

    get item() {
        return this.actor.items.get(this.itemId);
    }

    update({
        itemId,
        actorId,
        uuid,
        name,
        type,
        enabled,
        sourceActorId,
        showOnToken,
        modifiers,
        notes,
        activeDuration
    }) {
        this.itemId = itemId ?? this.itemId;
        this.actorId = actorId ?? this.actorId;
        this.uuid = uuid ?? this.uuid;
        this.name = name ?? this.name;
        this.type = type ?? this.type;
        this.enabled = enabled ?? this.enabled;
        this.sourceActorId = sourceActorId ?? this.sourceActorId;
        this.showOnToken = showOnToken ?? this.showOnToken;
        this.modifiers = modifiers ?? this.modifiers;
        this.notes = notes ?? this.notes;
        this.activeDuration = activeDuration ?? this.activeDuration;
        return this;
    }

    /**
     * toggle the effect on or off across the game.
     *
     * @param {Boolean} resetActivationTime default = true, sets if the activeDuration.activationTime should be reset or kept.
     */
    toggle(resetActivationTime = true) {
        this.enabled = !this.enabled;

        const actor = game.actors.get(this.actorId);
        const items = actor.items;
        const effect = items.get(this.itemId);

        if (!effect) return ui.notifications.error('Failed to toggle effect, item missing.');
        if (!actor) return ui.notifications.error('Failed to toggle effect, actor missing.');
        // toggle on actor
        const updateData = {
            _id: effect._id,
            system: {
                enabled: this.enabled,
                modifiers: effect.system.modifiers,
                activeDuration: effect.system.activeDuration
            }
        };

        for (let effectModI = 0; effectModI < effect.system.modifiers.length; effectModI++) {
            updateData.system.modifiers[effectModI].enabled = this.enabled;
            this.modifiers[effectModI].enabled = this.enabled;
        }

        // handle activation time
        if (this.enabled && resetActivationTime) {
            this.activeDuration.activationTime = game.time.worldTime;
            updateData.system.activeDuration.activationTime = game.time.worldTime;

            if (game.combat) {
                this.activeDuration.expiryInit = game.combat.initiative;
                updateData.system.activeDuration.expiryInit = game.combat.initiative;
            }

        } else if (resetActivationTime) {
            this.activeDuration.activationTime = -1;
            updateData.system.activeDuration.activationTime = -1;

            if (game.combat) {
                this.activeDuration.expiryInit = -1;
                updateData.system.activeDuration.expiryInit = -1;
            }

        }

        // update global and actor timedEffect objects
        actor.system.timedEffects.get(effect.uuid)?.update(this);
        game.sfrpg.timedEffects.get(effect.uuid)?.update(this);

        actor.updateEmbeddedDocuments('Item', [updateData]);

        if (this.showOnToken) this.toggleIcon(this.enabled);

    }

    /**
     * delete the effect across the game.
     * @param {ItemSFRPG} item An item to pass to toggleIcon, in case it is called during a delete workflow.
     */
    delete(item = null) {
        const actor = game.actors.get(this.actorId);

        // Delete from maps
        game.sfrpg.timedEffects.delete(this.uuid);
        actor.system.timedEffects.delete(this.uuid);

        if (this.showOnToken) this.toggleIcon(false, item);

    }

    static getAllTimedEffects(actor) {
        const items = actor.items;
        const timedEffects = new Map();

        for (const item of items) {
            if (item.type !== "effect") continue;
            const itemData = item.system;

            const effectData = {
                itemId: item.id,
                actorId: item.actor.id,
                uuid: item.uuid,
                name: item.name,
                type: itemData.type,
                enabled: itemData.enabled,
                sourceActorId: itemData.sourceActorId,
                showOnToken: itemData.showOnToken,
                modifiers: itemData.modifiers,
                notes: itemData.description.value,
                activeDuration: itemData.activeDuration
            };

            const timedEffect = new SFRPGTimedEffect(effectData);
            timedEffects.set(timedEffect.uuid, timedEffect);
        }

        return timedEffects;
    }

    /**
     * @param {boolean} enabled What state to set the icon to
     * @param {ItemSFRPG} optionalItem An item to default to in case the item cannot be found.
     */
    toggleIcon(enabled, optionalItem = null) {
        const item = this.item || optionalItem;
        if (!item) return;

        const tokens = item.actor.getActiveTokens(true);
        const statusEffect = {
            id: item._id,
            label: item.name,
            icon: item.img || 'icons/svg/item-bag.svg'
        };
        for (const token of tokens) {
            token.toggleEffect(statusEffect, {active: enabled, overlay: false});
        }
    }

}
