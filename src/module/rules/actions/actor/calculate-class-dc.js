export default function(engine) {
    engine.closures.add("calculateClassDC", (fact) => {
        // Calculated later because we need ability modifiers, but classes have to be calculated as early as possible.
        const data = fact.data;
        const classes = fact.classes;

        for (const cls of classes) {
            // I'm using slightly PF2e terminology here, but this is the 10 + half-level + KAS DC most classes use
            const classData = cls.system;
            const className = classData.slug || cls.name.slugify({replacement: "_", strict: true});

            data.classes[className].classDC = 10 + Math.floor(classData.levels / 2) + data.abilities[classData.kas || "str"].mod || data.abilities.str.mod;
        }

        return fact;
    });
}
