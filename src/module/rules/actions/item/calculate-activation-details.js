import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";

export default function(engine) {
    engine.closures.add("calculateActivationDetails", (fact, context) => {
        const item = fact.item;
        const itemData = item;
        const data = itemData.system;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;
        const C = CONFIG.SFRPG;

        // Create a roll context for this item to be used in all calculations
        const rollContext = RollContext.createItemRollContext(item, actor || null);

        /**
         * Use the item's roll context and calculate a given formula with it.
         * @param {import("../../../rolls/rollcontext.js").FormulaKey | Number} formula
         * @returns {number} The calculated value
         */
        const calculateWithContext = (formula) => {
            const stringFormula = String(formula || 0);
            let total = DiceSFRPG.resolveFormulaWithoutDice(stringFormula, rollContext, { logErrors: false }).total;

            if (!total && total !== 0) {
                ui.notifications.error(
                    `Error calculating activation property on actor ${actor.name} (${actor.id}), item ${item.name} (${item.id}).`
                );
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
                        rangeValue = actor ? actorData?.spells?.range[rangeType] : null;
                        // Since we have no way of telling which level a feature will scale off, c/m/l on features still require a formula
                    } else {
                        rangeValue = calculateWithContext(data.range.value);
                    }

                    data.range.total = rangeValue;
                    if (rangeValue) {
                        item.labels.range = game.i18n.format("SFRPG.RangeCalculated", {
                            rangeType: C.distanceUnits[rangeType],
                            total: rangeValue.toLocaleString(game.i18n.lang)
                        });
                    } else {
                        item.labels.range = game.i18n.format(`SFRPG.Range${rangeType.capitalize()}`);
                    }

                } else if (["none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(rangeType)) {
                    item.labels.range = C.distanceUnits[rangeType];
                // Other ranges allow for formulas
                } else {
                    const rangeValue = calculateWithContext(data.range.value) || "";
                    data.range.total = rangeValue;
                    item.labels.range = [
                        rangeValue?.toLocaleString(game.i18n.lang) || data.range.value,
                        C.distanceUnits[rangeType]
                    ].filterJoin(" ");
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
            {
                const area = data.area;
                if (area.value === 0) area.value = null;

                if (area.units !== "text") {
                    area.total = calculateWithContext(area.value);

                    item.labels.area = [
                        area.total || area.value,
                        C.distanceUnits[area.units] || null,
                        C.spellAreaShapes[area.shape],
                        C.spellAreaEffects[area.effect],
                        area.shapable ? "(S)" : ""
                    ].filterJoin(" ");
                } else {
                    item.labels.area = String(area.value || "")?.trim();
                }

            }

            /**
             * Duration
             */
            {
                const duration = data.duration;

                if (!(["instantaneous", "text"].includes(duration.units))) {
                    duration.total = calculateWithContext(duration.value);

                    item.labels.duration = [
                        duration.total || duration.value,
                        C.durationTypes[duration.units] || null,
                        data.dismissible ? "(D)" : ""
                    ].filterJoin(" ");
                } else {
                    const label = duration.units === "instantaneous" ? C.durationTypes[duration.units] : duration.value;
                    item.labels.duration = label || "";
                }

            }
        }

        return fact;
    });
}
