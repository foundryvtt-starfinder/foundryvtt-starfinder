export default function(engine) {
    engine.closures.add("calculateShipArmorClass", (fact, context) => {
        const data = fact.data;
        const ac = CONFIG.STARFINDER.armorDefenseMap[data.details.systems.armor] || 0;
        const sizeMod = CONFIG.STARFINDER.starshipSizeMod[data.details.size] || 0;
        const misc = data.attributes.ac.misc;

        data.attributes.ac.value = 10 + ac + misc + sizeMod;
        
        return fact;
    });
}