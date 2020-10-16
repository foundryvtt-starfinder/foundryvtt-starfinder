import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

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

        let bab = 0;

        for (const cls of classes) {
            let mod = 0;
            switch (cls.data.bab) {
                case "slow": mod += Math.floor(cls.data.levels * 0.5); break;
                case "moderate": mod += Math.floor(cls.data.levels * 0.75); break;
                case "full": mod += cls.data.levels; break;
            }

            data.attributes.babtooltip.push(game.i18n.format("SFRPG.BABTooltip", {
                class: cls.name,
                bonus: mod.signedString()
            }));

            bab += mod;
        }
        
        // Iterate through any modifiers that affect BAB
        let filteredModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.BASE_ATTACK_BONUS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let baseAttackBonus = {
            value: 0,
            tooltip: [],
            rolledMods: []
        };
        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        data.attributes.bab = bab + bonus;
        data.attributes.babtooltip = baseAttackBonus.tooltip;
        data.attributes.baseAttackBonus = {
            value: bab + bonus,
            tooltip: baseAttackBonus.tooltip,
            rolledMods: baseAttackBonus.rolledMods
        };
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}