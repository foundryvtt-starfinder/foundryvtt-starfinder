import { ActorSFRPG } from "./actor/actor.js";

export const _getInitiativeFormula = function (combatant) {
    const actor = combatant.actor;
    if (!actor) return "1d20";
    const init = actor.data.data.attributes.init;
    const parts = ["1d20", init.total];
    if (CONFIG.Combat.initiative.tiebreaker) parts.push(actor.data.data.abilities.dex.value / 100);
    return parts.filter(p => p !== null).join(" + ");
};

export const addChatMessageContextOptions = function (html, options) {
    let canApply = li => canvas.tokens.controlled.length && li.find(".dice-roll").length;
    options.push(
        {
            name: "Apply Damage",
            icon: "<i class='fas fa-user-minus'></i>",
            condition: canApply,
            callback: li => ActorSFRPG.applyDamage(li, 1)
        },
        {
            name: "Apply Healing",
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamage(li, -1)
        },
        {
            name: "Double Damage",
            icon: '<i class="fas fa-user-injured"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamage(li, 2)
        },
        {
            name: "Half Damage",
            icon: '<i class="fas fa-user-shield"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamage(li, 0.5)
        }
    );

    return options;
}