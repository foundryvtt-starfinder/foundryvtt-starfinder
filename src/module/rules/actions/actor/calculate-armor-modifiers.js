import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {

        const addModifiers = (bonus) => {
            let eacMod = 0;
            let kacMod = 0;

            if (bonus.valueAffected === "eac")
                eacMod += bonus.modifier;
            else if (bonus.valueAffected === "kac")
                kacMod += bonus.modifier;
            else {
                eacMod += bonus.modifier;
                kacMod += bonus.modifier;
            }

            return [eacMod, kacMod];
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
        const armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;
        
        let armorMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.AC].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        let mods = context.parameters.stackModifiers.process(armorMods, context);
        let [eacMod, kacMod] = Object.entries(mods).reduce((sums, curr) => {

            if (curr[1] === null || curr[1].length < 1) return sums;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    let [eacMod, kacMod] = addModifiers(bonus);
                    sums[0] += eacMod;
                    eac.tooltip.push(game.i18n.format("STARFINDER.ACTooltipBonus", { mod: eacMod.signedString(), source: bonus.name, type: bonus.type.capitalize() }));
                    sums[1] += kacMod;
                    kac.tooltip.push(game.i18n.format("STARFINDER.ACTooltipBonus", { mod: kacMod.signedString(), source: bonus.name, type: bonus.type.capitalize() }));
                }
            }
            else {
                let [eacMod, kacMod] = addModifiers(curr[1]);
                sums[0] += eacMod;
                eac.tooltip.push(game.i18n.format("STARFINDER.ACTooltipBonus", { mod: eacMod.signedString(), source: curr[1].name, type: curr[1].type.capitalize() }));
                sums[1] += kacMod;
                kac.tooltip.push(game.i18n.format("STARFINDER.ACTooltipBonus", { mod: kacMod.signedString(), source: curr[1].name, type: curr[1].type.capitalize() }));
            }

            return sums;
        }, [0, 0]);

        eac.value += armorSavant + eacMod;
        kac.value += armorSavant + kacMod;

        if (armorSavant > 0) {
            const armorSavantTooltip = game.i18n.format("STARFINDER.ACTooltipBonus", { mod: armorSavant.signedString(), source: "Armor Savant", type: StarfinderModifierTypes.RACIAL.capitalize() });
            eac.tooltip.push(armorSavantTooltip);
            kac.tooltip.push(armorSavantTooltip);
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}