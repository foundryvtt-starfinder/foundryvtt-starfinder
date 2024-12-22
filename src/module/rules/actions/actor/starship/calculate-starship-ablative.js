export default function(engine) {
    engine.closures.add("calculateStarshipAblative", (fact, context) => {
        const data = fact.data;

        const ablativeItems = fact.items.filter(x => x.type === "starshipAblativeArmor");
        data.hasAblativeArmor = ablativeItems && ablativeItems.length > 0;
        data.attributes.ablative = null;
        if (!data.hasAblativeArmor) {
            data.quadrants.forward.ablative = { value: 0, max: 0 };
            data.quadrants.port.ablative = { value: 0, max: 0 };
            data.quadrants.starboard.ablative = { value: 0, max: 0 };
            data.quadrants.aft.ablative = { value: 0, max: 0 };
        } else {
            const ablativeItem = ablativeItems[0];
            const ablativeData = ablativeItem.system;

            const evenDistributionValue = ablativeData.ablativeValue / 4;
            if (data.quadrants.forward.ablative.max != evenDistributionValue
                || data.quadrants.port.ablative.max != evenDistributionValue
                || data.quadrants.starboard.ablative.max != evenDistributionValue
                || data.quadrants.aft.ablative.max != evenDistributionValue) {
                data.attributes.pilotingBonus.value = Math.max(data.attributes.pilotingBonus.value - 1, -3);
                data.attributes.pilotingBonus.tooltip.push(game?.i18n ? game.i18n.format("SFRPG.StarshipSheet.Modifiers.UnevenAblative", {mod: -1}) : `Ablative armor unbalance: -1`);
            }

            data.attributes.ablative = {
                value: data.quadrants.forward.ablative.value + data.quadrants.port.ablative.value + data.quadrants.starboard.ablative.value + data.quadrants.aft.ablative.value,
                total: data.quadrants.forward.ablative.max + data.quadrants.port.ablative.max + data.quadrants.starboard.ablative.max + data.quadrants.aft.ablative.max,
                max: ablativeData.ablativeValue,
                evenDistribution: evenDistributionValue
            };

            if (ablativeData.ablativeValue > data.attributes.hp.max) {
                data.attributes.pilotingBonus.value -= 1;
                data.attributes.pilotingBonus.tooltip.push(game?.i18n ? game.i18n.format("SFRPG.StarshipSheet.Modifiers.AblativeOverload", {mod: -1}) : `Ablative overload: -1`);
            }
        }

        return fact;
    });
}
