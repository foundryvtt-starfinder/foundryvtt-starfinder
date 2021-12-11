export default function (engine) {
    engine.closures.add("calculateNPC2Abilities", (fact, context) => {
        const data = fact.data;

        for (const [abl, ability] of Object.entries(data.abilities)) {
            ability.mod = ability.base;
            ability.value = Math.floor((ability.mod * 2) + 10);
            
            ability.tooltip = [];
            ability.tooltip.push(game.i18n.format("SFRPG.ACTooltipBase", { base: ability.base }));
        }

        return fact;
    });
}