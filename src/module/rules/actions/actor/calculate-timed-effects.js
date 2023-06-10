import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const item = fact.item;
        const actor = fact.owner.actor;
        if (!actor || item.type !== "effect") return fact;

        const existingEffect = actor.system.timedEffects.get(item.uuid);
        const effectData = {
            itemId: item.id,
            actorId: item.actor.id,
            uuid: item.uuid,
            name: item.name,
            type: item.system.type,
            enabled: item.system.enabled,
            sourceActorId: item.system.sourceActorId,
            showOnToken: item.system.showOnToken,
            modifiers: item.system.modifiers,
            notes: item.system.description.value,
            activeDuration: item.system.activeDuration
        };

        effectData.activeDuration.activationEnd = effectData.activeDuration.activationTime + (effectData.activeDuration.value * CONFIG.SFRPG.effectDurationFrom[effectData.activeDuration.unit]);

        const effect = existingEffect
            ? existingEffect.update(effectData)
            : new SFRPGTimedEffect(effectData);

        // add to actor effects
        actor.system.timedEffects.set(effect.uuid, effect);
        // register effect to global effect map
        game.sfrpg.timedEffects.set(effect.uuid, effect);

        return fact;
    });
}
