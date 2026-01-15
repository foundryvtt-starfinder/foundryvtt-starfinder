export default function(engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact) => {
        const data = fact.data;
        const classes = fact.classes;

        data.attributes.baseAttackBonus = {
            value: 0,
            rolledMods: [],
            tooltip: []
        };

        for (const cls of classes) {
            const classData = cls.system;

            let mod = 0;
            switch (classData.bab) {
                case "slow": mod += Math.floor(classData.levels * 0.5); break;
                case "moderate": mod += Math.floor(classData.levels * 0.75); break;
                case "full": mod += classData.levels; break;
            }

            data.attributes.baseAttackBonus.tooltip.push(game.i18n.format("SFRPG.BABTooltip", {
                class: cls.name,
                bonus: mod.signedString()
            }));

            data.attributes.baseAttackBonus.value += mod;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
