export async function adjustItemContainer(event, actor, getItem) {
    const targetId = $(event.target).parents('.item').attr('data-item-id')
    const targetItem = actor.items.find(x => x._id === targetId);

    const item = await getItem();
    
    let desiredContainerId = "";
    if (targetItem && acceptsItem(targetItem, item, item.data.quantity, actor)) {
        desiredContainerId = targetItem._id;
    } else if (targetItem && item && targetItem.data.data.containerId === item.data.data.containerId) {
        desiredContainerId = item.data.data.containerId;
    } else if (targetItem && targetItem.data.data.containerId) {
        desiredContainerId = targetItem.data.data.containerId;
    }

    const oldContainerId = item.data.data.containerId;
    let result = null;
    if (desiredContainerId !== oldContainerId) {
        result = await item.update({
            'data.containerId': desiredContainerId,
            'data.equipped': false,
        });

        if (oldContainerId) {
            const oldParent = actor.items.find(x => x._id === oldContainerId);
            await oldParent.update({});
        }
    }

    return result;
}

export async function removeItemFromActor(sourceActor, item, quantity) {
    const sourceItemQuantity = Math.min(item.data.data.quantity, quantity);
    const newItemQuantity = sourceItemQuantity - quantity;
    console.log(`Removing ${quantity}, clamped ${sourceItemQuantity}, final: ${newItemQuantity}`);

    if (newItemQuantity < 1) {
        await sourceActor.deleteEmbeddedEntity('OwnedItem', item._id);
    } else {
        const update = { '_id': item._id, 'data.quantity': newItemQuantity };
        await sourceActor.updateEmbeddedEntity('OwnedItem', update);
    }
}

export async function addItemToActor(targetActor, item, quantity) {
    let itemInTargetActor = targetActor.items.find(i => i.name === item.name);
    if (itemInTargetActor !== null && itemInTargetActor.type !== "container")
    {
        const targetItemNewQuantity = Number(itemInTargetActor.data.data.quantity) + quantity;
        const update = { '_id': itemInTargetActor._id, 'data.quantity': targetItemNewQuantity};
        await targetActor.updateEmbeddedEntity('OwnedItem', update);
    }
    else
    {
        let newItemData = duplicate(item);
        newItemData.data.quantity = quantity;

        const result = await targetActor.createOwnedItem(newItemData);
        itemInTargetActor = targetActor.items.get(result._id);
    }

    return adjustItemContainer(event, targetActor, () => { return itemInTargetActor; });
}

export async function moveItemBetweenActors(event, sourceActorId, targetActorId, itemId) {
    const sourceActor = game.actors.get(sourceActorId);
    const targetActor = game.actors.get(targetActorId);
    const item = sourceActor.getOwnedItem(itemId);

    let isSameActor = sourceActorId === targetActorId;

    if (isSameActor) {
        await adjustItemContainer(event, targetActor, () => { return item; });
        return true;
    } else {
        const sourceItemQuantity = item.data.data.quantity;
        await removeItemFromActor(sourceActor, item, sourceItemQuantity);
        await addItemToActor(targetActor, item, sourceItemQuantity);
        return false;
    }
}

function acceptsItem(containerItem, itemToAdd, quantity, actor) {
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

    /*let totalBulk = 0;
    let containedItems = actor.items.filter(x => x.data.containerId === containerItem._id);
    for (let childItem of containedItems) {
        let bulk = 0;
        if (childItem.data.bulk === "L") {
            bulk = 0.1;
        } else if (!Number.isNaN(childItem.data.bulk)) {
            bulk = childItem.data.bulk;
        }
        totalBulk += bulk * childItem.data.quantity;
    }

    let itemBulk = 0;
    if (itemToAdd.data.bulk === "L") {
        itemBulk = 0.1;
    } else if (!Number.isNaN(itemToAdd.data.bulk)) {
        itemBulk = itemToAdd.data.bulk;
    }

    if (totalBulk + itemBulk * quantity > containerItem.data.storageCapacity) {
        return false;
    }*/

    if (wouldCreateParentCycle(itemToAdd._id, containerItem._id, actor.data.items)) {
        console.log("Rejected because adding this item would create a cycle");
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