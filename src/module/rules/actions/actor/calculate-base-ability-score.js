import { SFRPG } from "../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityScore", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;
        const races = fact.races;
        const theme = fact.theme;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (localizationKey) {
                    item.tooltip.push(game.i18n.format(localizationKey, {
                        type: bonus.type.capitalize(),
                        mod: bonus.modifier,
                        source: bonus.name
                    }));
                }
                
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let roll = new Roll(bonus.modifier.toString(), data).evaluate({maximize: true});
            let computedBonus = roll.total;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
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

        let themeMod = {};
        if(theme && theme.data.abilityMod) {
            themeMod[theme.data.abilityMod.ability] = theme.data.abilityMod.mod;
        }

        let racesMod = {};
        for (let race of races) {
            for(let raceMod of race.data.abilityMods.parts) {
                racesMod[raceMod[1]] = racesMod[raceMod[1]] !== undefined ? racesMod[raceMod[1]] + raceMod[0] : raceMod[0];
            }
        }

        let abilityScoreIncreasesMod = {};
        const asis = fact.asis?.filter(x => x.type === "asi") || [];
        for (let asi of asis) {
            for (let ability of Object.keys(SFRPG.abilities)) {
                if (asi.data.abilities[ability]) {
                    if (!(ability in abilityScoreIncreasesMod)) {
                        abilityScoreIncreasesMod[ability] = 1;
                    } else {
                        abilityScoreIncreasesMod[ability] += 1;
                    }
                }
            }
        }

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl), 
                context
            );

            let score = ability.base ? ability.base : 10;
            ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreBaseTooltip", { mod: score.signedString() }));

            const modFromTheme = themeMod[abl] ?? 0;
            if(modFromTheme) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreThemeTooltip", { mod: modFromTheme.signedString() }));
            }

            const modFromRace = racesMod[abl] ?? 0;
            if(modFromRace) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreRaceTooltip", { mod: modFromRace.signedString() }));
            }

            let intermediateScore = score + modFromTheme + modFromRace;
            if (abl in abilityScoreIncreasesMod) {
                for (let i = 0; i<abilityScoreIncreasesMod[abl]; i++) {
                    if (intermediateScore <= 16) {
                        intermediateScore += 2;
                    } else {
                        intermediateScore += 1;
                    }
                }
            }

            const raisedByASI = intermediateScore - (score + modFromTheme + modFromRace);
            if(raisedByASI) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreIncreaseTooltip", { mod: raisedByASI.signedString() }));
            }

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
                        sum += addModifier(bonus, data, ability, "SFRPG.AbilityScoreBonusTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], data, ability, "SFRPG.AbilityScoreBonusTooltip");
                }

                return sum;
            }, 0);

            ability.value = score + modFromRace + modFromTheme + raisedByASI + bonus;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}