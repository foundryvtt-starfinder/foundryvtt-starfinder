export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;
        let bab = 0;

        data.attributes.babtooltip = [];

        for (const cls of classes) {
            let mod = 0;
            switch (cls.data.bab) {
                case "slow": mod += Math.floor(cls.data.levels * 0.5); break;
                case "moderate": mod += Math.floor(cls.data.levels * 0.75); break;
                case "full": mod += cls.data.levels; break;
            }

            data.attributes.babtooltip.push(game.i18n.format("SFRPG.BABTooltip", {
                class: cls.name,
                bonus: mod.signedString()
            }));

            bab += mod;
        }

        data.attributes.bab = bab;
        
        return fact;
    });
}