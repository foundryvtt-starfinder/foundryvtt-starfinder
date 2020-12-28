export default function (engine) {
    engine.closures.add("calculateClasses", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        data.classes = {};
        data.cl = 0;

        for (const cls of classes) {
            const className = cls.name.slugify({replacement: "_", strict: true});
            const keyAbilityScore = cls.data.kas || "str";
            const classData = {
                keyAbilityMod: data.abilities[keyAbilityScore].mod,
                levels: cls.data.levels,
                keyAbilityScore: keyAbilityScore,
                skillRanksPerLevel: cls.data.skillRanks.value,
                isCaster: cls.data.isCaster
            };
            
            data.classes[className] = classData;

            if (cls.data.isCaster) {
                data.cl += cls.data.levels;
            }
        }

        return fact;
    });
}