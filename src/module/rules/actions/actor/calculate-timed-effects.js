import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const item = fact.item;
        const actor = fact.owner.actor;

        if ((item.type === 'effect') && (actor.system.timedEffects instanceof Array)) {
            const effect = new SFRPGTimedEffect({
                itemId: item.id,
                name: item.name,
                type: item.system.type,
                enabled: item.system.enabled,
                actorId: item.actor.id,
                modifiers: item.system.modifiers,
                notes: item.system.description.value,
                activeDuration: item.system.activeDuration
            });

            // add to actor effects
            actor.system.timedEffects = addEffectToArray(actor.system.timedEffects, effect);
            // register effect to global effect map
            game.sfrpg.timedEffects = addEffectToArray(game.sfrpg.timedEffects, effect);
        }

        return fact;
    });
}

function addEffectToArray(arr, effect) {
    // i'm not happy with checking the itemId here but as temporary workaround it will work.
    const effectIndex = arr.findIndex(arrEffect => arrEffect.itemId === effect.itemId);
    if (effectIndex !== -1) {
        arr[effectIndex] = effect;
    } else {
        arr.push(effect);
    }
    return arr;
}
