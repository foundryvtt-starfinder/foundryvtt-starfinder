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
     * @param {Roll}        roll                The roll data
     * @param {object}      data                The data for the roll
     * @param {RollContext} [data.rollContent]    The context for the roll
     * @param {string}      [data.title]        The chat card title
     * @param {SpeakerData} [data.speaker]      The speaker for the ChatMesage
     * @param {string}      [data.rollMode]     The roll mode
     * @param {string}      [data.breakdown]    An explanation for the roll and it's modifiers
     * @param {object}      [data.htmlData]     Base HTML data for the roll chat card
     * @param {string}      [data.rollType]     The type of roll
     * @param {RollOptions} [data.rollOptions]  Options for the roll
     * @param {Array}       [data.rollDices]    The dice used in the roll
     * @param {Boolean}     [data.rollSuccess]  Whether the roll, evaluated against the action target, was a success
     * @param {Tag[]}       [data.tags]         Any item metadata that will be output at the bottom of the chat card.
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
            hasSkill: item.hasSkill || false,
            hasArea: item.hasArea || false,
            hasCapacity: hasCapacity,
            ammoLeft: currentCapacity,
            title: data.title ? data.title : 'Roll',
            rawTitle: data.speaker.alias,
            dataRoll: roll,
            rollType: data.rollType,
            rollNotes: data.htmlData?.find(x => x.name === "rollNotes")?.value,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            tokenImg: actor.token?.img || actor.img,
            actorId: actor.id,
            tokenId: this.getToken(actor),
            breakdown: data.breakdown,
            tags: data.tags,
            damageTypeString: data.damageTypeString,
            specialMaterials: data.specialMaterials,
            descriptors: data.specialMaterials,
            hasMagicDamage: data.hasMagicDamage,
            rollOptions: data.rollOptions,
            rollDices: data.rollDices,
            rollSuccess: data.rollSuccess
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
        const cardContent = await foundry.applications.handlebars.renderTemplate(templateName, options);
        const rollMode = data.rollMode ?? game.settings.get('core', 'rollMode');

        const messageData = {
            flavor: data.title,
            speaker: data.speaker,
            content: cardContent,
            rolls: [roll],
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            sound: CONFIG.sounds.dice,
            rollType: data.rollType,
            flags: {sfrpg: {rollType: data.rollType}}
        };

        if (damageTypeString?.length > 0) {
            messageData.flags.sfrpg.damage = {
                amount: roll.total,
                types: damageTypeString?.replace(' & ', ',')?.toLowerCase() ?? ""
            };
        }

        // Roll success flag
        if (options?.rollSuccess === true || options?.rollSuccess === false) {
            messageData.flags.sfrpg.rollSuccess = options.rollSuccess;
        }

        // Options tags
        if (options?.specialMaterials) {
            messageData.flags.sfrpg.specialMaterials = options.specialMaterials;
        }

        if (options?.descriptors) {
            messageData.flags.sfrpg.descriptors = options.descriptors;
        }

        if (options?.hasMagicDamage) {
            messageData.flags.sfrpg.hasMagicDamage = options.hasMagicDamage;
        }

        if (options.rollOptions) {
            messageData.flags.sfrpg.rollOptions = options.rollOptions;
        }

        ChatMessage.create(messageData, { rollMode: rollMode });
    }
}
