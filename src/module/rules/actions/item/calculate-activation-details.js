import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";

export default function(engine) {
    engine.closures.add("calculateActivationDetails", (fact, context) => {
        const item = fact.item;
        const itemData = item;
        const data = itemData.system;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;

        // Create a roll context for this item to be used in all calculations
        const rollContext = RollContext.createItemRollContext(item, actor);

        /**
         * Use the item's roll context and calculate a given formula with it.
         * @param {string} formula
         * @returns {number} The calculated value
         */
        const calculateWithContext = (formula) => {
            const total = DiceSFRPG.resolveFormulaWithoutDice(formula, rollContext, {logErrors: false}).total;

            return total;
        };

        if (data?.activation?.type) {
            /**
             * Range
             */
            const rangeType = data.range.units;

            if (["close", "medium", "long"].includes(rangeType)) {
                let rangeValue = 0;
                // Close/medium/long ranges for spells are calculated during actor prep
                if (item.type === "spell") {
                    rangeValue = actorData.spells.range[rangeType];
                // Since we have no way of telling which level a feature will scale off, c/m/l on features still require a formula
                } else {
                    rangeValue = calculateWithContext(String(data.range.value || 0));
                }

                data.range.total = rangeValue;
                item.labels.range = game.i18n.format("SFRPG.RangeCalculated", {
                    rangeType: CONFIG.SFRPG.distanceUnits[rangeType],
                    total: rangeValue.toLocaleString(game.i18n.lang)
                });

            // Other ranges allow for formulas
            } else {
                let rangeValue = "";
                // These ranges don't need a value, so keep it as a falsy value
                if (!(["none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(rangeType)))
                    rangeValue = calculateWithContext(String(data.range.value || 0)) || "";

                data.range.total = rangeValue;
                item.labels.range = [rangeValue?.toLocaleString(game.i18n.lang), CONFIG.SFRPG.distanceUnits[rangeType]].filterJoin(" ");
            }

            /**
             *
             */
        }

        return fact;
    });
}
