export default function(engine) {
    engine.closures.add("calculateMechInitiative", (fact) => {
        const data = fact.data;
        const actor = fact.actor;

        if (!data.attributes.init) {
            data.attributes.init = {};
        }

        const init = data.attributes.init;
        init.tooltip = [];

        // Find the lowest initiative modifier among all operators
        const operators = actor.crew?.operator?.actors?.filter(a => a) || [];
        let operatorInit = null;

        for (const operator of operators) {
            const opInit = operator.system?.attributes?.init?.total ?? 0;
            if (operatorInit === null || opInit < operatorInit) {
                operatorInit = opInit;
            }
        }

        // Minimum of +0
        const baseInit = Math.max(operatorInit ?? 0, 0);

        // Tier bonus: +1 at tier 5 and every 5 tiers thereafter
        const tier = data.details?.tier ?? 0;
        const tierBonus = Math.floor(tier / 5);

        init.mod = baseInit;
        init.total = baseInit + tierBonus;

        if (operators.length > 0) {
            const lowestOperator = operators.reduce((lowest, op) => {
                const opInit = op.system?.attributes?.init?.total ?? 0;
                const lowInit = lowest.system?.attributes?.init?.total ?? 0;
                return opInit < lowInit ? op : lowest;
            });
            init.tooltip.push(game.i18n.format("SFRPG.MechSheet.Initiative.OperatorTooltip", {
                name: lowestOperator.name,
                mod: baseInit.signedString()
            }));
        } else {
            init.tooltip.push(game.i18n.localize("SFRPG.MechSheet.Initiative.NoOperatorTooltip"));
        }

        if (tierBonus > 0) {
            init.tooltip.push(game.i18n.format("SFRPG.MechSheet.Initiative.TierBonusTooltip", {
                mod: tierBonus.signedString(),
                tier: tier
            }));
        }

        init.rollTooltip = [...init.tooltip];

        return fact;
    });
}
