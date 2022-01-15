export default function (engine) {
    engine.closures.add("calculateNPC2ArmorClass", (fact, context) => {
        const data = fact.data;

        const eac = data.attributes.eac;
        const kac = data.attributes.kac;

        eac.value = eac.base;
        eac.tooltip = [];
        eac.tooltip.push(game.i18n.format("SFRPG.ACTooltipBase", { base: eac.base }));

        kac.value = kac.base;
        kac.tooltip = [];
        kac.tooltip.push(game.i18n.format("SFRPG.ACTooltipBase", { base: kac.base }));

        return fact;
    });
}