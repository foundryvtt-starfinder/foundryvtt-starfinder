import { ActorSFRPG } from "../actor/actor.js";

export const addChatMessageContextOptions = function(html, options) {
    const canApplyDamage = li => {
        const chatMessageId = li.dataset?.messageId;
        const chatMessage = game.messages.get(chatMessageId);
        const isRollWithDamage = chatMessage ? ["roll", "damage"].includes(chatMessage.flags.sfrpg?.rollType) : false;
        return canvas.tokens?.controlled?.length && li.querySelector(".dice-roll") && isRollWithDamage;
    };
    const canApplyHealing = li => {
        const chatMessageId = li.dataset?.messageId;
        const chatMessage = game.messages.get(chatMessageId);
        const isRollWithHealing = chatMessage ? ["roll", "healing"].includes(chatMessage.flags.sfrpg?.rollType) : false;
        return canvas.tokens?.controlled?.length && li.querySelector(".dice-roll") && isRollWithHealing;
    };
    const noToken = li => !(canvas.tokens?.controlled?.length) && li.querySelector(".dice-roll");
    options.push(
        {
            name: "SFRPG.ChatCard.ContextMenu.HalfDamage",
            icon: '<i class="fas fa-user-shield"></i>',
            condition: canApplyDamage,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 0.5)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.ApplyDamage",
            icon: "<i class='fas fa-user-minus'></i>",
            condition: canApplyDamage,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 1)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.DamageAndAHalf",
            icon: '<i class="fas fa-user-injured"></i>',
            condition: canApplyDamage,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 1.5)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.DoubleDamage",
            icon: '<i class="fas fa-user-times"></i>',
            condition: canApplyDamage,
            callback: li => ActorSFRPG.applyDamageFromContextMenu(li, 2)
        },
        {
            name: "SFRPG.ChatCard.ContextMenu.ApplyHealing",
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canApplyHealing,
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
