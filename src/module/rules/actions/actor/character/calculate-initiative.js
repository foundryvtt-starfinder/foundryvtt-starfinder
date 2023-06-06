export default function(engine) {
    engine.closures.add("calculateInitiative", (fact, context) => {
        const data = fact.data;
        const init = data.attributes.init;

        init.mod = data.abilities.dex.mod;
        init.total = init.mod;

        init.tooltip.push(game.i18n.format("SFRPG.InitiativeDexModTooltip", { mod: data.abilities.dex.mod.signedString() }));
        // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
        init.rollTooltip = [ ...init.tooltip ];

        return fact;
    });
}
