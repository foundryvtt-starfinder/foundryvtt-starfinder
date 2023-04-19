import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateSkillArmorCheckPenalty", (fact, context) => {
        const armors = fact.armors?.length > 0 ? fact.armors : null;
        const shields = fact.shields;
        const skills = fact.data.skills;
        const modifiers = fact.modifiers;

        const worstArmor = armors?.reduce((armor, worstArmor) => (armor.system?.armor?.acp || 0) < (worstArmor.system?.armor?.acp || 0) ? armor : worstArmor);
        const armorData = worstArmor?.system;
        const hasLightArmor = armorData?.armor?.type === "light";
        const hasHeavyArmor = armorData?.armor?.type === "heavy";

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {}

            let mod = 0;
            if (bonus.valueAffected === "acp-light" && hasLightArmor) {
                mod = computedBonus;
            } else if (bonus.valueAffected === "acp-heavy" && hasHeavyArmor) {
                mod = computedBonus;
            } else {
                mod = computedBonus;
            }
            computedBonus = mod;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const acpMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ACP].includes(mod.effectType);
        });

        let skillModifier = {
            value: 0,
            tooltip: [],
            rolledMods: []
        };

        const mods = context.parameters.stackModifiers.process(acpMods, context, {actor: fact.actor});
        let mod = Object.entries(mods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, fact.data, skillModifier, "SFRPG.ACPTooltip");
                }
            } else {
                sum += addModifier(mod[1], fact.data, skillModifier, "SFRPG.ACPTooltip");
            }

            return sum;
        }, 0);

        for (const skill of Object.values(skills)) {
            if (!skill.hasArmorCheckPenalty) {
                continue;
            }

            if (armorData?.armor?.acp) {
                let acp = parseInt(armorData.armor.acp);
                if (!Number.isNaN(acp)) {
                    skill.mod += acp;

                    skill.tooltip.push(game.i18n.format("SFRPG.ACPTooltip", {
                        type: "Armor",
                        mod: acp.signedString(),
                        source: worstArmor.name
                    }));
                }
            }

            if (shields) {
                shields.forEach(shield => {
                    const shieldData = shield.system;

                    if (shieldData?.acp) {
                        let acp = parseInt(shieldData.acp);
                        if (!Number.isNaN(acp)) {
                            skill.mod += acp;

                            skill.tooltip.push(game.i18n.format("SFRPG.ACPTooltip", {
                                type: "Shield",
                                mod: acp.signedString(),
                                source: shield.name
                            }));
                        }
                    }
                });
            }

            if (skillModifier.tooltip.length !== 0) {
                skill.mod += mod;
                skill.tooltip = skill.tooltip.concat(skillModifier.tooltip);
            }

            if (!skill.rolledMods) {
                skill.rolledMods = [];
            }
            skill.rolledMods = skill.rolledMods.concat(skillModifier.rolledMods);
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
