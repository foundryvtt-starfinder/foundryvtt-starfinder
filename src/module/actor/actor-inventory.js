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
 */
export async function removeItemFromActorAsync(sourceActor, item, quantity) {
    const sourceItemQuantity = Math.min(item.data.data.quantity, quantity);
    const newItemQuantity = sourceItemQuantity - quantity;

    if (newItemQuantity < 1) {
        await sourceActor.deleteEmbeddedEntity('OwnedItem', item._id);
    } else {
        const update = { '_id': item._id, 'data.quantity': newItemQuantity };
        await sourceActor.updateEmbeddedEntity('OwnedItem', update);
    }
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

/**
 * Moves an item from one actor to another, adjusting its container settings appropriately.
 * 
 * @param {DragDropEvent} event Associated DragDropEvent, can be null.
 * @param {String} sourceActorId Unique ID of the source actor.
 * @param {String} targetActorId Unique ID of the target actor.
 * @param {String} itemId Unique ID of the item to be moved.
 * @returns {Boolean} Returns true if sorting is to be done after execution, false otherwise.
 */
export async function moveItemBetweenActorsAsync(event, sourceActorId, targetActorId, itemId) {
    const sourceActor = game.actors.get(sourceActorId);
    const targetActor = game.actors.get(targetActorId);
    const item = sourceActor.getOwnedItem(itemId);

    let isSameActor = sourceActorId === targetActorId;

    let targetItem = null;
    if (event) {
        const targetId = $(event.target).parents('.item').attr('data-item-id')
        targetItem = targetActor.items.find(x => x._id === targetId);
    }

    if (isSameActor) {
        await tryAddItemToContainerAsync(targetItem, targetActor, () => { return item; });
        return true;
    } else {
        const sourceItemQuantity = item.data.data.quantity;
        await removeItemFromActorAsync(sourceActor, item, sourceItemQuantity);
        let itemInTargetActor = await addItemToActorAsync(targetActor, item, sourceItemQuantity);
        await tryAddItemToContainerAsync(targetItem, targetActor, () => { return itemInTargetActor; });
        return false;
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

        if (item && item.data.contentBulkMultiplier !== undefined) {
            contentBulk *= item.data.contentBulkMultiplier;
        }
    }

    let personalBulk = 0;
    if (item) {
        if (item.data.bulk.toUpperCase() === "L") {
            personalBulk = 1;
        } else if (!Number.isNaN(item.data.bulk)) {
            personalBulk = item.data.bulk * 10;
        }

        if (item.data.quantity && !Number.isNaN(item.data.quantity)) {
            personalBulk *= item.data.quantity;
        }

        if (item.data.equipped) {
            if (item.data.equippedBulkMultiplier !== undefined) {
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

    if (!["weapon", "equipment", "goods", "consumable", "container"].includes(itemToAdd.type)) {
        //console.log("Rejected because item is not an item: " + itemToAdd.type);
        return false;
    }

    const storageCapacity = containerItem.data.data.storageCapacity;
    if (!storageCapacity || storageCapacity === 0) {
        //console.log("Rejected because target storageCapacity is 0");
        return false;
    }

    const acceptedItemTypes = containerItem.data.data.acceptedItemTypes;
    if (acceptedItemTypes && !acceptedItemTypes.includes(itemToAdd.type)) {
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