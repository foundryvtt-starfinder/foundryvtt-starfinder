import { SFRPG } from "../../../../config.js";

export default function(engine) {
    engine.closures.add("calculateDroneSkills", (fact) => {
        const data = fact.data;

        const skillkeys = Object.keys(SFRPG.skills);
        for (const skillKey of skillkeys) {
            const skill = data.skills[skillKey];
            if (!skill.enabled) {
                continue;
            }

            const abilityMod = data.abilities[skill.ability].mod;

            skill.mod = skill.value + skill.ranks + abilityMod;

            if (abilityMod !== 0) {
                const tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
                    type: "Ability Score",
                    mod: abilityMod.signedString(),
                    source: SFRPG.abilities[skill.ability]
                });

                skill.tooltip.push(tooltip);
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
