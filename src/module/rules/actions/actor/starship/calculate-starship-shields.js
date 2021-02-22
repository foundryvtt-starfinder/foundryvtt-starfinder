export default function(engine) {
    engine.closures.add("calculateStarshipShields", (fact, context) => {
        const data = fact.data;

        const shieldItems = fact.items.filter(x => x.type === "starshipShield");
        data.hasShields = shieldItems && shieldItems.length > 0;
        data.hasDeflectorShields = false;
        data.attributes.shields = null;
        if (!data.hasShields) {
            data.quadrants.forward.shields = { value: 0 };
            data.quadrants.port.shields = { value: 0 };
            data.quadrants.starboard.shields = { value: 0 };
            data.quadrants.aft.shields = { value: 0 };
        } else {
            const shieldItem = shieldItems[0];
            const shieldData = shieldItem.data.data;

            data.hasDeflectorShields = shieldData.isDeflector;

            if (data.hasDeflectorShields) {
                data.quadrants.forward.shields.max = shieldData.defenseValue;
                data.quadrants.port.shields.max = shieldData.defenseValue;
                data.quadrants.starboard.shields.max = shieldData.defenseValue;
                data.quadrants.aft.shields.max = shieldData.defenseValue;
            } else {
                const evenDistributionValue = shieldData.shieldPoints / 4;
                data.attributes.shields = {
                    value: data.quadrants.forward.shields.value + data.quadrants.port.shields.value + data.quadrants.starboard.shields.value + data.quadrants.aft.shields.value,
                    highest: Math.max(data.quadrants.forward.shields.value, data.quadrants.port.shields.value, data.quadrants.starboard.shields.value, data.quadrants.aft.shields.value),
                    limit: Math.floor(shieldData.shieldPoints * 0.7),
                    max: shieldData.shieldPoints,
                    evenDistribution: evenDistributionValue
                };
            }
        }

        return fact;
    });
}