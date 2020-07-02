/**
 * Helper class to handle the display of chatBox
 */
export class StarfinderCustomChatMessage {

    static getAmmoLeft(itemData){
        if(itemData.capacity.value > 0) {
            const finalAmmo = itemData.capacity.value - itemData.usage.value;
            return ((finalAmmo) >= 0) ? finalAmmo : 0;
        }
        return null;
    }

    static hasCapacity(itemData){
        return (itemData.capacity) ? true : false;
    }

    static createToken(actor){
        if(actor.token){
            return actor.token.scene.data._id + '.' +actor.token.data._id;
        }else if(canvas.tokens.controlled[0].id){
            return game.scenes.active._id + '.' + canvas.tokens.controlled[0].id;
        }else {
            return {}
        }
    }

    static rollToRender(roll, data, action){
        //Get the template
        const temmplateName = "systems/starfinder/templates/chat/chat-message-attack-roll.html";
        //get Actor
        const actor = (data.actor) ? data.actor : {};
        const item = (data.data.item) ? data.data.item : {};
        //Render the roll
        const customRoll = roll.render();
        customRoll.then((diceRoll) => {

            const targetTemplate = renderTemplate(temmplateName, {
                    hasAttack: (item.hasAttack) ? item.hasAttack : false,
                    hasDamage: (item.hasDamage) ? item.hasDamage : false,
                    isVersatile: (item.isVersatile) ? item.isVersatile : false,
                    hasSave: (item.hasSave) ? item.hasSave : false,
                    title: (data.title) ? data.title : 'Roll',
                    rawTitle: (data.speaker.alias),
                    item: (item) ? item : {},
                    ammoLeft: this.hasCapacity(item.data) ? this.getAmmoLeft(item.data) : null,
                    flavor: (data.flavor) ? data.flavor : '',
                    dataRoll: roll,
                    type: CHAT_MESSAGE_TYPES.ROLL,
                    config: CONFIG.STARFINDER,
                    tokenImg: actor.data.token.img,
                    actorId: actor._id,
                    tokenId: this.createToken(actor),
                });

                if(data.speaker.alias){
                    data.speaker.alias = (data.speaker.alias.length >= 13) ? data.speaker.alias.substr(0, 11) + '...' : data.speaker.alias
                }else{
                    data.speaker.alias = '';
                }

                targetTemplate.then((content) => {
                    ChatMessage.create({
                        //flavor: flavor,
                        speaker: data.speaker,
                        content:content + diceRoll, //push the diceRoll at the end of the template
                        rollMode: game.settings.get("core", "rollMode"),
                        rollModes: CONFIG.Dice.rollModes,
                        _roll: roll,
                    });
                });
        });
    }
}
