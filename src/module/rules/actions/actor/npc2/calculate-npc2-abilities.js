import { SFRPG } from "../../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateNPC2Abilities", async (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_SCORE].includes(mod.effectType);
        });

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {}

            const originalBonus = computedBonus;
            computedBonus = computedBonus > 0 ? Math.floor(computedBonus / 2) : Math.ceil(computedBonus / 2);

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    base: originalBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        for (const [abl, ability] of Object.entries(data.abilities)) {
            ability.mod = ability.base;

            ability.tooltip = [];
            ability.tooltip.push(game.i18n.format("SFRPG.AbilityModifierBase", { mod: ability.base }));

            const abilityMods = await context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl),
                context
            );

            const bonus = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, data, ability, "SFRPG.AbilityScoreBonusModifiedTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], data, ability, "SFRPG.AbilityScoreBonusModifiedTooltip");
                }

                return sum;
            }, 0);

            ability.mod += bonus;
            ability.value = Math.floor(10 + (ability.mod * 2));
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
