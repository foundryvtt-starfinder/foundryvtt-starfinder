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
            data.hasDeflectorShields = shieldItem.data.isDeflector;

            if (data.hasDeflectorShields) {
                data.quadrants.forward.shields.max = shieldItem.data.defenseValue;
                data.quadrants.port.shields.max = shieldItem.data.defenseValue;
                data.quadrants.starboard.shields.max = shieldItem.data.defenseValue;
                data.quadrants.aft.shields.max = shieldItem.data.defenseValue;
            } else {
                const evenDistributionValue = shieldItem.data.shieldPoints / 4;
                data.attributes.shields = {
                    value: data.quadrants.forward.shields.value + data.quadrants.port.shields.value + data.quadrants.starboard.shields.value + data.quadrants.aft.shields.value,
                    highest: Math.max(data.quadrants.forward.shields.value, data.quadrants.port.shields.value, data.quadrants.starboard.shields.value, data.quadrants.aft.shields.value),
                    limit: Math.floor(shieldItem.data.shieldPoints * 0.7),
                    max: shieldItem.data.shieldPoints,
                    evenDistribution: evenDistributionValue
                };
            }
        }

        return fact;
    });
}