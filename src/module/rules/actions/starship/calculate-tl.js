export default function (engine) {
    engine.closures.add("calculateShipTargetLock", (fact, context) => {
        const data = fact.data;
        const tl = CONFIG.STARFINDER.armorDefenseMap[data.details.systems.defense] || 0;
        const sizeMod = CONFIG.STARFINDER.starshipSizeMod[data.details.size] || 0;
        const misc = data.attributes.tl.misc;

        data.attributes.tl.value = 10 + tl + misc + sizeMod;

        return fact;
    });
}