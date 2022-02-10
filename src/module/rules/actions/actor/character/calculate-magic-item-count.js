export default function (engine) {
    engine.closures.add("calculateMagicalItemCount", (fact, context) => {
        const data = fact.data;

        data.magicalItems = {
            worn: 0,
            max: 2,
            tooltip: []
        };

        const magicalItemTypes = ["magic", "hybrid"];
        const equippedLimitedMagicalItems = fact.items.filter(x => magicalItemTypes.includes(x.data.type) && x.data.data.limitedWear && x.data.data.equipped);
        data.magicalItems.worn = equippedLimitedMagicalItems.length;

        for (const item of equippedLimitedMagicalItems) {
            data.magicalItems.tooltip.push(item.name);
        }

        if (data.magicalItems.worn > data.magicalItems.max) {
            data.magicalItems.tooltip.push("");
            data.magicalItems.tooltip.push(game.i18n.localize("SFRPG.Items.Magic.LimitedWearExceeded"));
        }

        return fact;
    });
}