import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const { item, itemData } = fact;
        const actor = fact.owner.actor;
        if (!actor || item.type !== "effect") return fact;

        const effectData = {
            itemUuid: item.uuid,
            actorUuid: item.actor.uuid,
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

        const duration = effectData.activeDuration;
        duration.activationEnd = duration.activationTime + (duration.value * CONFIG.SFRPG.effectDurationFrom[duration.unit]);
        duration.remaining = duration.activationEnd - game.time.worldTime;

        const effect = new SFRPGTimedEffect(effectData);

        // Add to actor effects
        actor.system.timedEffects.set(effect.uuid, effect);
        // Register effect to global effect map
        game.sfrpg.timedEffects.set(effect.uuid, effect);

        return fact;
    });
}
