import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {

        const addModifiers = (bonus, data, armorClass) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType == "formula") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }

            if (computedBonus !== 0)
                armorClass.tooltip.push(game.i18n.format("SFRPG.ACTooltipBonus", { 
                    mod: computedBonus.signedString(), 
                    source: bonus.name, 
                    type: bonus.type.capitalize() 
                }));

            return computedBonus;
        }
        
        const data = fact.data;
        const flags = fact.flags;
        const wornArmor = fact.armor;
        const modifiers = fact.modifiers;
        const eac = data.attributes.eac;
        const kac = data.attributes.kac;

        eac.tooltip = eac.tooltip ?? [];
        kac.tooltip = kac.tooltip ?? [];

        if (!flags) return fact;
        if (!wornArmor && fact.type !== "drone") return fact;
        if (!modifiers) return fact;

        /** @deprecated Will be removed in 0.4.0 */
        const armorSavant = getProperty(flags, "sfrpg.armorSavant") ? 1 : 0;
        
        let armorMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.AC].includes(mod.effectType);
        });
        
        let eacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["eac", "both"].includes(mod.valueAffected)), context);
        let kacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["kac", "both"].includes(mod.valueAffected)), context);

        let eacMod = Object.entries(eacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifiers(bonus, data, eac);
                }
            }
            else {
                sum += addModifiers(curr[1], data, eac);
            }

            return sum;
        }, 0);

        let kacMod = Object.entries(kacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifiers(bonus, data, kac);
                }
            }
            else {
                sum += addModifiers(curr[1], data, kac);
            }

            return sum;
        }, 0);

        eac.value += armorSavant + eacMod;
        kac.value += armorSavant + kacMod;

        if (armorSavant > 0) {
            const armorSavantTooltip = game.i18n.format("SFRPG.ACTooltipBonus", { mod: armorSavant.signedString(), source: "Armor Savant", type: SFRPGModifierTypes.RACIAL.capitalize() });
            eac.tooltip.push(armorSavantTooltip);
            kac.tooltip.push(armorSavantTooltip);
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}