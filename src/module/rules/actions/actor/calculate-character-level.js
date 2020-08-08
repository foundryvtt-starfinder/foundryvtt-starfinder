export default function (engine) {
    engine.closures.add("calculateCharacterLevel", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        let level = 0;

        for (const cls of classes) {
            level += cls.data.levels;
            data.details.level.tooltip.push(game.i18n.format("SFRPG.CharacterLevelsTooltip", {
                class: cls.name,
                levels: cls.data.levels
            }));
        }

        data.details.level.value = level;

        return fact;
    });
}