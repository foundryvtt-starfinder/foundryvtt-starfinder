export default function(engine) {
    engine.closures.add("calculateNPC2BaseSaves", (fact, context) => {
        const data = fact.data;

        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        fort.bonus = fort.base;
        fort.tooltip = [];
        fort.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: fort.base.signedString()}));

        reflex.bonus = reflex.base;
        reflex.tooltip = [];
        reflex.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: reflex.base.signedString()}));

        will.bonus = will.base;
        will.tooltip = [];
        will.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: will.base.signedString()}));

        return fact;
    });
}
