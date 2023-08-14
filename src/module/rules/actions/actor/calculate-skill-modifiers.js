import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add('calculateSkillModifiers', (fact, context) => {
        const skills = fact.data.skills;
        const flags = fact.flags;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (item.calculatedMods) {
                item.calculatedMods.push({mod: bonus.modifier, bonus: bonus});
            } else {
                item.calculatedMods = [{mod: bonus.modifier, bonus: bonus}];
            }
            let computedBonus = bonus.max || 0;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_SKILLS, SFRPGEffectType.SKILL, SFRPGEffectType.ALL_SKILLS].includes(mod.effectType);
        });

        // Skills
		const getFilteredSkills = (skl, skill, mod) => {
			if (mod.modifierType === SFRPGModifierType.FORMULA 
				&& (
					mod.effectType === SFRPGEffectType.ALL_SKILLS
                    || mod.effectType === SFRPGEffectType.SKILL && skl === mod.valueAffected
                    || mod.effectType === SFRPGEffectType.ABILITY_SKILLS && skill.ability === mod.valueAffected
				)
			) 
			{
				if (skill.rolledMods) {
					skill.rolledMods.push({mod: mod.modifier, bonus: mod});
				} else {
					skill.rolledMods = [{mod: mod.modifier, bonus: mod}];
				}
				return false;
			}
			
			return (mod.effectType === SFRPGEffectType.ALL_SKILLS) 
				|| (mod.effectType === SFRPGEffectType.SKILL && skl === mod.valueAffected) 
				|| (mod.effectType === SFRPGEffectType.ABILITY_SKILLS && skill.ability === mod.valueAffected);
		};
		
		
        for (let [skl, skill] of Object.entries(skills)) {
            skill.rolledMods = null;
			
			//Imper1um 08/14/2023: 
			//	I removed .process from this system.
			//	What was happening is that the filter system was looping... infinitely. This is because
			//  stackModifiers.process was calling calculate-skill-modifiers.
			//  Please note you *CANNOT* call stackModifiers.process INSIDE of a processor, you will cause an infinite loop.
			//  This has existed for years, but its been ignored by one problem or another.
			//  Anyways, calling the .process from here is useless. By time it's gotten here, all of the mods have been
			//  properly processed (at least in the correct order), so there's no reason to ask the system to call it again.
			var skillFilteredMods = filteredMods.filter(mod => getFilteredSkills(skl, skill, mod));

            let accumulator = Object.entries(skillFilteredMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, fact.data, skill, "SFRPG.SkillModifierTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], fact.data, skill, "SFRPG.SkillModifierTooltip");
                }

                return sum;
            }, 0);

            skill.mod += accumulator;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
