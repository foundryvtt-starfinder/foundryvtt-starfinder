import { DiceSFRPG } from "../dice.js";
import { ItemSFRPG } from "../item/item.js";

/**
 * Helper class to handle the display of chatBox
 */
export default class SFRPGCustomChatMessage {

    static getToken(actor) {
        if (actor.token) {
            return `${actor.token.parent.id}.${actor.token.id}`;
        } else if (canvas.tokens?.controlled[0]?.id) {
            return `${game.scenes.active.id}.${canvas.tokens.controlled[0].id}`;
        } else {
            return "";
        }
    }

    /**
     * Render a custom standard roll to chat.
     *
     * @param {Roll}        roll             The roll data
     * @param {object}      data             The data for the roll
     * @param {RollContext} data.rollContent The context for the roll
     * @param {string}      [data.title]     The chat card title
     * @param {SpeakerData} [data.speaker]   The speaker for the ChatMesage
     * @param {string}      [data.rollMode]  The roll mode
     * @param {string}      [data.breakdown] An explanation for the roll and it's modifiers
     * @param {Tag[]}       [data.tags]      Any item metadata that will be output at the bottom of the chat card.
     */
    static renderStandardRoll(roll, data) {
        /** Get entities */
        const mainContext = data.rollContext.mainContext ? data.rollContext.allContexts[data.rollContext.mainContext] : null;

        let actor = data.rollContext.allContexts['actor'] ? data.rollContext.allContexts['actor'].entity : mainContext?.entity;
        if (!actor) {
            actor = data.rollContext.allContexts['ship'] ? data.rollContext.allContexts['ship'].entity : mainContext?.entity;
            if (!actor) {
                return false;
            }
        }

        let item = data.rollContext.allContexts['item'] ? data.rollContext.allContexts['item'].entity : mainContext?.entity;
        if (!item) {
            item = data.rollContext.allContexts['weapon'] ? data.rollContext.allContexts['weapon'].entity : mainContext?.entity;
            if (!item) {
                return false;
            }
        }

        const hasCapacity = item instanceof ItemSFRPG ? item.hasCapacity() : null;
        const currentCapacity = item instanceof ItemSFRPG ? item.getCurrentCapacity() : null;
        const options = {
            item: item,
            hasDamage: data.rollType !== "damage" && (item.hasDamage || false),
            hasSave: item.hasSave || false,
            hasSkill: this.hasSkill || false,
            hasCapacity: hasCapacity,
            ammoLeft: currentCapacity,
            title: data.title ? data.title : 'Roll',
            rawTitle: data.speaker.alias,
            dataRoll: roll,
            rollType: data.rollType,
            rollNotes: data.htmlData?.find(x => x.name === "rollNotes")?.value,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            config: CONFIG.SFRPG,
            tokenImg: actor.token?.img || actor.img,
            actorId: actor.id,
            tokenId: this.getToken(actor),
            breakdown: data.breakdown,
            tags: data.tags,
            damageTypeString: data.damageTypeString,
            specialMaterials: data.specialMaterials,
            rollOptions: data.rollOptions,
            rollDices: data.rollDices
        };

        const speaker = data.speaker;
        if (speaker) {
            let setImage = false;
            if (speaker.token) {
                const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
                if (token) {
                    options.tokenImg = token.img;
                    setImage = true;
                }
            }

            if (speaker.actor && !setImage) {
                const actor = Actors.instance.get(speaker.actor);
                if (actor) {
                    options.tokenImg = actor.img;
                }
            }
        }

        SFRPGCustomChatMessage._render(roll, data, options);

        return true;
    }

    static async _render(roll, data, options) {
        const templateName = "systems/sfrpg/templates/chat/chat-message-attack-roll.hbs";
        let rollContent = await roll.render({htmlData: data.htmlData, customTooltip: options.rollDices});

        // Insert the damage type string if possible.
        const damageTypeString = options?.damageTypeString;
        if (damageTypeString?.length > 0) {
            rollContent = DiceSFRPG.appendTextToRoll(rollContent, damageTypeString);
        }

        if (options.rollOptions?.actionTarget) {
            rollContent = DiceSFRPG.appendTextToRoll(rollContent, game.i18n.format("SFRPG.Items.Action.ActionTarget.ChatMessage", {actionTarget: options.rollOptions.actionTargetSource[options.rollOptions.actionTarget]}));
        }

        options = foundry.utils.mergeObject(options, { rollContent });
        const cardContent = await renderTemplate(templateName, options);
        const rollMode = data.rollMode ? data.rollMode : game.settings.get('core', 'rollMode');

        // let explainedRollContent = rollContent;
        // if (options.breakdown) {
        //     const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
        //     explainedRollContent = rollContent.substring(0, insertIndex) + options.explanation + rollContent.substring(insertIndex);
        // }

        const messageData = {
            flavor: data.title,
            speaker: data.speaker,
            content: cardContent, // + explainedRollContent + (options.additionalContent || ""),
            rollMode: rollMode,
            roll: roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: CONFIG.sounds.dice,
            rollType: data.rollType,
            flags: {}
        };

        if (damageTypeString?.length > 0) {
            messageData.flags.damage = {
                amount: roll.total,
                types: damageTypeString?.replace(' & ', ',')?.toLowerCase() ?? ""
            };
        }

        if (options?.specialMaterials) {
            messageData.flags.specialMaterials = options.specialMaterials;
        }

        if (options.rollOptions) {
            messageData.flags.rollOptions = options.rollOptions;
        }

        ChatMessage.create(messageData);
    }
}
