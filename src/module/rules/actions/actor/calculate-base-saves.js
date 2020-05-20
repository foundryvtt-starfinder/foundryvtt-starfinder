export default function (engine) {
    engine.closures.add("calculateBaseSaves", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        let fortSave = 0;
        let refSave = 0;
        let willSave = 0;

        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        for (const cls of classes) {
            let slowSave = Math.floor(cls.data.levels * (1/3));
            let fastSave = Math.floor(cls.data.levels * 0.5) + 2;

            fortSave += cls.data.fort === "slow" ? slowSave : fastSave;
            refSave += cls.data.ref === "slow" ? slowSave : fastSave;
            willSave += cls.data.will === "slow" ? slowSave : fastSave;
        }

        fort.bonus = fortSave + data.abilities.con.mod;
        reflex.bonus = refSave + data.abilities.dex.mod;
        will.bonus = willSave + data.abilities.wis.mod;

        return fact;
    });
}