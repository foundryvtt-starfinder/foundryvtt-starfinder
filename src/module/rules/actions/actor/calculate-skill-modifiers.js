import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add('calculateSkillModifiers', (fact, context) => {
        const skills = fact.data.skills;
        const flags = fact.flags;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, skill) => {
            let skillMod = 0;
            
            skillMod += bonus.modifier;

            if (skillMod !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillModifierTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }
            
            return skillMod;
        };

        const addLegacyModifierTooltip = (modifier, name, type, skill) => {
            if (modifier !== 0) {
                const tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                    type: type.capitalize(),
                    mod: modifier.signedString(),
                    source: name
                });

                skill.tooltip.push(tooltip);
            }
        };

        /** @deprecated These will be removed in 0.4.0 */
        let flatAffect = getProperty(flags, "sfrpg.flatAffect") ? -2 : 0;
        let historian = getProperty(flags, "sfrpg.historian") ? 2 : 0;
        let naturalGrace = getProperty(flags, "sfrpg.naturalGrace") ? 2 : 0;
        let cultrualFascination = getProperty(flags, "sfrpg.culturalFascination") ? 2 : 0;
        let scrounger = getProperty(flags, "sfrpg.scrounger") ? 2 : 0;
        let elvenMagic = getProperty(flags, "sfrpg.elvenMagic") ? 2 : 0;
        let keenSenses = getProperty(flags, "sfrpg.keenSenses") ? 2 : 0;
        let curious = getProperty(flags, "sfrpg.curious") ? 2 : 0;
        let intimidating = getProperty(flags, "sfrpg.intimidating") ? 2 : 0;
        let selfSufficient = getProperty(flags, "sfrpg.selfSufficient") ? 2 : 0;
        let sneaky = getProperty(flags, "sfrpg.sneaky") ? 2 : 0;
        let sureFooted = getProperty(flags, "sfrpg.sureFooted") ? 2 : 0;

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [SFRPGEffectType.ABILITY_SKILLS, SFRPGEffectType.SKILL, SFRPGEffectType.ALL_SKILLS].includes(mod.effectType) &&
                mod.modifierType === SFRPGModifierType.CONSTANT;
        });

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.tooltip = skill.tooltip ?? [];

            const mods = context.parameters.stackModifiers.process(filteredMods.filter(mod => [
                skl,
                skill.ability
            ].includes(mod.valueAffected) || mod.effectType === SFRPGEffectType.ALL_SKILLS), context);


            let accumulator = Object.entries(mods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, skill);
                    }
                } else {
                    sum += addModifier(mod[1], skill);
                }

                return sum;
            }, 0);
            
            // Specific skill modifiers
            switch (skl) {
                case "acr":
                    accumulator += naturalGrace;
                    addLegacyModifierTooltip(naturalGrace, "Natural Grace", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += sureFooted;
                    addLegacyModifierTooltip(sureFooted, "Sure-Footed", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "ath":
                    accumulator += naturalGrace;
                    addLegacyModifierTooltip(naturalGrace, "Natural Grace", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += sureFooted;
                    addLegacyModifierTooltip(sureFooted, "Sure-Footed", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "cul":
                    accumulator += historian;
                    addLegacyModifierTooltip(historian, "Historian", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += cultrualFascination;
                    addLegacyModifierTooltip(cultrualFascination, "Cultural Fascination", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += curious;
                    addLegacyModifierTooltip(curious, "Curious", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "dip":
                    accumulator += cultrualFascination;
                    addLegacyModifierTooltip(cultrualFascination, "Cultural Fascination", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "eng":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "int":
                    accumulator += intimidating;
                    addLegacyModifierTooltip(intimidating, "Intimidating", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "mys":
                    accumulator += elvenMagic;
                    addLegacyModifierTooltip(elvenMagic, "Elven Magic", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "per":
                    accumulator += keenSenses;
                    addLegacyModifierTooltip(keenSenses, "Keen Senses", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "sen":
                    accumulator += flatAffect;
                    addLegacyModifierTooltip(flatAffect, "Flat Affect", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "ste":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += sneaky;
                    addLegacyModifierTooltip(sneaky, "Sneaky", SFRPGModifierTypes.RACIAL, skill);
                    break;
                case "sur":
                    accumulator += scrounger;
                    addLegacyModifierTooltip(scrounger, "Scrounger", SFRPGModifierTypes.RACIAL, skill);
                    accumulator += selfSufficient;
                    addLegacyModifierTooltip(selfSufficient, "Self Sufficient", SFRPGModifierTypes.RACIAL, skill);
                    break;
            }

            skill.mod += accumulator;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
