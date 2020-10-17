import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;
        const eac = data.attributes.eac;
        const kac = data.attributes.kac;
        
        eac.tooltip = eac.tooltip ?? [];
        kac.tooltip = kac.tooltip ?? [];

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

        let armorMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.AC].includes(mod.effectType);
        });
        
        let eacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["eac", "both"].includes(mod.valueAffected)), context);
        let kacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["kac", "both"].includes(mod.valueAffected)), context);

        let eacMod = Object.entries(eacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifier(bonus, data, eac, "SFRPG.ACTooltipBonus");
                }
            }
            else {
                sum += addModifier(curr[1], data, eac, "SFRPG.ACTooltipBonus");
            }

            return sum;
        }, 0);

        let kacMod = Object.entries(kacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifier(bonus, data, kac, "SFRPG.ACTooltipBonus");
                }
            }
            else {
                sum += addModifier(curr[1], data, kac, "SFRPG.ACTooltipBonus");
            }

            return sum;
        }, 0);

        eac.value += eacMod;
        kac.value += kacMod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}