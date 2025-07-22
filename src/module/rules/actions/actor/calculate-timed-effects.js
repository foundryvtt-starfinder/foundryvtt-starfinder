import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const { item, itemData } = fact;
        const actor = fact.owner.actor;
        if (!actor) return fact;

        const effect = SFRPGTimedEffect.fromItem(item, itemData, actor);
        if (effect) {
            actor.system.timedEffects.set(effect.uuid, effect);
            game.sfrpg.timedEffects.set(effect.uuid, effect);
        }

        return fact;
    });
}
