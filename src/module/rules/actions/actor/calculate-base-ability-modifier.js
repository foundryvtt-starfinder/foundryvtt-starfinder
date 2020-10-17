import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityModifier", (fact, context) => {
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
            return mod.enabled && [SFRPGEffectType.ABILITY_MODIFIER, SFRPGEffectType.ABILITY_MODIFIERS].includes(mod.effectType);
        })

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl || mod.effectType === SFRPGEffectType.ABILITY_MODIFIERS), 
                context
            );

            let abilityValue = ability.value;
            if (Number.isNaN(Number.parseInt(abilityValue))) {
                abilityValue = 10;
            }

            const base = Math.floor((abilityValue - 10) / 2);
            ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityModifierBase", { mod: base.signedString() }));

            let mod = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, data, ability, "SFRPG.AbilityModifiersTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], data, ability, "SFRPG.AbilityModifiersTooltip");
                }

                return sum;
            }, 0);

            let abilityModifier = base + mod;

            if (ability.damage) {
                let damage = -Math.floor(Math.abs(ability.damage) / 2);
                abilityModifier += damage;
                ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityDamageTooltip", { mod: damage.signedString() }));
            }

            ability.mod = abilityModifier;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}