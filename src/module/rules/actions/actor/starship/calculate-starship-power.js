export default function (engine) {
    engine.closures.add("calculateStarshipPower", (fact, context) => {
        const data = fact.data;

        data.attributes.power.max = 0;

        const powerCores = fact.items.filter(x => x.type === "starshipPowerCore");
        for (const powerCore of powerCores) {
            data.attributes.power.max += powerCore.data.pcu;
        }

        return fact;
    });
}