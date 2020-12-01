export default function (engine) {
    engine.closures.add("calculateCharacterLevel", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        data.details.level.value = 0;

        /** Ensure CL exists. */
        if (!data.details.cl) {
            data.details.cl = {
                value: null,
                tooltip: []
            };
        } else {
            data.details.cl.value = null;
        }

        for (const cls of classes) {
            const classLevel = cls.data.levels;
            const tooltip = game.i18n.format("SFRPG.CharacterLevelsTooltip", {
                class: cls.name,
                levels: classLevel
            });

            data.details.level.value += classLevel;
            data.details.level.tooltip.push(tooltip);

            if (cls.data.isCaster) {
                if (data.details.cl.value === null) {
                    data.details.cl.value = 0;
                }
                data.details.cl.value += classLevel;
                data.details.cl.tooltip.push(tooltip);
            }
        }

        return fact;
    });
}