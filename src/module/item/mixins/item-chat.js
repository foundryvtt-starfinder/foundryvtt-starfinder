import AbilityTemplate from "../../canvas/ability-template.js";
import {ItemSFRPG} from "../item.js";

/**
 * @import { ActorSFRPG } from "../../actor/actor.js"
 */

export const ItemChatMixin = (superclass) => class extends superclass {

    static chatListeners(html) {
        html.on('click', '.chat-card .card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.chat-card .item-name', this._onChatCardToggleContent.bind(this));
    }

    static async _onChatCardAction(event) {
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;
        const dc = button.dataset.dc ? Number(button.dataset.dc) : undefined;

        // Validate permission to proceed with the roll
        const isTargetted = ["save", "skill"].includes(action);
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const chatCardActor = this._getChatCardActor(card);
        if (!chatCardActor) {
            ui.notifications.error("SFRPG.ChatCard.ItemAction.NoActor");
            return;
        }

        // Get the Item
        let item = chatCardActor.items.get(card.dataset.itemId);

        // Adjust item to level, if required
        if (Object.keys(message.flags?.sfrpg ?? {}).length !== 0 && message.flags?.sfrpg?.level !== item.system.level) {
            const newItemData = item.toObject();
            newItemData.system.level = message.flags.sfrpg.level;

            item = new ItemSFRPG(newItemData, {parent: item.parent});

            // Run automation to ensure save DCs are correct.
            item.prepareData();
            const processContext = await item.processData();
            if (processContext.fact.promises) {
                await Promise.all(processContext.fact.promises);
            }
        }

        // Get the target
        const targetActor = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });
        else if (action === "template") await item.placeAbilityTemplate({ event });

        // Skill Check
        else if (action === "skill" && targetActor) await targetActor.rollSkill(button.dataset.type, { event, dc });

        // Saving Throw
        else if (action === "save" && targetActor) await targetActor.rollSave(button.dataset.type, { event, dc });

        // Item capacity and consumable usage
        else if (action === "use") await item.useItem({ event });
    }

    /**
     * Handle toggling the visibility of chat card content when the name is clicked.
     * @param {Event} event The originating click event
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest('.chat-card');
        const content = card.querySelector('.card-content');
        // content.style.display = content.style.display === 'none' ? 'block' : 'none';
        $(content).slideToggle();
    }

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {?ActorSFRPG}         The Actor entity or null
     * @private
     */
    static _getChatCardActor(card) {

        const actorId = card.dataset.actorId;

        // Case 1 - a synthetic actor from a Token, legacy reasons the token Id can be a compound key of sceneId and tokenId
        let tokenId = card.dataset.tokenId;
        let sceneId = card.dataset.sceneId;
        if (!sceneId && tokenId?.includes('.')) {
            [sceneId, tokenId] = tokenId.split(".");
        }

        let chatCardActor = null;
        if (tokenId && sceneId) {
            const scene = game.scenes.get(sceneId);
            if (scene) {
                const tokenData = scene.getEmbeddedDocument("Token", tokenId);
                if (tokenData) {
                    const token = new foundry.canvas.placeables.Token(tokenData);
                    chatCardActor = token.actor;
                }
            }
        }

        // Case 2 - use Actor ID directory
        if (!chatCardActor) {
            chatCardActor = game.actors.get(actorId);
        }

        return chatCardActor;
    }

    /**
     * Get the Actor which is the author of a chat card
     * @return {?ActorSFRPG}         The Actor entity or null
     * @private
     */
    static _getChatCardTarget() {
        const character = game.user.character;
        const controlled = canvas.tokens?.controlled;
        if (controlled.length === 0) return character || null;
        if (controlled.length === 1) return controlled[0].actor;
        else throw new Error(`You must designate a specific Token as the roll target`);
    }

    async placeAbilityTemplate() {
        const itemData = this.system;

        const type = {
            "sphere": "circle",
            "cone": "cone",
            "cube": "rect",
            "cylinder": "circle",
            "line": "ray"
        }[itemData?.area?.shape] || null;

        if (!type) return;

        const template = AbilityTemplate.fromData({
            type: type || "circle",
            distance: this.system?.area?.total || this.system?.area?.value || 0
        });

        if (!template) return;

        const placed = await template.drawPreview();
        if (placed) template.place(); // If placement is confirmed
        return placed;

    }
};
