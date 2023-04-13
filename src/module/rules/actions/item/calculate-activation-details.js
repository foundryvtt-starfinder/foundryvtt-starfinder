import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";

export default function(engine) {
    engine.closures.add("calculateActivationDetails", (fact, context) => {
        const item = fact.item;
        const itemData = item;
        const data = itemData.system;

        const actor = fact.owner.actor;
        if (!actor) return fact;
        const actorData = fact.owner.actorData;

        // Create a roll context for this item to be used in all calculations
        const rollContext = RollContext.createItemRollContext(item, actor);

        /**
         * Use the item's roll context and calculate a given formula with it.
         * @param {import("../../../rolls/rollcontext.js").FormulaKey | Number} formula
         * @returns {number} The calculated value
         */
        const calculateWithContext = (formula) => {
            const stringFormula = String(formula || 0);
            let total = DiceSFRPG.resolveFormulaWithoutDice(stringFormula, rollContext, {logErrors: false}).total;

            if (!total && total !== 0) {
                ui.notifications.error(`Error calculating activation property on actor ${actor.name} (${actor.id}), item ${item.name} (${item.id}).`);
                total = 0;
            }

            return total;
        };

        if (data?.activation?.type) {
            /**
             * Range
             */
            {
                const rangeType = data.range.units;

                if (["close", "medium", "long"].includes(rangeType)) {
                    let rangeValue = 0;
                    // Close/medium/long ranges for spells are calculated during actor prep
                    if (item.type === "spell") {
                        rangeValue = actorData.spells.range[rangeType];
                    // Since we have no way of telling which level a feature will scale off, c/m/l on features still require a formula
                    } else {
                        rangeValue = calculateWithContext(data.range.value);
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
                        rangeValue = calculateWithContext(data.range.value) || "";

                    data.range.total = rangeValue;
                    item.labels.range = [rangeValue?.toLocaleString(game.i18n.lang), CONFIG.SFRPG.distanceUnits[rangeType]].filterJoin(" ");
                }
            }

            /**
             * Limited uses
             */
            data.uses.total = calculateWithContext(data.uses.max);

            /**
             * Area
             * I don't think any areas actually scale by distance (normally by number of areas), but we'll do this for the sake of homebrew
             */
            if (data.area.units !== "text") data.area.total = calculateWithContext(data.area.value);

        }

        return fact;
    });
}
