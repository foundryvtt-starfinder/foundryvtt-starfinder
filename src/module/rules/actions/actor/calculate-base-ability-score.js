import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityScore", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, ability) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType !== "constant") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }
            if (computedBonus !== 0) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreBonusTooltip", {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.ABILITY_SCORE].includes(mod.effectType);
        })

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl), 
                context
            );

            let score = ability.base ? ability.base : 10;
            ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreBaseTooltip", { mod: score.signedString() }));

            if (ability.userPenalty) {
                let userPenalty = -Math.abs(ability.userPenalty);
                score += userPenalty;
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityPenaltyTooltip", { mod: userPenalty.signedString() }));
            }

            if (ability.drain) {
                let drain = -Math.abs(ability.drain);
                score += drain;
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityDrainTooltip", { mod: drain.signedString() }));
            }

            let bonus = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, data, ability);
                    }
                } else {
                    sum += addModifier(mod[1], data, ability);
                }

                return sum;
            }, 0);

            ability.value = score + bonus;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}