export default function (engine) {
    engine.closures.add("calculateStarshipDrift", (fact, context) => {
        const data = fact.data;

        data.attributes.drift = {
            value: 0,
            tooltip: []
        };

        const driftEngineItems = fact.items.filter(x => x.type === "starshipDriftEngine");
        if (driftEngineItems && driftEngineItems.length > 0) {
            const driftEngine = driftEngineItems[0];
            data.attributes.drift.value += driftEngine.data.engineRating;
            data.attributes.drift.tooltip.push(`${driftEngine.name}: ${driftEngine.data.engineRating}`);
        }

        return fact;
    });
}