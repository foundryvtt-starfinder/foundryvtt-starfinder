/**
 * Helper class to handle the display of chatBox
 */
export default class SFRPGCustomChatMessage {

    static getAmmoLeft(itemData) {
        if (itemData.capacity.value > 0) {
            const finalAmmo = itemData.capacity.value - itemData.usage.value;
            return (finalAmmo >= 0) ? finalAmmo : 0;
        }

        return null;
    }

    static hasCapacity(itemData) {
        return itemData.capacity > 0 ? itemData.capacity : 0;
    }

    static createToken(actor) {
        if (actor.token) {
            return `${actor.token.scene.data._id}.${actor.token.data._id}`;
        } else if (canvas.tokens.controlled[0]?.id) {
            return `${game.scenes.active._id}.${canvas.tokens.controlled[0].id}`;
        } else {
            return {}
        }
    }

    /**
     * Render a custom damage roll.
     * 
     * @param {Roll} roll The roll data
     * @param {object} data The data for the roll
     */
    static async renderDamageRoll(roll, data) {

    }

    /**
     * Render a custom standard roll to chat.
     * 
     * @param {Roll} roll The roll data
     * @param {object} data The data for the roll
     * @param {string} action The action being taken
     */
    static async renderStandardRoll(roll, data, action) {
        //Get the template
        const temmplateName = "systems/sfrpg/templates/chat/chat-message-attack-roll.html";
        //get Actor
        const actor = data.actor ? data.actor : {};
        const item = data.data.item ? data.data.item : {};
        //Render the roll
        const customRoll = await roll.render();
        const rollMode = data.rollMode ? data.rollMode : game.settings.get('core', 'rollMode');

        if (data.speaker.alias) {
            data.speaker.alias = data.speaker.alias.length >= 13 ? data.speaker.alias.substr(0, 11) + '...' : data.speaker.alias
        } else {
            data.speaker.alias = '';
        }

        const content = await renderTemplate(temmplateName, {
            hasAttack: item.hasAttack ? item.hasAttack : false,
            hasDamage: item.hasDamage ? item.hasDamage : false,
            isVersatile: item.isVersatile ? item.isVersatile : false,
            hasSave: item.hasSave ? item.hasSave : false,
            title: data.title ? data.title : 'Roll',
            rawTitle: data.speaker.alias,
            item: item ? item : {},
            ammoLeft: item.hasCapacity ? this.getAmmoLeft(item.data) : null,
            flavor: data.flavor ? data.flavor : '',
            dataRoll: roll,
            type: CHAT_MESSAGE_TYPES.ROLL,
            config: CONFIG.STARFINDER,
            tokenImg: actor.data.token.img,
            actorId: actor._id,
            tokenId: this.createToken(actor),
        });
        
        ChatMessage.create({
            //flavor: flavor,
            speaker: data.speaker,
            content: content + customRoll, //push the diceRoll at the end of the template
            rollMode: rollMode,
            rollModes: CONFIG.Dice.rollModes,
            roll: roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
        });
    }
}
