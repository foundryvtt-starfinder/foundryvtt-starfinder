import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../modifiers/types.js";

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
            let computedBonus = bonus.max;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
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
        for (let [skl, skill] of Object.entries(skills)) {
            skill.rolledMods = null;
            const mods = context.parameters.stackModifiers.process(filteredMods.filter(mod => {
                // temporary workaround to fix modifiers with mod "0" if the situational mod is higher.
                if (mod.modifierType === SFRPGModifierType.FORMULA) {
                    if (skill.rolledMods) {
                        skill.rolledMods.push({mod: mod.modifier, bonus: mod});
                    } else {
                        skill.rolledMods = [{mod: mod.modifier, bonus: mod}];
                    }
                    return false;
                }
                if (mod.effectType === SFRPGEffectType.ALL_SKILLS) return true;
                else if (mod.effectType === SFRPGEffectType.SKILL && skl === mod.valueAffected) return true;
                else if (mod.effectType === SFRPGEffectType.ABILITY_SKILLS && skill.ability === mod.valueAffected) return true;

                return false;
            }), context);

            let accumulator = Object.entries(mods).reduce((sum, mod) => {
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
