export default function(engine) {
    engine.closures.add("calculateVehicleHangar", (fact, context) => {
        const data = fact.data;

        // Ensures that all vehicles have hangar bays
        data.hangarBay = foundry.utils.mergeObject(data.hangarBay ?? {}, {
            limit: 0,
            actorIds: []
        }, {overwrite: false});

        return fact;
    });
}
