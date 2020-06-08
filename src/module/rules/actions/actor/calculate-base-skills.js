export default function (engine) {
    engine.closures.add('calculateBaseSkills', (fact, context) => {
        const data = fact.data;
        const skills = data.skills;        

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.value = parseFloat(skill.value || 0);
            let classSkill = skill.value;
            let hasRanks = skill.ranks > 0;
            skill.mod = data.abilities[skill.ability].mod + skill.ranks + (hasRanks ? classSkill : 0) + skill.misc;
        }

        return fact;
    });
}
