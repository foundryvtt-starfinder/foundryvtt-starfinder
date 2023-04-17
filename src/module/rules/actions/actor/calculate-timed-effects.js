import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const item = fact.item;
        const actor = fact.owner.actor;
        if (!actor) return fact;

        if ((item.type === 'effect') && (actor.system.timedEffects instanceof Array)) {
            // TODO: find out why "actor.system.timedEffects" is always empty at this point and change that.
            // It will still work just fine but always change the effects ID when you are updating it. It just bugs me a bit.
            const existingEffect = actor.system.timedEffects.find(effect => effect.itemId === item.id);
            const effectData = {
                itemId: item.id,
                name: item.name,
                type: item.system.type,
                enabled: item.system.enabled,
                actorId: item.actor.id,
                sourceActorId: item.system.sourceActorId,
                modifiers: item.system.modifiers,
                notes: item.system.description.value,
                activeDuration: item.system.activeDuration
            };

            const effect = existingEffect
                ? existingEffect.update({
                    id: existingEffect.id,
                    ...effectData
                })
                : new SFRPGTimedEffect(effectData);

            // add to actor effects
            actor.system.timedEffects = addEffectToArray(actor.system.timedEffects, effect);
            // register effect to global effect map
            game.sfrpg.timedEffects = addEffectToArray(game.sfrpg.timedEffects, effect);
        }

        return fact;
    });
}

function addEffectToArray(arr, effect) {
    // I'm not happy with checking the itemId here but as temporary workaround it will work.
    const effectIndex = arr.findIndex(arrEffect => arrEffect.itemId === effect.itemId);
    if (effectIndex !== -1) {
        arr[effectIndex] = effect;
    } else {
        arr.push(effect);
    }
    return arr;
}
