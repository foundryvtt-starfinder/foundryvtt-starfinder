export default function (engine) {
    engine.closures.add("calculateShipSpeed", (fact, context) => {
        const data = fact.data;
        const thrusters = CONFIG.SFRPG.thrustersMap[data.details.systems.thrusters] || { speed: 8, mode: 0 };

        data.attributes.speed = thrusters.speed;

        return fact;
    });
}