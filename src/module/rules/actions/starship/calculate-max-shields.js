export default function (engine) {
    engine.closures.add("calculateShipMaxShields", (fact, context) => {
        const data = fact.data;
        const shieldMax = Math.max(Math.floor(data.attributes.shields.max * 0.7), 1);

        data.attributes.shields.forward.max = shieldMax;
        data.attributes.shields.starboard.max = shieldMax;
        data.attributes.shields.aft.max = shieldMax;
        data.attributes.shields.port.max = shieldMax;

        return fact;
    });
}