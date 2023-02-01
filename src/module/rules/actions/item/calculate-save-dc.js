import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";

export default function(engine) {
    engine.closures.add("calculateSaveDC", (fact, context) => {
        const item = fact.item;
        const itemData = item;
        const data = itemData.system;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;
        const classes = actor.items.filter(item => item.type === "class");

        if (data.actionType) {

            if (data.save && data.save.type) {
                const save = data.save || {};

                let dcFormula = save.dc?.toString();
                if (!dcFormula) {
                    const ownerKeyAbilityId = actorData?.attributes.keyability  || classes[0]?.system.kas;
                    const itemKeyAbilityId = data.ability;
                    const spellbookSpellAbility = actorData?.attributes.spellcasting;
                    const classSpellAbility = classes[0]?.system.spellAbility;

                    const abilityKey = itemKeyAbilityId || spellbookSpellAbility || classSpellAbility || ownerKeyAbilityId;
                    if (abilityKey) {
                        if (itemData.type === "spell") {
                            dcFormula = `10 + @item.level + @owner.abilities.${abilityKey}.mod`;

                            // Get owner spell save dc modifiers and append to roll
                            const allModifiers = actor?.getAllModifiers();
                            if (allModifiers) {
                                for (const modifier of allModifiers.filter(x => x.enabled && x.effectType === "spell-save-dc")) {
                                    dcFormula += ` + ${modifier.modifier}[${modifier.name}]`;
                                }
                            }
                        } else if (itemData.type === "feat") {
                            dcFormula = `10 + floor(@owner.details.level.value / 2) + @owner.abilities.${abilityKey}.mod`;
                        } else {
                            dcFormula = `10 + floor(@item.level / 2) + @owner.abilities.${abilityKey}.mod`;
                        }
                    } else if (actor.type === "npc" || actor.type === "npc2") {
                        if (itemData.type === "spell") {
                            dcFormula = `@owner.attributes.baseSpellDC.value + @item.level`;
                        } else {
                            dcFormula = `@owner.attributes.abilityDC.value`;
                        }
                    }
                }

                let computedSave = false;

                if (dcFormula) {
                    const rollContext = RollContext.createItemRollContext(item, actor, {itemData: data});

                    const rollResult = DiceSFRPG.resolveFormulaWithoutDice(dcFormula, rollContext, {logErrors: false});
                    if (!rollResult.hadError) {
                        item.labels.save = `DC ${rollResult.total || ""} ${CONFIG.SFRPG.saves[save.type]} ${CONFIG.SFRPG.saveDescriptors[save.descriptor]}`;
                        item.labels.saveFormula = dcFormula;
                        computedSave = true;
                    } else {
                        console.error(
                            `An error occurred parsing the %csave DC formula%c for %c'${item.name}'%c owned by %c'${actor?.name ?? "Unknown Actor"}'%c\n\nIs there a dice term in the formula?\nFormula: %c${dcFormula}`,
                            "font-weight: bold; color: blue;",
                            "",
                            "font-weight: bold; color: black;",
                            "",
                            "font-weight: bold; color: green;",
                            "",
                            "font-weight: bold; color: black;"
                        );
                    }
                }

                if (!computedSave) {
                    item.labels.save = 10;
                    item.labels.saveFormula = 10;
                }
            }
        }

        return fact;
    });
}
