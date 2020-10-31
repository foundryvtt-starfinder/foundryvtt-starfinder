export default function (engine) {
    engine.closures.add("calculateStarshipCritThreshold", (fact, context) => {
        const data = fact.data;

        data.attributes.criticalThreshold = {
            value: Math.max(Math.floor(data.attributes.hp.max * 0.2), 1),
            tooltip: []
        };

        return fact;
    });
}