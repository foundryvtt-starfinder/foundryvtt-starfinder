import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityScore", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;
        const races = fact.races;
        const theme = fact.theme;

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

        const themeMod = {};
        if(theme && theme.data.abilityMod) {
            themeMod[theme.data.abilityMod.ability] = theme.data.abilityMod.mod;
        }

        const racesMod = {};
        for (let race of races) {
            for(let raceMod of race.data.abilityMods.parts) {
                racesMod[raceMod[1]] = racesMod[raceMod[1]] !== undefined ? racesMod[raceMod[1]] + raceMod[0] : raceMod[0];
            }
        }

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

            const modFromTheme = themeMod[abl] ?? 0;
            if(modFromTheme) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreThemeTooltip", { mod: modFromTheme.signedString() }));
            }

            const modFromRace = racesMod[abl] ?? 0;
            if(modFromRace) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreRaceTooltip", { mod: modFromRace.signedString() }));
            }

            ability.value = score + bonus + modFromTheme + modFromRace;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}