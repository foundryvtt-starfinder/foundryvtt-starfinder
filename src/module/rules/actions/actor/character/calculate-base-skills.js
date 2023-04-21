export default function(engine) {
    engine.closures.add('calculateBaseSkills', (fact, context) => {
        const data = fact.data;
        const skills = data.skills;
        const theme = fact.theme;
        const classes = fact.classes;

        const classSkills = classes.reduce((prev, cls) => {
            const classData = cls.system;

            Object.entries(classData.csk).filter(s => s[1])
                .forEach((skill) => {
                    prev[skill[0]] = 3;
                });

            return prev;
        }, {});

        let themeMod = {};

        const themeData = theme?.system;
        if (themeData)
        {
            if (themeData.skill !== "" && !Object.keys(classSkills).includes(themeData.skill)) {
                classSkills[themeData.skill] = 3;
                themeMod[themeData.skill] = 0;
            } else if (themeData.skill !== "") {
                themeMod[themeData.skill] = 1;
            }
        }

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.value = parseFloat(skill.value || 0);
            if (skill.value !== 3) skill.value = classSkills[skl] ?? 0;
            const classSkill = skill.value;
            const hasRanks = skill.ranks > 0;
            const abilityMod = data.abilities[skill.ability].mod;
            const modFromTheme = themeMod[skl] ?? 0;
            skill.mod = abilityMod + skill.ranks + (hasRanks ? classSkill : 0) + skill.misc + modFromTheme;

            if (hasRanks) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipSkillRanks", {ranks: (skill.ranks - skill.min).signedString()}));

                if (classSkill === 3) {
                    skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipTrainedClassSkill", {mod: classSkill.signedString()}));
                }
            }

            if (modFromTheme !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipThemeMod", {mod: modFromTheme.signedString()}));
            }

            skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipAbilityMod", {abilityMod: abilityMod.signedString(), abilityAbbr: skill.ability.capitalize()}));

            if (skill.misc !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipMiscMod", {mod: skill.misc.signedString()}));
            }

            // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
            skill.rollTooltip = [ ...skill.tooltip ];
        }

        return fact;
    });
}
