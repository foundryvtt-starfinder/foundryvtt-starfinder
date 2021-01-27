export default function (engine) {
    engine.closures.add("calculateStarshipSensors", (fact, context) => {
        const data = fact.data;

        data.attributes.sensors = {
            mod: 0,
            tooltip: []
        };

        const sensors = fact.items.filter(x => x.type === "starshipSensor");
        for (const sensor of sensors) {
            data.attributes.sensors.mod += sensor.data.modifier;
            data.attributes.sensors.tooltip.push(`${sensor.name}: ${sensor.data.modifier.signedString()}`);
        }

        return fact;
    });
}