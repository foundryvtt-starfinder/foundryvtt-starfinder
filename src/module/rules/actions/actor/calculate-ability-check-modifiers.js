import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateAbilityCheckModifiers", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

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
            return mod.enabled && [SFRPGEffectType.ABILITY_CHECK, SFRPGEffectType.ABILITY_CHECKS].includes(mod.effectType);
        });

        for (let [abl, ability] of Object.entries(data.abilities)) {
            const abilityCheckMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl || mod.effectType === SFRPGEffectType.ABILITY_CHECKS),
                context
            );
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
            ability.abilityCheckBonus = abilityCheckBonus;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}