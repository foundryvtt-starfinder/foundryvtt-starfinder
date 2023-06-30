export default class SFRPGTimedEffect {
    /**
     * An object that holds information about a timedEffect
     * @param {Object}  data the data of the timedEffect
     * @param {UUID}    data.itemUuid the UUID of the original item that this timed effect was derived from
     * @param {UUID}    data.actorUuid UUID of the actor that owns this timedEffect
     * @param {UUID}    data.uuid The Foundry UUID of the item
     * @param {Boolean} data.enabled is this effect enabled or not
     * @param {String}  data.name name of the timedEffect
     * @param {String}  data.type this is for later use of different effect types
     * @param {Object}  data.context The context from where the effect was dragged from.
     * @param {Boolean} data.showOnToken should this effect be shown on token or not
     * @param {Array}   data.modifiers the modifiers that apply from this effect
     * @param {String}  data.notes general notes
     * @param {Object}  data.activeDuration an object that contains the information on how long this effect lasts and when it was activated.
     */
    constructor({
        itemUuid = '',
        actorUuid = '',
        uuid = '',
        name = '',
        type = '', // this is for later use of different effect types
        enabled = true,
        context = {
            origin: {
                actorUuid: "",
                itemUuid: ""
            },
            roll: null
        },
        showOnToken = true,
        modifiers = [],
        notes = '',
        activeDuration = {
            unit: '',
            value: "",
            activationTime: 0,
            activationEnd: 0,
            expiryMode: {
                /** @type {"turn"|"init"} Expire on a combatant's turn, or a specific init count. */
                type: "turn",
                /** @type {"parent"|"origin"|"init"|ActorID} If type is `turn`, which turn to expire on. */
                turn: "parent"
            },
            expiryInit: 0,
            remaining: {
                value: 0,
                string: ""
            },
            endsOn: ''
        }
    }) {
        this.itemUuid = itemUuid;
        this.actorUuid = actorUuid;
        this.uuid = uuid;
        this.name = name;
        this.type = type;
        this.enabled = enabled;
        this.context = context;
        this.showOnToken = showOnToken;
        this.modifiers = modifiers;
        this.notes = notes;
        this.activeDuration = activeDuration;
    }

    get actor() {
        return fromUuidSync(this.actorUuid);
    }

    get item() {
        return fromUuidSync(this.itemUuid);
    }

    get origin() {
        return fromUuidSync(this.context?.origin?.actorUuid) || null;
    }

    get originItem() {
        return fromUuidSync(this.context?.origin?.itemUuid) || null;
    }

    update({
        itemUuid,
        actorUuid,
        uuid,
        name,
        type,
        enabled,
        context,
        showOnToken,
        modifiers,
        notes,
        activeDuration
    }) {
        this.itemId = itemUuid ?? this.itemUuid;
        this.actorId = actorUuid ?? this.actorUuid;
        this.uuid = uuid ?? this.uuid;
        this.name = name ?? this.name;
        this.type = type ?? this.type;
        this.enabled = enabled ?? this.enabled;
        this.context = context ?? this.context;
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

        const item = this.item;
        const actor = item.actor;

        if (!item) return ui.notifications.error('Failed to toggle effect, item missing.');
        if (!actor) return ui.notifications.error('Failed to toggle effect, actor missing.');
        // toggle on actor
        const updateData = {
            _id: item._id,
            system: {
                enabled: this.enabled,
                modifiers: item.system.modifiers,
                activeDuration: item.system.activeDuration
            }
        };

        for (let effectModI = 0; effectModI < item.system.modifiers.length; effectModI++) {
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
        actor.system.timedEffects.get(this.uuid)?.update(this);
        game.sfrpg.timedEffects.get(this.uuid)?.update(this);

        actor.updateEmbeddedDocuments('Item', [updateData]);

        if (this.showOnToken) this.createScrollingText(this.enabled);

    }

    /**
     * delete the effect across the game.
     */
    delete() {
        const actor = this.actor;

        // Delete from Maps
        game.sfrpg.timedEffects.delete(this.uuid);

        if (actor) {
            actor.system.timedEffects.delete(this.uuid);
            if (this.showOnToken) this.createScrollingText(false);
        }

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
                context: itemData.context,
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

    static createScrollingText(effect, enabled) {
        const tokens = effect.actor.getActiveTokens(true);
        const text = `${enabled ? "+" : "-"}(${effect.name})`;

        for (const token of tokens) {
            const floaterData = {
                anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
                direction: enabled ? CONST.TEXT_ANCHOR_POINTS.TOP : CONST.TEXT_ANCHOR_POINTS.BOTTOM,
                distance: (2 * token.h),
                fontSize: 32,
                stroke: 0x000000,
                strokeThickness: 4,
                jitter: 0.25
            };
            canvas.interface.createScrollingText(token.center, text, floaterData);
        }

    }

    createScrollingText(enabled) {
        return this.constructor.createScrollingText(this, enabled);
    }

}

Hooks.on("updateWorldTime", (worldTime, dt, options, userId) => {
    const timedEffects = game.sfrpg.timedEffects;
    for (const effect of timedEffects.values()) {
        if (effect.activeDuration.unit === 'permanent' || effect.actor.inCombat) continue;

        const effectFinish = effect.activeDuration.activationEnd;
        // handling effects while in combat is handled in combat.js
        if ((effectFinish <= worldTime && effect.enabled)
            || (dt < 0 && effectFinish >= worldTime && !effect.enabled)
        ) {
            effect.toggle(false);
        }

    }
});
