import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";
import SFRPGTimedEffect from "../../../timedEffect/timedEffect.js";

export default function(engine) {
    engine.closures.add('calculateTimedEffects', (fact, context) => {
        const { item, itemData } = fact;
        const actor = fact.owner.actor;
        if (!actor || item.type !== "effect") return fact;

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

        // Construct the roll context of the owning actor and the origin actor/item.
        const rollContext = new RollContext();
        rollContext.addContext("owner", actor);
        rollContext.setMainContext("owner");

        const effectContext = effectData.context;
        if (effectContext) {
            const origin = {
                actor: fromUuidSync(effectContext.origin?.actorUuid)?.getRollData() || null,
                item: fromUuidSync(effectContext.origin?.itemUuid)?.getRollData() || null
            };

            rollContext.addContext("origin", null, origin);
        }

        const duration = effectData.activeDuration;

        duration.total = calculateWithContext(duration.value);
        duration.activationEnd = duration.activationTime + (duration.total * CONFIG.SFRPG.effectDurationFrom[duration.unit]);

        duration.remaining = {};
        duration.remaining.value = duration.activationEnd - game.time.worldTime;
        duration.remaining.string = (() => {
            const remaining = duration.remaining.value;
            const durFrom = CONFIG.SFRPG.effectDurationFrom;
            const durTypes = CONFIG.SFRPG.effectDurationTypes;

            if (remaining >= durFrom.day)
                return `${Math.floor(remaining / durFrom.day)} ${durTypes.day}`;
            else if (remaining >= durFrom.hour)
                return `${Math.floor(remaining / durFrom.hour)} ${durTypes.hour}`;
            else if (remaining >= durFrom.minute)
                return `${Math.floor(remaining / durFrom.minute)} ${durTypes.minute}`;
            else if (remaining >= durFrom.round)
                return `${Math.floor(remaining / durFrom.round)} ${durTypes.round}`;
            else if (remaining <= 0) {
                if (itemData.enabled) {
                    return `< 1 ${durTypes.round}`;
                } else {
                    return game.i18n.localize("SFRPG.Effect.Expired");
                }

            }
        })();

        const effect = new SFRPGTimedEffect(effectData);

        // Add to actor effects
        actor.system.timedEffects.set(effect.uuid, effect);
        // Register effect to global effect map
        game.sfrpg.timedEffects.set(effect.uuid, effect);

        return fact;
    });
}
