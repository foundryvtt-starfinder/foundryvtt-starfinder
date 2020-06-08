import { StarfinderModifierType, StarfinderModifierTypes, StarfinderEffectType } from "../../../modifiers/types";

export default function (engine) {
    engine.closures.add('calculateSkillModifiers', (fact, context) => {
        const skills = fact.data.skills;
        const flags = fact.flags;
        const modifiers = fact.modifiers;

        /** @deprecated These will be removed in 0.4.0 */
        let flatAffect = getProperty(flags, "starfinder.flatAffect") ? -2 : 0;
        let historian = getProperty(flags, "starfinder.historian") ? 2 : 0;
        let naturalGrace = getProperty(flags, "starfinder.naturalGrace") ? 2 : 0;
        let cultrualFascination = getProperty(flags, "starfinder.culturalFascination") ? 2 : 0;
        let scrounger = getProperty(flags, "starfinder.scrounger") ? 2 : 0;
        let elvenMagic = getProperty(flags, "starfinder.elvenMagic") ? 2 : 0;
        let keenSenses = getProperty(flags, "starfinder.keenSenses") ? 2 : 0;
        let curious = getProperty(flags, "starfinder.curious") ? 2 : 0;
        let intimidating = getProperty(flags, "starfinder.intimidating") ? 2 : 0;
        let selfSufficient = getProperty(flags, "starfinder.selfSufficient") ? 2 : 0;
        let sneaky = getProperty(flags, "starfinder.sneaky") ? 2 : 0;
        let sureFooted = getProperty(flags, "starfinder.sureFooted") ? 2 : 0;

        const skillMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.ABILITY_SKILLS, StarfinderEffectType.SKILL].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(skillMods, context);

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            let accumulator = 0;
            // Specific skill modifiers
            switch (skl) {
                case "acr":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "ath":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "cul":
                    accumulator += historian;
                    accumulator += cultrualFascination;
                    accumulator += curious;
                    break;
                case "dip":
                    accumulator += cultrualFascination;
                    break;
                case "eng":
                    accumulator += scrounger;
                    break;
                case "int":
                    accumulator += intimidating;
                    break;
                case "mys":
                    accumulator += elvenMagic;
                    break;
                case "per":
                    accumulator += keenSenses;
                    break;
                case "sen":
                    accumulator += flatAffect;
                    break;
                case "ste":
                    accumulator += scrounger;
                    accumulator += sneaky;
                    break;
                case "sur":
                    accumulator += scrounger;
                    accumulator += selfSufficient;
                    break;
            }

            skill.mod += accumulator;
        }

        return fact;
    });
}
