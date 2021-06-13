export const ItemCapacityMixin = (superclass) => class extends superclass {
    /**
     * Checks if this item has capacity.
     */
    hasCapacity() {
        if (this.type === "starshipWeapon") {
            return (
                this.data.data.weaponType === "tracking"
                || this.data.data.special["mine"]
                || this.data.data.special["transposition"]
                || this.data.data.special["orbital"]
                || this.data.data.special["rail"]
                || this.data.data.special["forcefield"]
                || this.data.data.special["limited"]
            );
        }

        return (this.getMaxCapacity() > 0);
    }

    /**
     * Returns the current capacity of the item.
     */
    getCurrentCapacity() {
        const chargedItems = ["weapon"];
        if (chargedItems.includes(this.type)) {
            // TODO [AMMO]: Get embedded item, get from that instead.
        }

        const itemData = this.data.data;
        const currentCapacity = itemData.capacity.value;
        return currentCapacity;
    }

    /**
     * Consumes some amount of capacity.
     */
    consumeCapacity(consumedAmount) {
        const chargedItems = ["weapon"];
        if (chargedItems.includes(this.type)) {
            // TODO [AMMO]: Get embedded item, consume from that instead.
        }

        let currentCapacity = this.getCurrentCapacity();
        currentCapacity -= consumedAmount;
        if (currentCapacity < 0) {
            currentCapacity = 0;
        }

        return this.update({'data.capacity.value': currentCapacity});
    }

    /**
     * Returns the maximum capacity of the item.
     */
    getMaxCapacity() {
        const itemData = this.data.data;
        const maxCapacity = itemData.capacity.max;
        return maxCapacity;
    }

    reload() {
        const itemData = this.data.data;
        const currentCapacity = this.getCurrentCapacity();
        const maxCapacity = this.getMaxCapacity();

        if (currentCapacity >= maxCapacity && false) {
            // No need to reload if already at max capacity.
            return false;
        }

        let newCapacity = maxCapacity;
        /*if (this.type === "weapon") {
            if (itemData.ammunitionType === "charge") {
                // Find item matching ammunition type
                const matchingItems = this.actor.items
                    .filter(x => x.type === "ammunition" && x.data.data.type === itemData.ammunitionType && x.getCurrentCapacity() > currentCapacity && x.getMaxCapacity() <= maxCapacity)
                    .sort((firstEl, secondEl) => secondEl.getCurrentCapacity() - firstEl.getCurrentCapacity() );
                
                if (matchingItems.length > 0) {
                    const itemId = matchingItems[0]._id;
                    const itemQuantity = matchingItems[0].data.quantity;
                    const itemCapacity = matchingItems[0].getCurrentCapacity();

                    newCapacity = itemCapacity;

                    // Step 1: Destroy old item
                    if (itemQuantity > 1) {
                        this.actor.updateEmbeddedDocuments("Item", [{"id": itemId, "data.quantity": itemQuantity - 1}]);
                    } else {
                        this.actor.deleteEmbeddedDocuments("Item", [itemId]);
                    }

                    // Step 2: Create new battery w/ old charge
                }
            } else {
                
            }
        }*/

        // Render the chat card template
        const templateData = {
            actor: this.actor,
            item: this,
            tokenId: this.actor.token?.id,
            action: "SFRPG.ChatCard.ItemActivation.Reloads",
            cost: game.i18n.format("SFRPG.AbilityActivationTypesMove")
        };

        const template = `systems/sfrpg/templates/chat/item-action-card.html`;
        const renderPromise = renderTemplate(template, templateData);
        renderPromise.then((html) => {
            // Create the chat message
            const chatData = {
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: html
            };

            ChatMessage.create(chatData, { displaySheet: false });
        });
        
        return this.update({'data.capacity.value': newCapacity});
    }
}