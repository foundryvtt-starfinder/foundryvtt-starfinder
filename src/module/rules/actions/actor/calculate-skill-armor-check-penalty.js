import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSkillArmorCheckPenalty", (fact, context) => {
        const armor = fact.armor;
        const skills = fact.data.skills;
        const modifiers = fact.modifiers;

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

            let mod = 0;
            if (bonus.valueAffected === "acp-light" && armor.data.armor.type === "light") {
                mod = computedBonus;
            } else if (bonus.valueAffected === "acp-heavy" && armor.data.armor.type === "heavy") {
                mod = computedBonus;
            } else {
                mod = computedBonus;
            }
            computedBonus = mod;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

        const acpMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.ACP].includes(mod.effectType);
        });

        let skillModifier = {
            value: 0,
            tooltip: [],
            rolledMods: []
        };

        const mods = context.parameters.stackModifiers.process(acpMods, context);
        let mod = Object.entries(mods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, fact.data, skillModifier, "SFRPG.ACPTooltip");
                }
            }
            else {
                sum += addModifier(mod[1], fact.data, skillModifier, "SFRPG.ACPTooltip");
            }

            return sum;
        }, 0);

        for (const skill of Object.values(skills)) {
            if (!skill.hasArmorCheckPenalty) {
                continue;
            }

            if (armor?.data?.armor?.acp) {
                let acp = parseInt(armor.data.armor.acp);
                if (!Number.isNaN(acp)) {
                    skill.mod += acp;

                    skill.tooltip.push(game.i18n.format("SFRPG.ACPTooltip", {
                        type: "Armor",
                        mod: acp.signedString(),
                        source: armor.name
                    }));
                }
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