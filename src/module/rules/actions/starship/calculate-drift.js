export default function (engine) {
    engine.closures.add("calculateHyperspace", (fact, context) => {
        const data = fact.data;

        data.attributes.hyperspace = CONFIG.SFRPG.hyperspaceEngineMap[data.details.systems.hyperspaceEngine] || 0;

        return fact;
    });
}