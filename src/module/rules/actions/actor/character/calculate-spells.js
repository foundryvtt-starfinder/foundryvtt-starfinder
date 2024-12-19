export default function(engine) {
    engine.closures.add("calculateSpells", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        data.spells.classes = [];
        const casterData = data.spells;

        const computeSpellsPerDay = (spellLevel, classData, spellAbilityMod) => {
            let totalSpells = 0;

            try {
                totalSpells += classData.spellsPerDay[classData.levels][spellLevel] || 0;
            } catch {}

            // Only apply bonus spells known if there is a base spells known.
            if (totalSpells > 0) {
                try {
                    // TODO: If spellAbilityMod is not part of bonusSpellsPerDay's keys, find the nearest key and use that instead.
                    totalSpells += classData.bonusSpellsPerDay[spellAbilityMod][spellLevel] || 0;
                } catch {}
            }

            return totalSpells;
        };

        for (const cls of classes) {
            const classData = cls.system;

            const className = classData.slug || cls.name.slugify({replacement: "_", strict: true});
            const keyAbilityScore = classData.kas || "str";
            const spellAbilityScore =  classData.spellAbility || classData.kas || "str";

            const classInfo = {
                keyAbilityMod: data.abilities[keyAbilityScore].mod,
                levels: classData.levels,
                keyAbilityScore: keyAbilityScore,
                skillRanksPerLevel: classData.skillRanks.value,
                isCaster: classData.isCaster,
                spellAbilityMod: data.abilities[spellAbilityScore]?.mod
            };

            if (classInfo.isCaster) {
                casterData.classes.push({
                    classItemId: cls.id,
                    name: cls.name,
                    key: className
                });

                for (const level of Object.keys(CONFIG.SFRPG.spellLevels).filter((key) => key !== 0)) {
                    foundry.utils.setProperty(
                        casterData,
                        `spell${level}.perClass.${className}.max`,
                        computeSpellsPerDay(level, classData, classInfo.spellAbilityMod)
                    );
                }

            }
        }

        // Pre-calculate close, medium and long spell ranges for use in item prep.
        const cl = data.details.cl.value || 0;

        casterData.range = {
            close: 25 + 5 * Math.floor(cl / 2),
            medium: 100 + 10 * cl,
            long: 400 + 40 * cl
        };

        return fact;
    });
}
