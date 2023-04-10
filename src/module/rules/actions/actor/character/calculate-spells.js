export default function(engine) {
    engine.closures.add("calculateSpells", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        data.spells.classes = [];
        const casterData = deepClone(data.spells);

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

        let anyCasterClass = false;

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

            if (classInfo.isCaster) anyCasterClass = true;

            if (anyCasterClass) {
                casterData.classes.push({
                    classItemId: cls.id,
                    name: cls.name,
                    key: className
                });
                casterData.spell1.perClass[className] = {
                    max: computeSpellsPerDay(1, classData, classInfo.spellAbilityMod)
                };
                casterData.spell2.perClass[className] = {
                    max: computeSpellsPerDay(2, classData, classInfo.spellAbilityMod)
                };
                casterData.spell3.perClass[className] = {
                    max: computeSpellsPerDay(3, classData, classInfo.spellAbilityMod)
                };
                casterData.spell4.perClass[className] = {
                    max: computeSpellsPerDay(4, classData, classInfo.spellAbilityMod)
                };
                casterData.spell5.perClass[className] = {
                    max: computeSpellsPerDay(5, classData, classInfo.spellAbilityMod)
                };
                casterData.spell6.perClass[className] = {
                    max: computeSpellsPerDay(6, classData, classInfo.spellAbilityMod)
                };
            }
        }

        // Pre-calculate close, medium and long spell ranges for use in item prep.
        if (anyCasterClass) {
            const cl = data.details.cl.value;

            casterData.range = {
                close: 25 + 5 * Math.floor(cl / 2),
                medium: 100 + 10 * cl,
                long: 400 + 40 * cl
            };
        }

        data.spells = mergeObject(data.spells, casterData);

        return fact;
    });
}
