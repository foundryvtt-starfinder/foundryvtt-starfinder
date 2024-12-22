export default function(engine) {
    engine.closures.add("calculateStarshipSensors", (fact, context) => {
        const data = fact.data;

        data.attributes.sensors = {
            mod: 0,
            tooltip: []
        };

        const sensors = fact.items.filter(x => x.type === "starshipSensor");
        for (const sensor of sensors) {
            const sensorData = sensor.system;

            if (sensorData.modifier) {
                data.attributes.sensors.mod += sensorData.modifier;
                data.attributes.sensors.tooltip.push(`${sensor.name}: ${sensorData.modifier.signedString()}`);
            }
        }

        return fact;
    });
}
