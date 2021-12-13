export default function (engine) {
    engine.closures.add('calculateNPC2BaseSkills', (fact, context) => {
        const data = fact.data;
        const skills = data.skills;

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.ranks = parseFloat(skill.ranks || 0);
            skill.mod = skill.ranks;

            skill.tooltip = [];
            skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipSkillRanks", {ranks: (skill.ranks - skill.min).signedString()}));

            const ability = data.abilities[skill.ability];
            if (ability) {
                const abilityMod = (ability.mod - ability.base);
                if (abilityMod) {
                    skill.mod += abilityMod;
                    skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipAbilityMod", {abilityMod: abilityMod.signedString(), abilityAbbr: skill.ability.capitalize()}));
                }
            }
        }

        return fact;
    });
}
