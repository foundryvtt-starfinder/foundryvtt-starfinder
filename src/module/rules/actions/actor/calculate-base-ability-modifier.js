import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityModifier", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, ability) => {
            let abilityMod = 0;

            abilityMod += bonus.modifier;

            if (abilityMod !== 0) {
                ability.tooltip.push(game.i18n.format("STARFINDER.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }

            return abilityMod;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.ABILITY_MODIFIER, StarfinderEffectType.ABILITY_MODIFIERS].includes(mod.effectType) && 
                [StarfinderModifierType.CONSTANT].includes(mod.modifierType);
        })

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl || mod.effectType === StarfinderEffectType.ABILITY_MODIFIERS), 
                context
            );

            const base = Math.floor((ability.value - 10) / 2);
            ability.tooltip = [game.i18n.format("STARFINDER.AbilityModifierBase", { mod: base.signedString() })];

            let mod = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, ability);
                    }
                } else {
                    sum += addModifier(mod[1], ability);
                }

                return sum;
            }, 0);

            ability.mod = base + mod;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}