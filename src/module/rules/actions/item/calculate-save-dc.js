import { DiceSFRPG, RollContext } from "../../../dice.js"

export default function (engine) {
    engine.closures.add("calculateSaveDC", (fact, context) => {
        const item = fact.item;
        const itemData = fact.itemData;
        const data = itemData.data;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;

        if (data.actionType) {

            if (data.save && data.save.type) {
                const save = data.save || {};

                let dcFormula = save.dc?.toString();
                if (!dcFormula) {
                    const ownerKeyAbilityId = actorData?.attributes.keyability;
                    const itemKeyAbilityId = data.ability;

                    const abilityKey = itemKeyAbilityId || ownerKeyAbilityId;
                    if (abilityKey) {
                        if (itemData.type === "spell") {
                            dcFormula = `10 + @item.level + @owner.abilities.${abilityKey}.mod`;
                        } else if (itemData.type === "feat") {
                            dcFormula = `10 + @owner.details.level.value + @owner.abilities.${abilityKey}.mod`;
                        } else {
                            dcFormula = `10 + floor(@item.level / 2) + @owner.abilities.${abilityKey}.mod`;
                        }
                    }
                }

                if (dcFormula) {
                    const rollContext = new RollContext();
                    rollContext.addContext("item", item, data);
                    rollContext.setMainContext("item");
                    if (actor && actor.data) {
                        rollContext.addContext("owner", actor);
                        rollContext.setMainContext("owner");
                    }
            
                    actor?.setupRollContexts(rollContext);
                
                    const rollPromise = DiceSFRPG.createRoll({
                        rollContext: rollContext,
                        rollFormula: dcFormula,
                        mainDie: 'd0',
                        dialogOptions: { skipUI: true }
                    });
            
                    rollPromise.then(rollResult => {
                        const returnValue = `DC ${rollResult.roll.total || ""} ${CONFIG.SFRPG.saves[save.type]} ${CONFIG.SFRPG.saveDescriptors[save.descriptor]}`;
                        item.labels.save = returnValue;
                    });
                } else {
                    item.labels.save = 10;
                }
            }
        }

        return fact;
    });
}
