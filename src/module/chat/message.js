import { ActorSFRPG } from "../actor/actor.js";

/** @extends {foundry.documents.ChatMessage} */
export class ChatMessageSFRPG extends foundry.documents.ChatMessage {
    constructor(data, options = {}) {
        super(data, options);

        /** @type {string} type of the chat message*/
        this.type = "base";
    }

    /** @override */
    static async create(data, options = {}) {
        return super.create(data, options);
    }

    /** @override */
    async renderHTML({ canDelete, canClose = false, ...rest } = {}) {
        console.log(this);
        const html = super.renderHTML({canDelete, canClose, ...rest});
        return html;
    }

    static addContextOptions(html, options) {
        const canApply = li => {
            const chatMessageId = li.dataset?.messageId;
            const chatMessage = game.messages.get(chatMessageId);
            const isRollWithDamage = chatMessage ? ["roll", "damage"].includes(chatMessage.flags.sfrpg?.rollType) : false;
            return canvas.tokens?.controlled?.length && li.querySelector(".dice-roll") && isRollWithDamage;
        };
        const noToken = li => !(canvas.tokens?.controlled?.length) && li.querySelector(".dice-roll");
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
    }

    /**
     * Add damage types for damage rolls to the chat card.
     *
     * @param {ChatMessageSFRPG} message       The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     */
    static addDamageTypes(message, html) {
        if (!message.isRoll || !message.isContentVisible) return;

        const roll = message.rolls[0];
        if (!(roll?.dice.length > 0)) return;
        for (const die of roll.dice) {
            if (die?.options?.isDamageRoll) {
                const types = die?.options?.damageTypes;
                const critical = die?.options?.criticalData;

                html.data("damageTypes", types);
                html.data("critical", critical);
            }
        }
    }

    static formatExplanation(explanationText) {
        let index = 0;
        let consumedText = "";
        let isReading = false;
        const sections = [];
        while (index < explanationText.length) {
            const token = explanationText[index++];
            if (token === "[") {
                sections.push({text: consumedText, replace: true});
                consumedText = "";
                isReading = true;
            } else if (token === "]" && isReading) {
                sections.push({text: consumedText, replace: false});
                consumedText = "";
                isReading = false;
            }
            consumedText += token;
        }
        if (consumedText) {
            sections.push({text: consumedText, replace: true});
        }

        let finalResult = "";
        for (const section of sections) {
            if (section.replace) {
                finalResult += section.text.replace(/\+/gi, "<br /> +").replace(/-/gi, "<br /> -");
            } else {
                finalResult += section.text;
            }
        }
        finalResult = (finalResult[0] === '-') ? finalResult : '+ ' + finalResult;
        return finalResult;
    }

    /**
     * Hightlight rolls that are considered critical successes or failures.
     *
     * @param {ChatMessageSFRPG} message       The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     */
    static highlightCriticalSuccessFailure(message, html) {
        if (!message.isRoll || !message.isContentVisible) return;

        const roll = message.rolls[0];
        if (!roll.dice.length) return;
        if (roll.isCritical) {
            html.find('.dice-total').addClass('success');
        }
        if (roll.isFumble) {
            html.find('.dice-total').addClass('failure');
        }
    }
}
