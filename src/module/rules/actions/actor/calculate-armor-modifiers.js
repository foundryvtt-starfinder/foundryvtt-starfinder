import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {

        const addModifiers = (bonus, armorClass) => {
            let mod = 0;
            
            mod += bonus.modifier;
            if (mod !== 0)
                armorClass.tooltip.push(game.i18n.format("SFRPG.ACTooltipBonus", { 
                    mod: mod.signedString(), 
                    source: bonus.name, 
                    type: bonus.type.capitalize() 
                }));

            return mod;
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
        if (!wornArmor) return fact;
        if (!modifiers) return fact;

        /** @deprecated Will be removed in 0.4.0 */
        const armorSavant = getProperty(flags, "sfrpg.armorSavant") ? 1 : 0;
        
        let armorMods = modifiers.filter(mod => {
            return mod.enabled && 
                [SFRPGEffectType.AC].includes(mod.effectType) &&
                mod.modifierType === SFRPGModifierType.CONSTANT;
        });
        
        let eacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["eac", "both"].includes(mod.valueAffected)), context);
        let kacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["kac", "both"].includes(mod.valueAffected)), context);

        let eacMod = Object.entries(eacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifiers(bonus, eac);
                }
            }
            else {
                sum += addModifiers(curr[1], eac);
            }

            return sum;
        }, 0);

        let kacMod = Object.entries(kacMods).reduce((sum, curr) => {
            if (curr[1] === null || curr[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    sum += addModifiers(bonus, kac);
                }
            }
            else {
                sum += addModifiers(curr[1], kac);
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