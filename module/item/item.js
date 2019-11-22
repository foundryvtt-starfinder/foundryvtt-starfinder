class ItemStarfinder extends Item {

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * 
     * @return {Promise}
     */
    async roll() {
        const template = `public/systems/starfinder/templates/chat/${this.data.type}-card.html`;
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.scene._id}.${token.id}` : null,
            item: this.data,
            data: this.getChatData()
        };

        const chatData = {
            user: game.user._id,
            type: CHAT_MESSAGE_TYPES.OTHER,
            speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
            }
        };

        let rollMode = game.settings.get('core', 'rollMode');
        if (['gmroll', 'blindroll'].includes(rollMode)) chatData['whisper'] = ChatMessage.getWhisperIDs('GM');
        if (rollMode === 'blindroll') chatData['blind'] = true;

        chatData['content'] = await renderTemplate(template, templateData);

        return ChatMessage.create(chatData, { dispalySheet: false });
    }

    /**
     * Get the data object used by the chat dialog.
     * 
     * @param {Object} htmlOptions Optional html options
     * @returns {Object}
     */
    getChatData(htmlOptions) {
        console.log(this);
        const data = this[`_${this.data.type}ChatData`]();
        data.description.value = enrichHTML(data.description.value, htmlOptions);

        return data;
    }

    static chatListeners(html) {
        html.on('click', '.card-buttons button', ev => {
            ev.preventDefault();

            const button = $(ev.currentTarget),
                  messageId = button.parents('.message').data('messageId'),
                  senderId = game.messages.get(messageId).user._id,
                  card = button.parents('.chat-card');

            if (!game.user.isGM && game.user._id !== senderId) return;

            let actor;
            const tokenKey = card.data('tokenId');
            if (tokenKey) {
                const [sceneId, tokenId] = tokenKey.split('.');
                let token;
                if (sceneId === CanvasGradient.scene._id) token = canvas.tokens.get(tokenId);
                else {
                    const scene = game.scenes.get(sceneId);
                    if (!scene) return;
                    let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
                    if (tokenData) token = new Token(tokenData);
                }
                if (!token) return;
                actor = Actor.fromToken(token);
            } else actor = game.actors.get(card.data('actorId'));

            if (!actor) return;
            const itemId = Number(card.data('itemId'));
            const item = actor.getOwnedItem(itemId);

            //const action = button.data('action');
        })
    }

    _weaponChatData() {
        const data = duplicate(this.data.data);
        const properties = [
            data.range.value,
            CONFIG.weaponTypes[data.weaponType.value],
            data.proficient.value ? "" : "Not Proficient"
        ];
        data.properties = properties.filter(p => !!p);

        return data;
    }
}

CONFIG.Item.entityClass = ItemStarfinder;

// Hooks.on("getChatLogEntryContext", (html, options) => {
//     let canApply = li => canvas.tokens.controlledTokens.length && li.find('.dice-roll').length;
//     options.push(
//         {
//             name: "Apply Damage",
//             icon: '<i class="fas fa-user-minus"></i>',
//             condition: canApply,
//             callback: li => ActorStarfinder.apply()
//         }
//     );

//     return options;
// });
