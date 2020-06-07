import { StarfinderEffectType } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {
        // TODO: Refactor when the full modifiers system is in place
        // right now this is only processing the armor savant flag.
        const data = fact.data;
        const flags = fact.flags;
        const armor = fact.armor;
        const modifiers = fact.modifiers;

        if (!flags) return fact;
        if (!armor) return fact;
        if (!modifiers) return fact;

        /** @deprecated Will be removed in 0.4.0 */
        let armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;
        
        let armorMods = modifiers.filter(mod => {
            return [StarfinderEffectType.AC, StarfinderEffectType.EAC, StarfinderEffectType.KAC].includes(mod.effectType);
        }).filter(mod => mod.enabled);

        console.log(armorMods);

        let sum = armorMods.reduce((sum, curr) => {
            sum += curr.modifier;
            return sum;
        }, 0);

        data.attributes.eac.value += armorSavant + sum;
        data.attributes.kac.value += armorSavant + sum;

        return fact;
    });
}