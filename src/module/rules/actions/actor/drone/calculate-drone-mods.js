export default function (engine) {
    engine.closures.add("calculateDroneMods", (fact, context) => {
        const data = fact.data;
        const mods = fact.mods;

        data.attributes.arms = 0;
        data.attributes.weaponMounts.melee.max = 0;
        data.attributes.weaponMounts.ranged.max = 0;
        data.attributes.armorSlots.current = 0;
        data.attributes.armorSlots.max = 0;
        data.traits.senses = "";

        // Process common mod properties
        for (let mod of mods) {
            const modData = mod.data.data;

            if (modData.arms.number > 0) {
                if (modData.arms.armType === "general") {
                    data.attributes.arms += modData.arms.number;
                }
                if (modData.arms.armType === "melee") {
                    data.attributes.weaponMounts.melee.max = modData.arms.number;
                }
                if (modData.arms.armType === "ranged") {
                    data.attributes.weaponMounts.ranged.max = modData.arms.number;
                }
            }

            if (modData.additionalMovement) {
                if (data.attributes.speed.special) {
                    data.attributes.speed.special += ", ";
                }
                data.attributes.speed.special += modData.additionalMovement;
            }

            if (modData.additionalSenses) {
                if (data.traits.senses) {
                    data.traits.senses += ", ";
                }
                data.traits.senses += modData.additionalSenses;
            }

            if (modData.isArmorSlot) {
                data.attributes.armorSlots.max += 1;
            }

            if (modData.weaponProficiency) {
                if (!data.traits.weaponProf.value.includes(modData.weaponProficiency)) {
                    data.traits.weaponProf.value.push(modData.weaponProficiency);
                }
            }

            if (modData.bonusSkill) {
                let skill = data.skills[modData.bonusSkill];

                skill.enabled = true;
                skill.value = 3;
                skill.ranks = data.details.level.value;

                let tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                    type: "Class Skill",
                    mod: skill.value.signedString(),
                    source: mod.name
                });
    
                skill.tooltip.push(tooltip);
    
                tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                    type: "Mechanic Level",
                    mod: skill.ranks.signedString(),
                    source: mod.name
                });
    
                skill.tooltip.push(tooltip);
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}