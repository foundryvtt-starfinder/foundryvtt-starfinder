import { generateUUID } from '../utilities.js';

export default class SFRPGTimedEffect {
    /**
     * An object that holds information about a timedEffect
     * @param {Object}  data the data of the timedEffect
     * @param {UUID}    data.id id of the timedEffect, will generate a random one if not given.
     * @param {UUID}   data.itemId the id of the original item that this timed effect was derived from
     * @param {String}  data.name name of the timedEffect
     * @param {String}  data.type this is for later use of different effect types
     * @param {Boolean} data.enabled is this effect enabled or not
     * @param {UUID}    data.actorId Id of the actor that owns this timedEffect
     * @param {Array}   data.modifiers the modifiers that apply from this effect
     * @param {String}  data.notes general notes
     * @param {Object}  data.activeDuration an object that contains the information on how long this effect lasts and when it was activated.
     */
    constructor({
        id = null,
        itemId = '',
        name = '',
        type = '', // this is for later use of different effect types
        enabled = true,
        actorId = '',
        modifiers = [],
        notes = '',
        activeDuration = {
            unit: '',
            value: 0,
            activationTime: 0,
            endsOn: ''
        }
    }) {
        this.id = id ?? generateUUID();
        this.itemId = itemId;
        this.name = name;
        this.type = type;
        this.enabled = enabled;
        this.actorId = actorId;
        this.modifiers = modifiers;
        this.notes = notes;
        this.activeDuration = activeDuration;
    }

    update({
        id,
        itemId,
        name,
        type,
        enabled,
        actorId,
        modifiers,
        notes,
        activeDuration
    }) {
        this.id = id;
        this.itemId = itemId;
        this.name = name;
        this.type = type;
        this.enabled = enabled;
        this.actorId = actorId;
        this.modifiers = modifiers;
        this.notes = notes;
        this.activeDuration = activeDuration;
    }

    /**
     * toggle the effect on or off across the game.
     */
    toggle(resetActivationTime = true) {
        this.enabled = !this.enabled;

        const actor = game.actors.get(this.actorId);
        const items = duplicate(actor.items);
        const effect = items.find(item => (item.type === 'effect') && (item._id === this.itemId));

        if (effect) {
            // toggle on actor
            effect.system.enabled = this.enabled;

            // thats fucked up... sadly the actual toggle is only a placebo because only the modifier toggle actually does something.
            // I wish i could make it that if the item is not enabled all modifiers inside do not apply but idk how ^^
            for (let effectModI = 0; effectModI < effect.system.modifiers.length; effectModI++) {
                effect.system.modifiers[effectModI].enabled = this.enabled;
            }

            for (let modI = 0; modI < this.modifiers.length; modI++) {
                this.modifiers[modI].enabled = this.enabled;
            }

            // handle activation time
            if (this.enabled && resetActivationTime) {
                effect.system.activeDuration.activationTime = game.time.worldTime;
                this.activeDuration.activationTime = game.time.worldTime;
            } else if (resetActivationTime) {
                effect.system.activeDuration.activationTime = 0;
                this.activeDuration.activationTime = 0;
            }

            // update global and actor timedEffect objects
            actor.system.timedEffects.find(tEffect => tEffect.id === this.id)?.update(this);
            game.sfrpg.timedEffects.find(gEffect => gEffect.id === this.id)?.update(this);

            actor.update({'items': items});
        } else {
            console.error('could not toggle effect, item is missing.');
        }
    }
}
