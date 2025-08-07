export default function(engine) {
    engine.closures.add('calculateNPC2BaseSkills', (fact) => {
        const data = fact.data;
        const skills = data.skills;

        // Skills
        for (const skill of Object.values(skills)) {
            skill.ranks = parseFloat(skill.ranks || '0');
            skill.mod = skill.ranks;

            skill.tooltip = [];
            skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipSkillRanks", {ranks: (skill.ranks - skill.min).signedString()}));
        }

        return fact;
    });
}
