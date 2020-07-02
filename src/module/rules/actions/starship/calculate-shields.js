export default function(engine) {
    engine.closures.add("calculateShields", (fact, context) => {
        const data = fact.data;

        data.attributes.shields.max = CONFIG.SFRPG.shieldsMap[data.details.systems.shields] || 0;

        return fact;
    });
}