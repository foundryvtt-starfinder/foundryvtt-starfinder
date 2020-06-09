import { StarfinderModifierType, StarfinderModifierTypes, StarfinderEffectType } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add('calculateSkillModifiers', (fact, context) => {
        const skills = fact.data.skills;
        const flags = fact.flags;
        const modifiers = fact.modifiers;

        const processModifiers = (bonus, obj) => {
            switch (bonus.effectType) {
                case StarfinderEffectType.ALL_SKILLS:
                    if (!obj["all"]) obj["all"] = [bonus];
                    else obj["all"].push(bonus);
                    break;
                case StarfinderEffectType.SKILL:
                case StarfinderEffectType.ABILITY_SKILLS:
                default:
                    if (!obj[bonus.valueAffected]) obj[bonus.valueAffected] = [bonus];
                    else obj[bonus.valueAffected].push(bonus);
                    break;
            }
        };

        const addModifier = (bonuses, skill) => {
            if (!bonuses) return 0;

            let skillMod = 0;

            for (const bonus of bonuses) {
                skillMod += bonus.modifier;

                if (bonus.modifier !== 0) {
                    skill.tooltip.push(game.i18n.format("STARFINDER.SkillModifierTooltip", {
                        type: bonus.type.capitalize(),
                        mod: bonus.modifier.signedString(),
                        source: bonus.name
                    }));
                }
            }
            
            return skillMod;
        };

        const addLegacyModifierTooltip = (modifier, name, type, skill) => {
            if (modifier !== 0) {
                const tooltip = game.i18n.format("STARFINDER.SkillModifierTooltip", {
                    type: type.capitalize(),
                    mod: modifier.signedString(),
                    source: name
                });

                skill.tooltip.push(tooltip);
            }
        };

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

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.ABILITY_SKILLS, StarfinderEffectType.SKILL, StarfinderEffectType.ALL_SKILLS].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(filteredMods, context);
        const skillMods = Object.entries(mods).reduce((prev, modifier) => {
            if (modifier[1] === null || modifier[1].length < 1) return prev;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(modifier[0])) {
                for (const bonus of modifier[1]) {
                    processModifiers(bonus, prev);
                }
            } else {
                processModifiers(modifier[1], prev);
            }

            return prev;
        }, {});

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.tooltip = skill.tooltip ?? [];

            let accumulator = 0;

            accumulator += addModifier(skillMods[skl], skill);
            accumulator += addModifier(skillMods["all"], skill);
            accumulator += addModifier(skillMods[skill.ability], skill);
            
            // Specific skill modifiers
            switch (skl) {
                case "acr":
                    accumulator += naturalGrace;
                    addLegacyModifierTooltip(naturalGrace, "Natural Grace", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += sureFooted;
                    addLegacyModifierTooltip(sureFooted, "Sure-Footed", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "ath":
                    accumulator += naturalGrace;
                    addLegacyModifierTooltip(naturalGrace, "Natural Grace", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += sureFooted;
                    addLegacyModifierTooltip(sureFooted, "Sure-Footed", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "cul":
                    accumulator += historian;
                    addLegacyModifierTooltip(historian, "Historian", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += cultrualFascination;
                    addLegacyModifierTooltip(cultrualFascination, "Cultural Fascination", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += curious;
                    addLegacyModifierTooltip(curious, "Curious", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "dip":
                    accumulator += cultrualFascination;
                    addLegacyModifierTooltip(cultrualFascination, "Cultural Fascination", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "eng":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "int":
                    accumulator += intimidating;
                    addLegacyModifierTooltip(intimidating, "Intimidating", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "mys":
                    accumulator += elvenMagic;
                    addLegacyModifierTooltip(elvenMagic, "Elven Magic", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "per":
                    accumulator += keenSenses;
                    addLegacyModifierTooltip(keenSenses, "Keen Senses", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "sen":
                    accumulator += flatAffect;
                    addLegacyModifierTooltip(flatAffect, "Flat Affect", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "ste":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += sneaky;
                    addLegacyModifierTooltip(sneaky, "Sneaky", StarfinderModifierTypes.RACIAL, skill);
                    break;
                case "sur":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", StarfinderModifierTypes.RACIAL, skill);
                    accumulator += selfSufficient;
                    addLegacyModifierTooltip(selfSufficient, "Self Sufficient", StarfinderModifierTypes.RACIAL, skill);
                    break;
            }

            skill.mod += accumulator;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
