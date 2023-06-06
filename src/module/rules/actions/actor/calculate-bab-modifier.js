import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateBaseAttackBonusModifier", (fact, context) => {
        const data = fact.data;

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

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        // Iterate through any modifiers that affect BAB
        let filteredModifiers = fact.modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && mod.effectType == SFRPGEffectType.BASE_ATTACK_BONUS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        const bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        data.attributes.baseAttackBonus.value += bonus;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
