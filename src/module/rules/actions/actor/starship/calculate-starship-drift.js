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
            const driftEngineData = driftEngine.data.data;

            data.attributes.drift.value += driftEngineData.engineRating;
            data.attributes.drift.tooltip.push(`${driftEngine.name}: ${driftEngineData.engineRating}`);
        }

        return fact;
    });
}