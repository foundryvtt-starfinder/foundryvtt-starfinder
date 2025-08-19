import { DiceSFRPG } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";

function mkRemaining(value, unit, enabled) {
    const durFrom = CONFIG.SFRPG.effectDurationFrom;
    const durTypes = CONFIG.SFRPG.durationTypes;

    let string;
    if (!Object.hasOwn(durFrom, unit)) {
        string = durTypes[unit] ?? game.i18n.localize("SFRPG.ActorSheet.Inventory.Item.Deactivate");
    } else if (value >= durFrom.day) {
        string = `${Math.floor(value / durFrom.day)} ${durTypes.day}`;
    } else if (value >= durFrom.hour) {
        string = `${Math.floor(value / durFrom.hour)} ${durTypes.hour}`;
    } else if (value >= durFrom.minute) {
        string = `${Math.floor(value / durFrom.minute)} ${durTypes.minute}`;
    } else if (value >= durFrom.round) {
        string = `${Math.floor(value / durFrom.round)} ${durTypes.round}`;
    } else if (enabled) {
        string = `< 1 ${durTypes.round}`;
    } else {
        string = game.i18n.localize("SFRPG.Effect.Expired");
    }

    return { value, string };
}

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
                /** @type {"parent"|"origin"|"init"|ActorID|ActorUUID} If type is `turn`, which turn to expire on. */
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

        for (let effectModI = 0; effectModI < item.system.modifiers.length; effectModI++) {
            this.modifiers[effectModI].enabled = this.enabled;
        }

        // handle activation time
        if (this.enabled && resetActivationTime) {
            this.activeDuration.activationTime = game.time.worldTime;

            if (game.combat) {
                this.activeDuration.expiryInit = game.combat.initiative;
            }
        } else if (resetActivationTime) {
            this.activeDuration.activationTime = -1;

            if (game.combat) {
                this.activeDuration.expiryInit = -1;
            }
        }

        // update global and actor timedEffect objects
        actor.system.timedEffects.get(this.uuid)?.update(this);
        game.sfrpg.timedEffects.get(this.uuid)?.update(this);

        // toggle on actor
        this._updateAfterToggle(resetActivationTime);

        if (this.showOnToken) this.createScrollingText(this.enabled);

    }

    /** Update dynamic data, such as the time remaining */
    poke() {
        if (Object.hasOwn(CONFIG.SFRPG.effectDurationFrom, this.activeDuration.unit)) {
            const duration = this.activeDuration;
            duration.remaining = mkRemaining(duration.activationEnd - game.time.worldTime, duration.unit, this.enabled);
            this._updateAfterPoke();
        }
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
                itemUuid: item.uuid,
                actorUuid: item.actor.uuid,
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

    static fromItem(item, itemData = item.system, actor = item.actor) {
        return (item.type === "effect")
            ? SFRPGTimedEnable.fromItem(item, itemData, actor)
            : SFRPGTimedActivation.fromItem(item, itemData);
    }
}

class SFRPGTimedEnable extends SFRPGTimedEffect {
    /** Update the managed Item with data from this TimedEffect */
    _updateAfterToggle(resetActivationTime = true) {
        const item = this.item;
        const delta = {
            _id: item._id,
            'system.enabled': this.enabled,
            'system.modifiers': item.system.modifiers.map((mod, idx) => {
                const modifier = mod.toObject?.() ?? { ...mod };
                modifier.enabled = this.modifiers[idx].enabled;
                return modifier;
            }),
            'system.activeDuration.remaining': this.activeDuration.remaining
        };

        if (resetActivationTime) {
            delta['system.activeDuration.activationTime'] = this.activeDuration.activationTime;
            delta['system.activeDuration.expiryInit'] = this.activeDuration.expiryInit;
        }

        this.actor?.updateEmbeddedDocuments('Item', [delta]);
    }

    /** Update the managed Item after a {@linkcode poke} */
    _updateAfterPoke() {
        this.actor?.updateEmbeddedDocuments('Item', [{
            _id: this.item._id,
            'system.activeDuration.remaining': this.activeDuration.remaining
        }]);
    }

    static fromItem(item, itemData = item.system, actor = item.actor) {
        // Construct the roll context of the owning actor and the origin actor/item.
        const rollContext = new RollContext();
        rollContext.addContext("owner", actor);
        rollContext.setMainContext("owner");

        const effectContext = itemData.context;
        if (effectContext) {
            const origin = {
                actor: fromUuidSync(effectContext.origin?.actorUuid)?.getRollData() || null,
                item: fromUuidSync(effectContext.origin?.itemUuid)?.getRollData() || null
            };

            rollContext.addContext("origin", null, origin);
        }

        const calculateWithContext = (formula) => {
            const stringFormula = String(formula || 0);
            let total = DiceSFRPG.resolveFormulaWithoutDice(stringFormula, rollContext, { logErrors: false }).total;

            if (!total && total !== 0) {
                ui.notifications.error(
                    `Error calculating duration on actor ${actor.name} (${actor.id}), effect item ${item.name} (${item.id}).`
                );
                console.log(`${item.name}:`, item);
                total = 0;
            }

            return total;
        };

        const effectData = {
            itemUuid: item.uuid,
            actorUuid: item.actor.uuid,
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

        const duration = effectData.activeDuration;
        duration.total = calculateWithContext(duration.value);
        duration.activationEnd = duration.activationTime + (duration.total * CONFIG.SFRPG.effectDurationFrom[duration.unit]);
        duration.remaining = mkRemaining(duration.activationEnd - game.time.worldTime, duration.unit, effectData.enabled);

        return new SFRPGTimedEnable(effectData);
    }
}

class SFRPGTimedActivation extends SFRPGTimedEffect {
    /** Update the managed Item with data from this TimedEffect */
    _updateAfterToggle(resetActivationTime) {
        const item = this.item;
        const delta = {
            _id: item._id,
            'system.isActive': this.enabled,
            'system.activationEvent.status': this.activeDuration.remaining.string
        };

        if (resetActivationTime) {
            delta['system.activationEvent.startTime'] = this.activeDuration.activationTime;
        }

        this.actor?.updateEmbeddedDocuments('Item', [delta]);
    }

    /** Update the managed Item after a {@linkcode poke} */
    _updateAfterPoke() {
        this.actor?.updateEmbeddedDocuments('Item', [{
            _id: this.item._id,
            'system.activationEvent.status': this.activeDuration.remaining.string
        }]);
    }

    static fromItem(item, itemData = item.system) {
        const {
            isActive,
            description,
            duration,
            activationEvent,
            modifiers
        } = itemData;
        if (!activationEvent) return null;

        const endTime = activationEvent.endTime;
        return new SFRPGTimedActivation({
            itemUuid: item.uuid,
            actorUuid: item.actor.uuid,
            uuid: item.uuid,
            name: item.name,
            type: item.type,
            enabled: isActive,
            context: null,
            showOnToken: false,
            modifiers: modifiers,
            notes: description?.value,
            activeDuration: {
                unit: duration.units,
                value: duration.value,
                activationTime: activationEvent.startTime,
                activationEnd: endTime,
                expiryMode: {
                    type: "turn",
                    turn: "parent"
                },
                expiryInit: 0,
                remaining: mkRemaining(endTime - game.time.worldTime, duration.units, isActive),
                endsOn: duration.endsOn
            }
        });
    }
}

Hooks.on("updateWorldTime", (worldTime, dt) => {
    const timedEffects = game.sfrpg.timedEffects;
    for (const effect of timedEffects.values()) {
        if (effect.actor.inCombat) continue;
        // handling effects while in combat is handled in combat.js

        const effectStart = effect.activeDuration.activationTime ?? -Infinity;
        const effectFinish = effect.activeDuration.activationEnd ?? Infinity;
        if ((effectFinish <= worldTime && effect.enabled)
            || (dt < 0 && effectFinish >= worldTime && !effect.enabled)
        ) {
            effect.toggle(false);
        } else if (effectStart <= worldTime && worldTime <= effectFinish) {
            effect.poke();
        }

    }
});
