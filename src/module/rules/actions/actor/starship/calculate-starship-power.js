export default function (engine) {
    engine.closures.add("calculateShipPower", (fact, context) => {
        const data = fact.data;
        const powercore = CONFIG.SFRPG.powercoreMap[data.details.systems.powercore] || { size: ["tiny"], pcu: 0 };

        data.attributes.pwr.pcu = powercore.pcu;

        return fact;
    });
}