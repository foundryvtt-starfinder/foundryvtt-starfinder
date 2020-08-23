import { SFRPG } from "../../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneSkills", (fact, context) => {
        const data = fact.data;

        let skillkeys = Object.keys(SFRPG.skills);
        for (let skillKey of skillkeys) {
            let skill = data.skills[skillKey];
            if (!skill.enabled) {
                continue;
            }

            let abilityMod = data.abilities[skill.ability].mod;

            skill.mod = skill.value + skill.ranks + abilityMod;

            if (abilityMod !== 0) {
                let tooltip = game.i18n.format("SFRPG.SkillModifierTooltip", {
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