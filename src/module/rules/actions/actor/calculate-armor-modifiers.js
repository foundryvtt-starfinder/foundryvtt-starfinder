import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {

        const addModifiers = (bonus) => {
            let eacMod = 0;
            let kacMod = 0;

            if (bonus.effectType === StarfinderEffectType.EAC)
                eacMod += bonus.modifier;
            else if (bonus.effectType === StarfinderEffectType.KAC)
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

        if (!flags) return fact;
        if (!wornArmor) return fact;
        if (!modifiers) return fact;

        /** @deprecated Will be removed in 0.4.0 */
        const armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;
        
        let armorMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.AC, StarfinderEffectType.EAC, StarfinderEffectType.KAC].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        let mods = context.parameters.stackModifiers.process(armorMods, context);
        let [eacMod, kacMod] = Object.entries(mods).reduce((sums, curr) => {

            if (curr[1] === null || curr[1].length < 1) return sums;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    let [eacMod, kacMod] = addModifiers(bonus);
                    sums[0] += eacMod;
                    sums[1] += kacMod;
                }
            }
            else {
                let [eacMod, kacMod] = addModifiers(curr[1]);
                sums[0] += eacMod;
                sums[1] += kacMod;
            }

            return sums;
        }, [0, 0]);

        data.attributes.eac.value += armorSavant + eacMod;
        data.attributes.kac.value += armorSavant + kacMod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}