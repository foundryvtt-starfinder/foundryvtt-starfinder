export default function (engine) {
    engine.closures.add("calculateShipCritThreshold", (fact, context) => {
        const data = fact.data;

        data.attributes.ct.value = Math.max(Math.floor(data.attributes.hp.max * 0.2), 1);

        return fact;
    });
}