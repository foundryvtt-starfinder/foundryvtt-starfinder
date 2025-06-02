export default function(engine) {
    engine.closures.add("calculateNPC2Initiative", (fact, context) => {
        const data = fact.data;
        const init = data.attributes.init;

        init.total = 0;

        init.tooltip = [];
        init.tooltip.push(game.i18n.format("SFRPG.ACTooltipBase", { base: init.value }));

        const dexBonus = (data.abilities.dex.mod - data.abilities.dex.base);
        if (dexBonus) {
            init.total += dexBonus;
            init.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: dexBonus.signedString(), ability: "Dex"}));
        }

        return fact;
    });
}
