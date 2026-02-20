import { ActorSFRPG } from "../actor/actor.js";

/** @extends {foundry.documents.ChatMessage} */
export class ChatMessageSFRPG extends foundry.documents.ChatMessage {
    constructor(data, options = {}) {
        super(data, options);

        if (!this.type) this.type = "base";
    }

    /** @override */
    static async create(data, options = {}) {
        return super.create(data, options);
    }

    /** @override */
    async renderHTML({ canDelete, canClose = false, ...rest } = {}) {
        // Pre-HTML-rendering data prep
        const data = {
            isContentVisible: this.isContentVisible,
            labels: {},
            tags: {}
        };

        if (this.isContentVisible) {
            data.tags = this.system.prepareTags();
            if (this.system.rollCriteria.canEvaluate) {
                data.labels.resultText = this._generateResultText();
            }
        }

        // Generate the chat card html
        const html = await super.renderHTML({canDelete, canClose, ...data, ...rest});

        // Highlight critical successes and fumbles on the card
        if (this.isContentVisible) this.highlightCrits(html);

        return html;
    }

    /**
     * Hightlight rolls that are considered critical successes or failures.
     *
     * @param {JQuery}      html               The pending HTML as a jQuery object
     */
    highlightCrits(html) {
        if (!this.isRoll || !this.isContentVisible) return;

        for (const roll of this.rolls) {
            if (!roll.dice.length) continue;
            if (roll.isCritical) {
                html.querySelector('.dice-total').classList.add('critical-success');
                return;
            } else if (roll.isFumble) {
                html.querySelector('.dice-total').classList.add('fumble');
                return;
            }
        }
    }

    /**
     * Generates the success/failure message based on the roll value, type, and target stats
     */
    _generateResultText() {
        const roll = this.rolls[0];
        const rollCriteria = this.system.rollCriteria;
        const targetInfo = this.system.targetInfo[0];
        let prependedQuadrantInfo = "";
        if (targetInfo?.quadrant) {
            prependedQuadrantInfo = game.i18n.localize(CONFIG.SFRPG.starshipQuadrants[targetInfo.quadrant]);
        }

        const evalValue = roll.evalValue;
        const rollSuccess = roll.product;
        const rollType = rollCriteria.rollType;
        const difficulty = rollCriteria.difficulty;
        const rollIsAttack = ["attack", "gunnery"].includes(rollType);

        const criticalSuccessLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.CriticalHit") : game.i18n.format("SFRPG.Rolls.CriticalSuccess");
        const successLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.Hit") : game.i18n.format("SFRPG.Rolls.Success");
        const failureLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.Miss") : game.i18n.format("SFRPG.Rolls.Failure");
        const fumbleLocalized = game.i18n.format("SFRPG.Rolls.Fumble");

        if (rollCriteria?.actionTarget) {
            const actionTargetSource = rollCriteria.actionTargetSource[rollCriteria.actionTarget];
            if (rollSuccess !== null) {
                const actionTarget = `${prependedQuadrantInfo}${prependedQuadrantInfo ? " " : ""}${actionTargetSource}`;
                let actionResult = "";
                if (roll.isCritical) {
                    actionResult = `<span class="success">${criticalSuccessLocalized}</span>`;
                } else if (roll.isFumble) {
                    actionResult = `<span class="fail">${fumbleLocalized}</span>`;
                } else {
                    actionResult = `<span class="${rollSuccess ? "success" : "fail"}">${rollSuccess ? successLocalized : failureLocalized}</span>`;
                }
                return game.i18n.format("SFRPG.Items.Action.ActionTarget.TagFull", {actionTarget, targetValue: evalValue, actionResult});
            } else {
                const actionTarget = `${prependedQuadrantInfo}${prependedQuadrantInfo ? " " : ""}${actionTargetSource}`;
                return game.i18n.format("SFRPG.Items.Action.ActionTarget.Tag", {actionTarget});
            }
        } else if (difficulty) {
            const actionTarget = game.i18n.format("SFRPG.DC");
            let actionResult = "";
            if (roll.isCritical) {
                actionResult = `<span class="success">${criticalSuccessLocalized}</span>`;
            } else if (roll.isFumble) {
                actionResult = `<span class="fail">${fumbleLocalized}</span>`;
            } else {
                actionResult = `<span class="${rollSuccess ? "success" : "fail"}">${rollSuccess ? successLocalized : failureLocalized}</span>`;
            }
            return game.i18n.format("SFRPG.Items.Action.ActionTarget.TagFull", {actionTarget, targetValue: evalValue, actionResult});
        }
        else return "";
    }

    static addContextOptions(_, options) {
        const canApply = li => {
            const chatMessageId = li.dataset?.messageId;
            const chatMessage = game.messages.get(chatMessageId);
            let hasDamage = false;
            if (chatMessage) {
                hasDamage = ["roll", "damage"].includes(chatMessage.type);
            }
            return canvas.tokens?.controlled?.length && li.querySelector(".dice-roll") && hasDamage;
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

    /**
     * Format the roll explanation text string
     *
     * @param   {string} explanationText    An unformatted string breaking down the roll
     * @returns {String}                    A formatted html string with breaks inserted
     */
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
}
