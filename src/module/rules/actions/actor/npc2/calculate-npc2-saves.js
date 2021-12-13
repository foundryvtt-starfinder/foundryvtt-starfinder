export default function (engine) {
    engine.closures.add("calculateNPC2BaseSaves", (fact, context) => {
        const data = fact.data;

        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        const fortBonus = (data.abilities.con.mod - data.abilities.con.base);
        const reflexBonus = (data.abilities.dex.mod - data.abilities.dex.base);
        const willBonus = (data.abilities.wis.mod - data.abilities.wis.base);

        fort.bonus = fort.base;
        fort.tooltip = [];
        fort.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: fort.base.signedString()}));
        if (fortBonus) {
            fort.bonus += fortBonus;
            fort.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: fortBonus.signedString(), ability: "Con"}));
        }

        reflex.bonus = reflex.base;
        reflex.tooltip = [];
        reflex.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: reflex.base.signedString()}));
        if (reflexBonus) {
            reflex.bonus += reflexBonus;
            reflex.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: reflexBonus.signedString(), ability: "Dex"}));
        }

        will.bonus = will.base;
        will.tooltip = [];
        will.tooltip.push(game.i18n.format("SFRPG.SaveBaseModifier", {base: will.base.signedString()}));
        if (willBonus) {
            will.bonus += willBonus;
            will.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {mod: willBonus.signedString(), ability: "Wis"}));
        }

        return fact;
    });
}