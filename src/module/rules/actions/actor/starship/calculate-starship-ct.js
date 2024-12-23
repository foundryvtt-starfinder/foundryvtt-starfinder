export default function(engine) {
    engine.closures.add("calculateStarshipCritThreshold", (fact, context) => {
        const data = fact.data;

        const sizeMultiplierMap = {
            "n/a": 0,
            "tiny": 1,
            "small": 2,
            "medium": 3,
            "large": 4,
            "huge": 5,
            "gargantuan": 6,
            "colossal": 7,
            "superColossal": 8
        };

        if (data.frame.name) {
            const baseCT = Math.max(Math.floor(data.attributes.hp.max * 0.2), 1);
            data.attributes.criticalThreshold = {
                value: baseCT,
                tooltip: [`${data.frame.name}: ${baseCT}`]
            };
        } else {
            data.attributes.criticalThreshold = {
                value: 0,
                tooltip: []
            };
        }

        const fortifiedHullItems = fact.items.filter(x => x.type === "starshipFortifiedHull");
        if (fortifiedHullItems && fortifiedHullItems.length > 0) {
            const fortifiedHull = fortifiedHullItems[0];
            const fortifiedHullData = fortifiedHull.system;

            const sizeMultiplier = sizeMultiplierMap[data.details.size] || 0;

            const ctBonus = fortifiedHullData.criticalThresholdBonus * sizeMultiplier;
            data.attributes.criticalThreshold.value += ctBonus;
            data.attributes.criticalThreshold.tooltip.push(`${fortifiedHull.name}: ${ctBonus}`);
        }

        return fact;
    });
}
