export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;
        
        data.attributes.baseAttackBonus = mergeObject(data.attributes.baseAttackBonus, {
            value: 0,
            rolledMods: [],
            tooltip: []
        }, {overwrite: false});

        /** Clear out default values. */
        data.attributes.baseAttackBonus.value = 0;
        data.attributes.baseAttackBonus.rolledMods = [];

        for (const cls of classes) {
            const classData = cls.data.data;

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

        data.attributes.bab = data.attributes.baseAttackBonus.value;
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}