export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;
        let bab = 0;

        for (const cls of classes) {
            switch (cls.data.bab) {
                case "slow": bab += Math.floor(cls.data.levels * 0.5); break;
                case "moderate": bab += Math.floor(cls.data.levels * 0.75); break;
                case "full": bab += cls.data.levels; break;
            }
        }

        data.attributes.bab = bab;

        return fact;
    });
}