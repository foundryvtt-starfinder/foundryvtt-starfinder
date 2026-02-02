/** @extends {foundry.documents.ChatMessage} */
export class ChatMessageSFRPG extends foundry.documents.ChatMessage {
    constructor(data, options) {
        super(data, options);

        /** @type {string} type of the chat message*/
        this.type = "base";
    }
}
