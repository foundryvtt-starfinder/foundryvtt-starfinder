import { DiceSFRPG } from "../../../dice.js";
import RollContext from "../../../rolls/rollcontext.js";

export default function(engine) {
    engine.closures.add("calculateSkillDC", (fact, context) => {
        const item = fact.item;
        const itemData = item;
        const data = itemData.system;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;
        const classes = actor.items.filter(item => item.type === "class");

        if (data.actionType) {

            if (data.skillCheck && data.skillCheck.type) {
                const skillCheck = data.skillCheck || {};

                let dcFormula = skillCheck.dc?.toString();
                if (!dcFormula) {
                    const ownerKeyAbilityId = actorData?.attributes.keyability || classes[0]?.system.kas;
                    const itemKeyAbilityId = data.ability;

                    const abilityKey = itemKeyAbilityId || ownerKeyAbilityId;
                    if (abilityKey) {
                        dcFormula = `10 + floor(@owner.details.level.value * 1.5) + @owner.abilities.${abilityKey}.mod`;
                    } else if (actor.type === "npc" || actor.type === "npc2") {
                        dcFormula = `10 + floor(@owner.details.cr * 1.5) + @owner.abilities.${abilityKey}.mod`;
                    }
                }

                let computedSkill = false;

                if (dcFormula) {
                    const rollContext = RollContext.createItemRollContext(item, actor, {itemData: data});

                    const rollResult = DiceSFRPG.resolveFormulaWithoutDice(dcFormula, rollContext, {logErrors: false});
                    if (!rollResult.hadError) {
                        item.labels.skillCheck = `DC ${rollResult.total >= 0 ? rollResult.total : ""} ${CONFIG.SFRPG.skills[skillCheck.type]} ${game.i18n.localize("SFRPG.ChatCard.ItemAction.Check")}`;
                        item.labels.skillFormula = dcFormula;
                        computedSkill = true;
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

                if (!computedSkill) {
                    item.labels.skillCheck = 10;
                }
            }
        }

        return fact;
    });
}
