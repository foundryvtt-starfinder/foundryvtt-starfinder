import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSkillpoints", (fact, context) => {
        const data = fact.data;
        const skills = fact.data.skills;
        const classes = fact.classes;

        /** Fix the skillpoints field if not present. (Old data) */
        if (!data.skillpoints) {
            data.skillpoints = {
                used: 0,
                max: 0,
                tooltip: []
            };
        }

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

        const intModifier = data.abilities.int.mod;
        
        // Iterate through any modifiers that grant the character additional skillpoints to distribute
        // These only count towards skillpoint max
        let skillPointModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType === SFRPGEffectType.SKILL_POINTS;
        });
        skillPointModifiers = context.parameters.stackModifiers.process(skillPointModifiers, context);

        const skillPointModifierBonus = Object.entries(skillPointModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.skillpoints, "SFRPG.ActorSheet.Modifiers.Tooltips.BonusSkillpoints");
                }
            } else {
                sum += addModifier(mod[1], data, data.skillpoints, "SFRPG.ActorSheet.Modifiers.Tooltips.BonusSkillpoints");
            }

            return sum;
        }, 0);

        // Iterate through any modifiers that grant the character additional skillranks distributed for them
        // These always apply to a specific skill
        let skillRankModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType === SFRPGEffectType.SKILL_RANKS;
        });

        for (let [key, skill] of Object.entries(skills)) {
            skill.rolledMods = null;
            const mods = context.parameters.stackModifiers.process(skillRankModifiers.filter(mod => {
                if (mod.effectType !== SFRPGEffectType.SKILL_RANKS) return false;
                else if (key !== mod.valueAffected) return false;
                
                return true;
            }), context);

            let accumulator = Object.entries(mods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, fact.data, skill, "SFRPG.ActorSheet.Modifiers.Tooltips.SkillRank");
                    }
                } else {
                    sum += addModifier(mod[1], fact.data, skill, "SFRPG.ActorSheet.Modifiers.Tooltips.SkillRank");
                }

                return sum;
            }, 0);
            
            skill.min = accumulator;
        }
        
        let skillpointsMax = 0;
        let totalLevel = 0;
        for (const cls of classes) {
            const classBonus = cls.data.levels * (intModifier + cls.data.skillRanks.value);
            skillpointsMax += classBonus;
            totalLevel += cls.data.levels;

            data.skillpoints.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Modifiers.Tooltips.ClassSkillpoints", {
                class: cls.name,
                total: classBonus.signedString()
            }));
        }

        let skillpointsUsed = 0;
        for (const [key, skill] of Object.entries(data.skills)) {
            if (Number.isNaN(skill.min) || skill.min < 0) {
                skill.min = 0;
            }

            skill.ranks = Math.max(skill.min, Math.min(skill.ranks, totalLevel));
            skillpointsUsed += (skill.ranks - skill.min);
        }
        
        skillpointsMax += skillPointModifierBonus;
        
        data.skillpoints.used = skillpointsUsed;
        data.skillpoints.max = skillpointsMax;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}