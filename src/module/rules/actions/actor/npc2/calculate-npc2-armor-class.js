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

        const dexBonus = (data.abilities.dex.mod - data.abilities.dex.base);
        if (dexBonus) {
            eac.value += dexBonus;
            eac.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: dexBonus.signedString(), ability: "Dex"}));

            kac.value += dexBonus;
            kac.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: dexBonus.signedString(), ability: "Dex"}));
        }

        return fact;
    });
}