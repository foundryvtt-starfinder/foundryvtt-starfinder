import { SFRPG } from "../config.js";

/**
 * Updates the item provided by the getItem function's parent to the DragDropEvent's target.
 * If the target item is a container, the item will be added to that container.
 * If the target item is an item, the item will be added to the target item's parent.
 * 
 * @param {Item} targetContainer Optional container item to add the item to.
 * @param {Actor} actor Actor that owns the item.
 * @param {Function} getItem Function that returns an Item object.
 * @returns {Promise} Returns null when no update is done, promise otherwise.
 */
export async function tryAddItemToContainerAsync(targetContainer, actor, getItem) {
    const item = await getItem();
    if (!item || item === targetContainer) {
        return null;
    }
    
    let desiredContainerId = "";
    if (targetContainer) {
        if (acceptsItem(targetContainer, item, actor)) {
            desiredContainerId = targetContainer._id;
        } else {
            desiredContainerId = targetContainer.data.data.containerId || "";
        }
    }

    if (desiredContainerId !== item.data.data.containerId) {
        return await item.update({
            'data.containerId': desiredContainerId,
            'data.equipped': false,
        });
    }

    return null;
}

/**
 * Removes the specified quantity of a given item from an actor.
 * 
 * @param {*} sourceActor Actor that owns the item.
 * @param {*} item Item to remove.
 * @param {*} quantity Number of items to remove, if quantity is greater than or equal to the item quantity, the item will be removed from the actor.
 * @returns {Boolean} Returns whether or not an update or removal took place.
 */
export async function removeItemFromActorAsync(sourceActor, item, quantity) {
    if (!sourceActor) return false;

    const sourceItemQuantity = Math.min(item.data.data.quantity, quantity);
    const newItemQuantity = sourceItemQuantity - quantity;

    if (newItemQuantity < 1) {
        await sourceActor.deleteEmbeddedEntity('OwnedItem', item._id);
    } else {
        const update = { '_id': item._id, 'data.quantity': newItemQuantity };
        await sourceActor.updateEmbeddedEntity('OwnedItem', update);
    }
    return true;
}


/**
 * Adds the specified quantity of a given item to an actor. Returns the (possibly newly created) item on the target actor.
 * 
 * @param {*} targetActor Actor that owns the item.
 * @param {*} item Item to add.
 * @param {*} quantity Number of items to add.
 * @returns {Item} The (possibly newly created) item in target actor.
 */
export async function addItemToActorAsync(targetActor, item, quantity) {
    if (!targetActor) return null;

    let itemInTargetActor = targetActor.items.find(i => i.name === item.name);
    if (itemInTargetActor !== null && itemInTargetActor.type !== "container")
    {
        const targetItemNewQuantity = Number(itemInTargetActor.data.data.quantity) + quantity;
        const update = { '_id': itemInTargetActor._id, 'data.quantity': targetItemNewQuantity};
        await targetActor.updateEmbeddedEntity('OwnedItem', update);
        return itemInTargetActor;
    }
    else
    {
        let newItemData = duplicate(item);
        newItemData.data.quantity = quantity;

        const result = await targetActor.createOwnedItem(newItemData);
        itemInTargetActor = targetActor.items.get(result._id);
        return itemInTargetActor;
    }
}

export function getChildItems(containerId, actor) {
    if (!actor) return null;
    let childItems = actor.items.filter(x => x.data.data.containerId === containerId);
    return childItems;
}

/**
 * Moves an item from one actor to another, adjusting its container settings appropriately.
 * 
 * @param {Actor} sourceActor (Optional) The source actor. If left null, no item will be removed, and any children will not be copied.
 * @param {Item} item Item to be moved.
 * @param {Actor} targetActor The target actor.
 * @param {Item} targetItem (Optional) Associated DragDropEvent, can be null.
 * @returns {Item} Returns the target actor item.
 */
export async function moveItemBetweenActorsAsync(sourceActor, item, targetActor, targetItem = null) {
    if (targetActor === null) {
        return null;
    }

    if (sourceActor === targetActor) {
        await tryAddItemToContainerAsync(targetItem, targetActor, () => { return item; });
        return item;
    } else {
        let itemsToMove = [{container: targetItem, items: [item]}];
        let firstMovedItem = null;
        do {
            let pair = itemsToMove.shift();
            let bulkAdd = [];
            for (let itemToMove of pair.items) {
                let children = getChildItems(itemToMove._id, sourceActor);
                if (children) {
                    const sourceItemQuantity = itemToMove.data.data.quantity;
                    let itemInTargetActor = await addItemToActorAsync(targetActor, itemToMove, sourceItemQuantity);
                    await tryAddItemToContainerAsync(pair.container, targetActor, () => { return itemInTargetActor; });

                    if (sourceActor) {
                        await removeItemFromActorAsync(sourceActor, itemToMove, sourceItemQuantity);
                    }
    
                    itemsToMove.push({container: itemInTargetActor, items: children});
    
                    firstMovedItem = firstMovedItem || itemInTargetActor;
                } else {
                    bulkAdd.push(itemToMove);
                }
            }

            if (bulkAdd.length > 0) {
                let result = await targetActor.createOwnedItem(bulkAdd);
                if (result && result.length > 0) {
                    firstMovedItem = firstMovedItem || result[0];
                }

                if (sourceActor) {
                    await sourceActor.deleteOwnedItem(bulkAdd);
                }
            }
        } while (itemsToMove.length > 0);

        return firstMovedItem;
    }
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

    if (wouldCreateParentCycle(itemToAdd._id, containerItem._id, actor.data.items)) {
        //console.log("Rejected because adding this item would create a cycle");
        return false;
    }

    return true;
}

/** Checks if assigning the containerId to the item would create a cycle */
function wouldCreateParentCycle(itemId, containerId, items = []) {
    let currentContainerId = containerId;
    do {
        let container = items.find(x => x._id === currentContainerId);
        if (container.data.containerId === itemId) {
            return true;
        }
        currentContainerId = container.data.containerId;
    } while (currentContainerId);
    return false;
}