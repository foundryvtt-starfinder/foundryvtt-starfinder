export default function(engine) {
    engine.closures.add("calculateStarshipShields", (fact, context) => {
        const data = fact.data;
        const shields = data.attributes.shields;

        shields.max = CONFIG.SFRPG.shieldsMap[data.details.systems.shields] || 0;
        shields.value = shields.forward.value + shields.aft.value + shields.starboard.value + shields.port.value;

        return fact;
    });
}