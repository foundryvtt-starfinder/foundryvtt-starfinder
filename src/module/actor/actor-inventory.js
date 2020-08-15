import { SFRPG } from "../config.js";
import { RPC } from "../rpc.js";

/**
 * Adds the specified quantity of a given item to an actor. Returns the (possibly newly created) item on the target actor.
 * Will not add child items, those will have to be added manually at a later iteration.
 * 
 * @param {Actor} targetActor Actor to add the item to.
 * @param {Item} item Item to add.
 * @param {Number} quantity Quantity of the item to add.
 * @param {Item} targetItem (Optional) Item to either merge with, or add as a child to, or find its parent and set as a sibling.
 * @returns {Item} Returns the (possibly newly created) item on the target actor.
 */
export async function addItemToActorAsync(targetActor, itemToAdd, quantity, targetItem = null) {
    if (!targetActor) return null;

    if (targetItem && targetItem === itemToAdd) {
        return itemToAdd;
    }

    let newItemData = duplicate(itemToAdd);
    newItemData.data.quantity = quantity;
    newItemData.data.contents = itemToAdd.data.contents ? [] : null;

    let desiredParent = null;
    if (targetItem) {
        if (acceptsItem(targetItem, itemToAdd, targetActor)) {
            desiredParent = targetItem;
        } else if (targetItem.name === itemToAdd.name && !containsItems(targetItem) && !containsItems(itemToAdd)) {
            const targetItemNewQuantity = Number(targetItem.data.data.quantity) + quantity;
            await targetActor.updateOwnedItem({ _id: targetItem._id, 'data.quantity': targetItemNewQuantity});
            return targetItem;
        } else {
            desiredParent = targetActor.items.find(x => x.data.contents && x.data.contents.includes(targetItem._id));
        }
    }
    
    let addedItem = null;
    if (targetActor.isToken) {
        const  created = await Entity.prototype.createEmbeddedEntity.call(targetActor, "OwnedItem", newItemData, {temporary: true});
        const items = duplicate(targetActor.data.items).concat(created instanceof Array ? created : [created]);
        await targetActor.token.update({"actorData.items": items}, {});
        addedItem = targetActor.getOwnedItem(created._id);
    } else {
        const result = await targetActor.createOwnedItem(newItemData);
        addedItem = targetActor.getOwnedItem(result._id);
    }

    if (desiredParent) {
        let newContents = duplicate(desiredParent.data.data.contents || []);
        newContents.push(addedItem._id);
        await targetActor.updateOwnedItem({"_id": desiredParent._id, "data.contents": newContents});
    }

    return addedItem;
}

/**
 * Removes the specified quantity of a given item from an actor.
 * 
 * @param {Actor} sourceActor Actor that owns the item.
 * @param {Item} item Item to remove.
 * @param {Number} quantity Number of items to remove, if quantity is greater than or equal to the item quantity, the item will be removed from the actor.
 * @param {Boolean} recursive (Optional) Recursively remove child items too? Setting this to false puts all items into the deleted item's root. Defaults to false.
 * @returns {Boolean} Returns whether or not an update or removal took place.
 */
export async function removeItemFromActorAsync(sourceActor, itemToRemove, quantity, recursive = false) {
    if (!sourceActor || !itemToRemove) return false;

    const sourceItemQuantity = Math.min(itemToRemove.data.data.quantity, quantity);
    const newItemQuantity = sourceItemQuantity - quantity;

    if (newItemQuantity < 1) {
        await sourceActor.deleteEmbeddedEntity('OwnedItem', itemToRemove._id);
        if (recursive && containsItems(itemToRemove)) {
            for (let childId of itemToRemove.data.data.contents) {
                let child = sourceActor.getOwnedItem(childId);
                if (child) {
                    await removeItemFromActorAsync(sourceActor, child, child.data.data.quantity, recursive);
                }
            }
        }
    } else {
        const update = { '_id': itemToRemove._id, 'data.quantity': newItemQuantity };
        await sourceActor.updateEmbeddedEntity('OwnedItem', update);
    }
    return true;
}

/**
 * Moves an item from one actor to another, adjusting its container settings appropriately.
 * 
 * @param {Actor} sourceActor The source actor.
 * @param {Item} itemToMove Item to be moved.
 * @param {Actor} targetActor The target actor.
 * @param {Item} targetItem (Optional) Item to add the item to, merge with, or make sibling for.
 * @returns {Item} Returns the item on the targetActor.
 */
export async function moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetItem = null) {
    if (!targetActor || !itemToMove) {
        console.log("Invenory::moveItemBetweenActorsAsync: No targetActor or itemToMove.")
        return null;
    }

    if (!sourceActor) {
        console.log("Invenory::moveItemBetweenActorsAsync: No source actor specified, switching to addItemToActorAsync.")
        return await addItemToActorAsync(targetActor, itemToMove, itemToMove.data.data.quantity, targetItem);
    }

    if (sourceActor === targetActor) {
        let desiredParent = null;
        if (targetItem) {
            if (acceptsItem(targetItem, itemToMove, targetActor)) {
                desiredParent = targetItem;
            } else if (targetItem.name === itemToMove.name && !containsItems(targetItem) && !containsItems(itemToMove)) {
                // Merging will destroy the old item, so we return the targetItem here.
                const targetItemNewQuantity = Number(targetItem.data.data.quantity) + itemToMove.data.data.quantity;
                const update = { '_id': targetItem._id, 'data.quantity': targetItemNewQuantity};
                await targetActor.updateEmbeddedEntity('OwnedItem', update);

                await sourceActor.deleteEmbeddedEntity('OwnedItem', itemToMove._id);

                return targetItem;
            } else {
                let targetsParent = targetActor.items.find(x => x.data.data.contents && x.data.data.contents.includes(targetItem._id));
                if (targetsParent) {
                    if (!wouldCreateParentCycle(itemToMove, targetsParent, targetActor)) {
                        desiredParent = targetsParent;
                    } else {
                        return itemToMove;
                    }
                }
            }
        }

        let currentParent = targetActor.items.find(x => x.data.data.contents && x.data.data.contents.includes(itemToMove._id));

        if (desiredParent !== currentParent) {
            let bulkUpdates = [];
            if (currentParent) {
                let newContents = currentParent.data.data.contents.filter(x => x !== itemToMove._id);
                bulkUpdates.push({_id: currentParent._id, "data.contents": newContents});
            }

            if (desiredParent) {
                let newContents = duplicate(desiredParent.data.data.contents || []);
                newContents.push(itemToMove._id);
                bulkUpdates.push({_id: desiredParent._id, "data.contents": newContents});
            }

            if (itemToMove.data.data.equipped) {
                bulkUpdates.push({_id: itemToMove._id, "data.equipped": false});
            }

            await targetActor.updateOwnedItem(bulkUpdates);
        }

        return itemToMove;
    } else {
        let movedItem = await addItemToActorAsync(targetActor, itemToMove, itemToMove.data.data.quantity, targetItem);

        if (containsItems(itemToMove)) {
            for (let childId of itemToMove.data.data.contents) {
                let child = sourceActor.getOwnedItem(childId);
                await moveItemBetweenActorsAsync(sourceActor, child, targetActor, movedItem);
            }
        }

        await removeItemFromActorAsync(sourceActor, itemToMove, itemToMove.data.data.quantity, true);

        return movedItem;
    }
}

/**
 * Changes the item's container on an actor.
 * 
 * @param {Actor} actor 
 * @param {Item} item 
 * @param {Item} container 
 */
export async function setItemContainer(actor, item, container) {
    return await moveItemBetweenActorsAsync(actor, item, actor, container);
}

/**
 * Returns the bulk of the item, along with its contents.
 * To prevent rounding errors, all calculations are done in integer space by multiplying bulk by 10.
 * A bulk of L is considered as 1, while a bulk of 1 would be 10. Any other non-number bulk is considered 0 bulk.
 * 
 * Item container properties such as equipped bulk and content bulk multipliers are taken into account here.
 * 
 * @param {Object} item The item whose bulk is to be calculated.
 * @param {Array} contents An array of items who are considered children of the item.
 * @returns {Number} A multiplied-by-10 value of the total bulk.
 */
export function computeCompoundBulkForItem(item, contents) {
    let contentBulk = 0;
    if (contents && contents.length > 0) {
        for (let child of contents) {
            let childBulk = computeCompoundBulkForItem(child.item, child.contents);
            contentBulk += childBulk;
        }

        if (item && item.data.contentBulkMultiplier !== undefined && !Number.isNaN(Number.parseInt(item.data.contentBulkMultiplier))) {
            contentBulk *= item.data.contentBulkMultiplier;
        }
    }

    let personalBulk = 0;
    if (item) {
        if (item.data.bulk.toUpperCase() === "L") {
            personalBulk = 1;
        } else if (!Number.isNaN(Number.parseInt(item.data.bulk))) {
            personalBulk = item.data.bulk * 10;
        }

        if (item.data.quantity && !Number.isNaN(Number.parseInt(item.data.quantity))) {
            personalBulk *= item.data.quantity;
        }

        if (item.data.equipped) {
            if (item.data.equippedBulkMultiplier !== undefined && !Number.isNaN(Number.parseInt(item.data.equippedBulkMultiplier))) {
                personalBulk *= item.data.equippedBulkMultiplier;
            }
        }
    }

    //console.log(`${item?.name || "null"} has a content bulk of ${contentBulk}, and personal bulk of ${personalBulk}`);
    return personalBulk + contentBulk;
}

/**
 * Returns an array of child items for a given item on an actor.
 * 
 * @param {Actor} actor Actor for whom's items to test.
 * @param {Item} item Item to get the children of.
 * @returns {Array} An array of child items.
 */
export function getChildItems(actor, item) {
    if (!actor) return [];
    if (!containsItems(item)) return [];
    return actor.items.filter(x => item.data.data.contents.includes(x._id));
}

function acceptsItem(containerItem, itemToAdd, actor) {
    if (!containerItem || !itemToAdd) {
        //console.log("Rejected because container or item is null");
        return false;
    }

    if (!(itemToAdd.type in SFRPG.itemTypes)) {
        //console.log("Rejected because item is not an item: " + itemToAdd.type);
        return false;
    }

    const storageCapacity = containerItem.data.data.storageCapacity;
    if (!storageCapacity || storageCapacity === 0) {
        //console.log("Rejected because target storageCapacity is 0");
        return false;
    }

    const acceptedItemTypes = containerItem.data.data.acceptedItemTypes;
    if (acceptedItemTypes && (!(itemToAdd.type in acceptedItemTypes) || !acceptedItemTypes[itemToAdd.type])) {
        //console.log("Rejected because item is not accepted by container mask");
        return false;
    }

    if (wouldCreateParentCycle(itemToAdd, containerItem, actor)) {
        //console.log("Rejected because adding this item would create a cycle");
        return false;
    }

    return true;
}

/**
 * Checks if assigning the itemId as a child to the container would create a cycle.
 * This can happen if the container is contained within item.
 */
function wouldCreateParentCycle(item, container, actor) {
    if (!item) throw "Inventory::wouldCreateParentCycle: No item specified.";
    if (!container) throw "Inventory::wouldCreateParentCycle: No container specified.";
    if (!actor) throw "Inventory::wouldCreateParentCycle: No actor specified.";
    if (item === container) return true;

    // If the item has no children it cannot create cycles.
    if (!containsItems(item)) return false;

    if (item.data.data.contents.includes(container._id)) return true;

    let itemsToTest = duplicate(item.data.data.contents || []);
    while (itemsToTest.length > 0) {
        let childId = itemsToTest.shift();
        let child = actor.getOwnedItem(childId);
        if (!child) continue;

        if (!containsItems(child)) continue;
        if (child.data.data.contents.includes(container._id)) return true;
        itemsToTest = itemsToTest.concat(child.data.data.contents);
    }
    return false;
}

/**
 * Tests if a given item contains any items.
 * 
 * @param {Item} item Item to test.
 * @returns {Boolean} Boolean whether or not this item contains anything.
 */
export function containsItems(item) {
    return item && item.data.data.contents && item.data.data.contents.length > 0;
}

export function initializeRemoteInventory() {
    RPC.registerCallback("dragItemFromCollectionToPlayer", "gm", onItemCollectionItemDraggedToPlayer);
    RPC.registerCallback("raiseInventoryWarning", "local", onInventoryWarningReceived);
}

export async function onItemCollectionItemDraggedToPlayer(message) {
    const data = message.payload;

    // Unpack data
    const source = ActorHelper.FromObject(data.source);
    const target = ActorHelper.FromObject(data.target);

    if (!source.token) {
        RPC.sendMessageTo(message.sender, "raiseInventoryWarning", "SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError");
        return;
    }

    if (!target.actor) {
        RPC.sendMessageTo(message.sender, "raiseInventoryWarning", "SFRPG.ActorSheet.Inventory.Interface.NoTarget");
        return;
    }

    let targetContainer = null;
    if (data.containerId) {
        targetContainer = target.getOwnedItem(data.containerId);
    }

    // Add items to target
    let uncontainedItemIds = [];
    let copiedItemIds = [];
    let itemToItemMapping = {};
    for (let originalItem of data.draggedItems) {
        const itemData = duplicate(originalItem);
        delete itemData._id;

        let newItem = await target.createOwnedItem(itemData);
        if (newItem) {
            itemToItemMapping[originalItem._id] = newItem;
            copiedItemIds.push(originalItem._id);
            uncontainedItemIds.push(newItem._id);
        }
    }

    for (let originalItem of data.draggedItems) {
        let newItem = itemToItemMapping[originalItem._id];
        if (originalItem.data.contents) {
            let newContents = [];
            for (let originalContentId of originalItem.data.contents) {
                let originalContentItem = data.draggedItems.find(x => x._id === originalContentId);
                let newContentItem = itemToItemMapping[originalContentItem._id];
                newContents.push(newContentItem._id);
                uncontainedItemIds = uncontainedItemIds.filter(x => x !== newContentItem._id);
            }

            const update = {_id: newItem._id, "data.contents": newContents};
            await target.updateOwnedItem(update);
        }
    }

    // Remove items from source token
    let sourceItems = duplicate(source.token.data.flags.sfrpg.itemCollection.items);
    sourceItems = sourceItems.filter(x => !copiedItemIds.includes(x._id));
    await source.token.update({"flags.sfrpg.itemCollection.items": sourceItems});

    if (sourceItems.length === 0 && source.token.data.flags.sfrpg.itemCollection.deleteIfEmpty) {
        await source.token.delete();
    }

    // Add any uncontained items into targetItem, if applicable
    if (targetContainer) {
        let combinedContents = targetContainer.data.data.contents.concat(uncontainedItemIds);
        const update = {_id: targetContainer._id, "data.contents": combinedContents};
        await target.updateOwnedItem(update);
    }
}

async function onInventoryWarningReceived(message) {
    ui.notifications.info(game.i18n.format(message.payload));
}

function getActor(actorId, tokenId, sceneId) {
    let result = {
        actor: null,
        token: null
    }
    if (tokenId) {
        result.token = canvas.tokens.placeables.find(x => x.id === tokenId);
        if (!result.token) {
            result.token = game.scenes.get(sceneId).data.tokens.find(x => x._id === tokenId);
        }

        if (result.token) {
            result.actor = result.token.actor;
        }
    } else {
        result.actor = game.actors.get(actorId);
    }
    return result;
}

class ActorHelper {
    constructor(actorId, tokenId, sceneId) {
        this.actorId = actorId;
        this.tokenId = tokenId;
        this.sceneId = sceneId;

        if (tokenId) {
            this.token = canvas.tokens.placeables.find(x => x.id === tokenId);
            if (!this.token) {
                this.token = game.scenes.get(sceneId).data.tokens.find(x => x._id === tokenId);
            }
    
            if (this.token) {
                this.actor = this.token.actor;
            }
        } else {
            this.actor = game.actors.get(actorId);
        }
    }

    static FromObject(actorReferenceObject) {
        return new ActorHelper(actorReferenceObject.actorId, actorReferenceObject.tokenId, actorReferenceObject.sceneId);
    }

    /**
     * Wrapper around actor.getOwnedItem.
     * @param {String} itemId ID of item to get.
     */
    getOwnedItem(itemId) {
        if (!this.actor) return null;
        return this.actor.getOwnedItem(itemId);
    }

    /**
     * Wrapper around actor.createOwnedItem.
     * @param {Object} itemData Data for item to create.
     * @returns The newly created item.
     */
    async createOwnedItem(itemData) {
        if (!this.actor) return null;

        let newItem = null;
        if (this.actor.isToken) {
            const  created = await Entity.prototype.createEmbeddedEntity.call(this.actor, "OwnedItem", itemData, {temporary: true});
            const items = duplicate(this.actor.data.items).concat(created instanceof Array ? created : [created]);
            await this.actor.token.update({"actorData.items": items}, {});
            newItem = this.getOwnedItem(created._id);
        } else {
            const createItemResult = await this.actor.createOwnedItem(itemData);
            newItem = this.getOwnedItem(createItemResult._id);
        }

        return newItem;
    }

    /**
     * Wrapper around actor.updateOwnedItem.
     * @param {Object} update Data to update with. Must have an _id field.
     */
    async updateOwnedItem(update) {
        if (!this.actor) return null;
        return this.actor.updateOwnedItem(update);
    }

    /**
     * Wrapper around actor.deleteOwnedItem.
     * @param {String} itemId ID of item to delete.
     */
    async deleteOwnedItem(itemId) {
        if (!this.actor) return null;
        return this.actor.deleteOwnedItem(itemId);
    }
}