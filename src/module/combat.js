import { ActorSFRPG } from "./actor/actor.js";

export const addChatMessageContextOptions = function(html, options) {
    const canApply = li => canvas.tokens?.controlled?.length && li.find(".dice-roll").length;
    const noToken = li => !(canvas.tokens?.controlled?.length) && li.find(".dice-roll").length;
    options.push(
        {
            name: "SFRPG.ChatCard.ContextMenu.HalfDamage",
            icon: '<i class="fas fa-user-shield"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 0.5)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.ApplyDamage",
            icon: "<i class='fas fa-user-minus'></i>",
            condition: canApply,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 1)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.DamageAndAHalf",
            icon: '<i class="fas fa-user-injured"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 1.5)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.DoubleDamage",
            icon: '<i class="fas fa-user-times"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 2)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.ApplyHealing",
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canApply,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, -1)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.NoToken",
            icon: '<i class="fas fa-user-slash"></i>',
            condition: noToken,
            callback: null
        }
    );

    return options;
};
