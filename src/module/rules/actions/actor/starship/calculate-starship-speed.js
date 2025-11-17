import { SFRPGEffectType } from "../../../../modifiers/types.js";

export default function(engine) {
    const processModifier = (bonus, data, tooltip) => {
        let computedBonus = 0;
        try {
            const roll = Roll.create(bonus.modifier.toString(), data).evaluateSync({strict: false});
            computedBonus = roll.total;
            tooltip.push(`${bonus.name}: ${computedBonus.signedString()}`);
        } catch (e) {
            console.error(e);
        }
        return computedBonus;
    };

    const applyStackedModifiers = (stackedModifiers, data, tooltip) => {
        return Object.entries(stackedModifiers).reduce((sum, mod) => {
            for (const bonus of mod[1]) {
                sum += processModifier(bonus, data, tooltip);
            }
            return sum;
        }, 0);
    };

    const applySpeedModifiers = (fact, context, data) => {
        const speedModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_SPEED);

        if (speedModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                speedModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data, data.attributes.speed.tooltip);
            data.attributes.speed.value += modifierBonus;
        }
    };

    const applyPilotingBonusModifiers = (fact, context, data) => {
        // TODO: System v29 - This currently doesn't work on NPC crew piloting skills and actions. The data structure for those
        // will need to be rejigged to get them to match the standard 'base' as input, 'mod' as a calculated value format
        // common to skills. To do this will require migration of actor data on starship actors, which has to wait until
        // after DataModels have been implemented.
        const pilotingModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_PILOTING_SKILL);

        if (pilotingModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                pilotingModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            data.attributes.pilotingBonus.value += modifierBonus;

            if (modifierBonus !== 0) {
                const label = game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.MiscModifier") : "Misc Modifier";
                data.attributes.pilotingBonus.tooltip.push(`${label}: ${modifierBonus.signedString()}`);
            }
        }
    };

    engine.closures.add("calculateStarshipSpeed", (fact, context) => {
        const data = fact.data;

        data.attributes.speed.value = 0;

        const thrusters = fact.items.filter(x => x.type === "starshipThruster");
        for (const thruster of thrusters) {
            const thrusterData = thruster.system;

            if (!thrusterData.isBooster) {
                data.attributes.speed.value += thrusterData.speed;
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thrusterData.speed.signedString()}`);

                data.attributes.pilotingBonus.value += thrusterData.pilotingModifier;
                data.attributes.pilotingBonus.tooltip.push(`${thruster.name}: ${thrusterData.pilotingModifier.signedString()}`);
            } else if (thrusterData.isEnabled) {
                data.attributes.speed.value += Math.floor(thrusterData.speed / 4);
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thrusterData.speed.signedString()}`);
            }
        }

        // Apply speed and piloting bonus modifiers
        applySpeedModifiers(fact, context, data);
        applyPilotingBonusModifiers(fact, context, data);

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
