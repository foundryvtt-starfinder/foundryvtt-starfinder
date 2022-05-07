export default function (engine) {
    engine.closures.add("calculateSpellsPerDay", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        data.spells.classes = [];
        const casterData = duplicate(data.spells);

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
        }

        for (const cls of classes) {
            const classData = cls.data.data;

            const className = cls.name.slugify({replacement: "_", strict: true});
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

        data.spells = mergeObject(data.spells, casterData);

        return fact;
    });
}