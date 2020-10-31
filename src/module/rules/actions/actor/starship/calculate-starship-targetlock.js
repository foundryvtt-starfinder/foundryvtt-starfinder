export default function (engine) {
    engine.closures.add("calculateStarshipTargetLock", (fact, context) => {
        const data = fact.data;

        const pilotingBonus = data.crew.pilot.actors[0]?.data?.data?.skills?.pil?.ranks || 0;
        const defenses = CONFIG.SFRPG.armorDefenseMap[data.details.systems.defense] || 0;
        const sizeMod = CONFIG.SFRPG.starshipSizeMod[data.details.size] || 0;
        const misc = data.attributes.targetLock?.misc || 0;

        data.attributes.targetLock = {
            value: 10 + pilotingBonus + defenses + sizeMod + misc,
            misc: misc,
            tooltip: []
        };

        return fact;
    });
}