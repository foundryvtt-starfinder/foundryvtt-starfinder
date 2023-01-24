export default function(engine) {
    engine.closures.add("calculateVehicleControlSkill", (fact, context) => {
        const data = fact.data;

        // Ensures that all vehicles have hangar bays
        data.attributes = mergeObject(data.attributes ?? {}, {
            controlSkill: "pil"
        }, {overwrite: false});

        return fact;
    });
}
