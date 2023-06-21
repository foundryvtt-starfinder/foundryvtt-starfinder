import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add( "calculateAbilityCheckModifiers", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (item.calculatedMods) {
                item.calculatedMods.push({mod: bonus.modifier, bonus: bonus});
            } else {
                item.calculatedMods = [{mod: bonus.modifier, bonus: bonus}];
            }

            let computedBonus = bonus.max || 0;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_CHECK, SFRPGEffectType.ABILITY_CHECKS].includes(mod.effectType);
        });

        for (let [abl, ability] of Object.entries(data.abilities)) {
            const abilityCheckMods = context.parameters.stackModifiers.process(filteredMods.filter(mod => {
                if (mod.modifierType === SFRPGModifierType.FORMULA) {
                    if (ability.rolledMods) {
                        ability.rolledMods.push({mod: mod.modifier, bonus: mod});
                    } else {
                        ability.rolledMods = [{mod: mod.modifier, bonus: mod}];
                    }
                    return false;
                }
                if (mod.valueAffected === abl) return true;
                if (mod.effectType === SFRPGEffectType.ABILITY_CHECKS) return true;

                return false;
            }), context, {actor: fact.actor});

            // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
            ability.rollTooltip = [ ...ability.tooltip ];

            const abilityCheckBonus = Object.entries(abilityCheckMods).reduce((sum, mod) => {
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
            ability.mod += abilityCheckBonus;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
