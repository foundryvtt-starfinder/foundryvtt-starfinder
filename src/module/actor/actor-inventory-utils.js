import { SFRPG } from "../config.js";
import { RPC } from "../rpc.js";

import { value_equals } from "../utils/value_equals.js";
import { generateUUID } from "../utilities.js";

export function initializeRemoteInventory() {
    RPC.registerCallback("createItemCollection", "gm", onCreateItemCollection);
    RPC.registerCallback("dragItemToCollection", "gm", onItemDraggedToCollection);
    RPC.registerCallback("dragItemFromCollectionToPlayer", "gm", onItemCollectionItemDraggedToPlayer);
    RPC.registerCallback("raiseInventoryWarning", "local", onInventoryWarningReceived);
}

/**
 * Adds the specified quantity of a given item to an actor. Returns the (possibly newly created) item on the target actor.
 * Will not add child items, those will have to be added manually at a later iteration.
 * 
 * @param {ActorItemHelper} targetActor Actor to add the item to.
 * @param {Item} item Item to add.
 * @param {Number} quantity Quantity of the item to add.
 * @param {Item} targetItem (Optional) Item to either merge with, or add as a child to, or find its parent and set as a sibling.
 * @returns {Item} Returns the (possibly newly created) item on the target actor.
 */
export async function addItemToActorAsync(targetActor, itemToAdd, quantity, targetItem = null, targetItemStorageIndex = null) {
    if (!ActorItemHelper.IsValidHelper(targetActor)) return null;

    if (targetItem && targetItem === itemToAdd) {
        return itemToAdd;
    }

    const newItemData = duplicate(itemToAdd);
    newItemData.data.quantity = quantity;

    let desiredParent = null;
    if (targetItem) {
        if (acceptsItem(targetItem, itemToAdd, targetActor.actor)) {
            desiredParent = targetItem;
        } else if (targetItem.name === itemToAdd.name && !containsItems(targetItem) && !containsItems(itemToAdd)) {
            const targetItemNewQuantity = Number(targetItem.data.data.quantity) + quantity;
            await targetActor.updateItem(targetItem._id, {'data.quantity': targetItemNewQuantity});
            return targetItem;
        } else {
            desiredParent = targetActor.findItem(x => x.data.container?.contents && x.data.container.contents.find(y => y.id === targetItem._id));
        }
    }
    
    let addedItem = null;
    if (targetActor.isToken) {
        const created = await Entity.prototype.createEmbeddedDocuments.call(targetActor.actor, "Item", [newItemData], {temporary: true});
        const items = duplicate(targetActor.actor.data.items).concat(created instanceof Array ? created : [created]);
        await targetActor.token.update({"actorData.items": items}, {});
        addedItem = targetActor.getItem(created._id);
    } else {
        const result = await targetActor.createEmbeddedDocuments("Item", [newItemData]);
        addedItem = targetActor.getItem(result._id);
    }

    if (desiredParent) {
        let newContents = duplicate(desiredParent.data.data.container.contents || []);
        newContents.push({id: addedItem._id, index: targetItemStorageIndex || 0});
        await targetActor.updateItem(desiredParent._id, {"data.container.contents": newContents});
    }

    return addedItem;
}

/**
 * Removes the specified quantity of a given item from an actor.
 * 
 * @param {ActorItemHelper} sourceActor Actor that owns the item.
 * @param {Item} item Item to remove.
 * @param {Number} quantity Number of items to remove, if quantity is greater than or equal to the item quantity, the item will be removed from the actor.
 * @param {Boolean} recursive (Optional) Recursively remove child items too? Setting this to false puts all items into the deleted item's root. Defaults to false.
 * @returns {Boolean} Returns whether or not an update or removal took place.
 */
export async function removeItemFromActorAsync(sourceActor, itemToRemove, quantity, recursive = false) {
    if (!ActorItemHelper.IsValidHelper(sourceActor) || !itemToRemove) return false;

    const sourceItemQuantity = itemToRemove.data.data.quantity;
    const newItemQuantity = sourceItemQuantity - quantity;

    if (newItemQuantity < 1) {
        return sourceActor.deleteItem(itemToRemove);
    } else {
        return sourceActor.updateItem(itemToRemove._id, {'data.quantity': newItemQuantity });
    }
}

/**
 * Moves an item from one actor to another, adjusting its container settings appropriately.
 * 
 * @param {ActorItemHelper} sourceActor The source actor.
 * @param {Item} itemToMove Item to be moved.
 * @param {ActorItemHelper} targetActor The target actor.
 * @param {Item} targetItem (Optional) Item to add the item to, merge with, or make sibling for.
 * @param {Number} quantity (Optional) Amount of item to move, if null will move everything.
 * @returns {Item} Returns the item on the targetActor.
 */
export async function moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetItem = null, quantity = null, targetItemStorageIndex = null) {
    if (!ActorItemHelper.IsValidHelper(targetActor)) {
        console.log("Inventory::moveItemBetweenActorsAsync: targetActor is not a valid ActorItemHelper instance.");
        return null;
    }

    if (!itemToMove) {
        console.log("Inventory::moveItemBetweenActorsAsync: itemToMove is not valid.");
        return null;
    }

    if (!ActorItemHelper.IsValidHelper(sourceActor)) {
        console.log("Inventory::moveItemBetweenActorsAsync: sourceActor is not a valid ActorItemHelper, switching to addItemToActorAsync.");
        return addItemToActorAsync(targetActor, itemToMove, itemToMove.data.data.quantity, targetItem, targetItemStorageIndex);
    }

    const itemQuantity = itemToMove.data?.data?.quantity;
    if (!quantity) {
        quantity = itemQuantity;

        if (acceptsItem(targetItem, itemToMove, targetActor)) {
            const storageIndex = getFirstAcceptableStorageIndex(targetItem, itemToMove);
            if (storageIndex !== null) {
                const storage = targetItem.data.data.container.storage[storageIndex];
                if (storage.type === "slot") {
                    quantity = 1;
                }
            }
        }
    }

    const isFullMove = (quantity >= itemQuantity);

    if (sourceActor.actor === targetActor.actor) {
        if (quantity < itemQuantity) {
            await sourceActor.updateItem(itemToMove.id, {"quantity": itemQuantity - quantity});

            let newItemData = duplicate(itemToMove.data);
            delete newItemData.id;
            newItemData.data.quantity = quantity;
            
            itemToMove = await targetActor.createItem(newItemData);
            itemToMove = targetActor.getItem(itemToMove[0].id);
        }

        if (itemToMove === targetItem) {
            return itemToMove;
        }

        let desiredParent = null;
        let desiredStorageIndex = null;
        if (targetItem) {
            if (acceptsItem(targetItem, itemToMove, targetActor)) {
                desiredParent = targetItem;
                desiredStorageIndex = getFirstAcceptableStorageIndex(desiredParent, itemToMove);
            } else if (canMerge(targetItem, itemToMove)) {
                // Merging will destroy the old item, so we return the targetItem here.
                const targetItemNewQuantity = Number(targetItem.data.data.quantity) + Number(quantity);
                await targetActor.updateItem(targetItem.id, {'quantity': targetItemNewQuantity});

                if (quantity >= itemQuantity) {
                    await sourceActor.deleteItem(itemToMove.id);
                } else {
                    await sourceActor.updateItem(itemToMove.id, {'quantity': itemQuantity - quantity});
                }

                return targetItem;
            } else {
                let targetsParent = targetActor.findItem(x => x.data.data.container?.contents && x.data.data.container.contents.find( y => y.id === targetItem.id));
                if (targetsParent) {
                    if (!wouldCreateParentCycle(itemToMove, targetsParent, targetActor)) {
                        if (acceptsItem(targetsParent, itemToMove, targetActor)) {
                            desiredParent = targetsParent;
                            desiredStorageIndex = getFirstAcceptableStorageIndex(desiredParent, itemToMove);
                        }
                    } else {
                        return itemToMove;
                    }
                }
            }
        }

        let currentParent = targetActor.findItem(x => x.data.data.container?.contents && x.data.data.container.contents.find(y => y.id === itemToMove.id));

        if (desiredParent !== currentParent) {
            let bulkUpdates = [];
            if (currentParent) {
                let newContents = currentParent.data.data.container.contents.filter(x => x.id !== itemToMove.id);
                bulkUpdates.push({_id: currentParent.id, "data.container.contents": newContents});
            }

            if (desiredParent) {
                let newContents = duplicate(desiredParent.data.data.container?.contents || []);
                newContents.push({id: itemToMove.id, index: desiredStorageIndex || 0});
                bulkUpdates.push({_id: desiredParent.id, "data.container.contents": newContents});
            }

            if (itemToMove.data.data.equipped) {
                bulkUpdates.push({_id: itemToMove.id, "data.equipped": false});
            }

            await targetActor.actor.updateEmbeddedDocuments("Item", bulkUpdates);
        }

        return itemToMove;
    } else {
        /** Get all items to move. */
        const items = [];
        const itemsToMove = [{item: itemToMove, parent: null}];
        while (itemsToMove.length > 0) {
            const itemToCreate = itemsToMove.shift();
            const contents = getChildItems(sourceActor, itemToCreate.item);
            if (contents) {
                for (const contentItem of contents) {
                    itemsToMove.push({item: contentItem, parent: itemToCreate});
                }
            }

            const duplicatedData = duplicate(itemToCreate.item);
            if (duplicatedData.data.equipped) {
                duplicatedData.data.equipped = false;
            }
            
            items.push({item: duplicatedData, children: contents, parent: itemToCreate.parent});
        }

        if (targetItem) {
            if (canMerge(targetItem, itemToMove)) {
                const updateResult = await targetActor.updateItem(targetItem._id, {'data.quantity': parseInt(targetItem.data.data.quantity) + parseInt(quantity)});
                
                if (isFullMove) {
                    const itemsToRemove = items.map(x => x.item._id);
                    await sourceActor.deleteItem(itemsToRemove);
                } else {
                    await sourceActor.updateItem(itemToMove._id, {'data.quantity': itemQuantity - quantity});
                }

                return updateResult;
            }
        }

        /** Add new items to target actor. */
        const itemData = items.map(x => x.item);
        if (targetActor.actor?.sheet) {
            targetActor.actor.sheet.stopRendering = true;
        }
        if (targetActor.token?.sheet) {
            targetActor.token.sheet.stopRendering = true;
        }

        /** Ensure the original to-move item has the quantity correct. */
        itemData[0].data.quantity = quantity;

        if (itemData.length != items.length) {
            console.log(['Mismatch in item count', itemData, items]);
            return;
        }

        const createOwnedItemResult = await targetActor.createItem(itemData);
        const createResult = createOwnedItemResult instanceof Array ? createOwnedItemResult : [createOwnedItemResult];
        if (targetActor.actor?.sheet) {
            targetActor.actor.sheet.stopRendering = false;
        }
        if (targetActor.token?.sheet) {
            targetActor.token.sheet.stopRendering = false;
        }

        if (createResult.length != items.length) {
            console.log(['Mismatch in item count after creating', createResult, items]);
            const deleteIds = createResult.map(x => x.id);
            return targetActor.deleteItem(deleteIds);
        }

        const updatesToPerform = [];
        for (let i = 0; i<items.length; i++) {
            const itemToTest = items[i];
            const itemToUpdate = createResult[i];

            if (itemToTest.children && itemToTest.children.length > 0) {
                const indexMap = itemToTest.item.data.container.contents.map(x => {
                    const foundItem = items.find(y => y.item._id === x.id);
                    const foundItemIndex = items.indexOf(foundItem);
                    return foundItemIndex;
                });

                let newContents = duplicate(itemToUpdate.data.data.container.contents);
                for (let j = 0; j<indexMap.length; j++) {
                    const index = indexMap[j];
                    if (index === -1) {
                        newContents[j].id = "deleteme";
                        continue;
                    }

                    try {
                        newContents[j].id = createResult[index].id;
                    } catch (error) {
                        console.log({
                            index: index,
                            items: items,
                            createResult: createResult,
                            itemToTest: itemToTest,
                            itemToUpdate: itemToUpdate,
                            indexMap: indexMap
                        });
                        const deleteIds = createResult.map(x => x.id);
                        await targetActor.deleteItem(deleteIds);
                        throw error;
                    }
                }

                newContents = newContents.filter(x => x.id !== "deleteme");

                updatesToPerform.push({ _id: itemToUpdate.id, 'data.container.contents': newContents});
            }
        }

        let desiredParent = null;
        let desiredStorageIndex = null;
        if (targetItem) {
            if (acceptsItem(targetItem, itemToMove, targetActor)) {
                desiredParent = targetItem;
                desiredStorageIndex = targetItemStorageIndex;
            } else {
                let targetsParent = targetActor.findItem(x => x.data.data.container?.contents && x.data.data.container.contents.find( y => y.id === targetItem._id));
                if (targetsParent) {
                    if (!wouldCreateParentCycle(itemToMove, targetsParent, targetActor)) {
                        desiredParent = targetsParent;
                        desiredStorageIndex = getFirstAcceptableStorageIndex(desiredParent, itemToMove);
                    }
                }
            }
        }

        if (desiredParent) {
            const newContents = duplicate(desiredParent.data.data.container?.contents || []);
            newContents.push({id: createResult[0].id, index: desiredStorageIndex || 0});
            updatesToPerform.push({_id: desiredParent.id, "data.container.contents": newContents});
        }

        await targetActor.actor.updateEmbeddedDocuments("Item", updatesToPerform);
        if (targetActor.actor?.sheet) {
            targetActor.actor.sheet.render(false);
        }
        if (targetActor.token?.sheet) {
            targetActor.token.sheet.render(false);
        }

        /** Delete all items from source actor. */
        if (isFullMove) {
            const itemsToRemove = items.map(x => x.item._id);
            await sourceActor.deleteItem(itemsToRemove);
        } else {
            await sourceActor.updateItem(itemToMove._id, {'data.quantity': itemQuantity - quantity});
        }

        return createResult[0];
    }
}

/**
 * Changes the item's container on an actor.
 * 
 * @param {ActorItemHelper} actorItemHelper 
 * @param {Item} item 
 * @param {Item} container 
 */
export async function setItemContainer(actorItemHelper, item, container, quantity = null) {
    return await moveItemBetweenActorsAsync(actorItemHelper, item, actorItemHelper, container, quantity);
}

/**
 * Tests if a given item contains any items.
 * 
 * @param {Item} item Item to test.
 * @returns {Boolean} Boolean whether or not this item contains anything.
 */
export function containsItems(item) {
    return item && item.data.data.container?.contents && item.data.data.container.contents.length > 0;
}

/**
 * Returns an array of child items for a given item on an actor.
 * 
 * @param {Actor} actorItemHelper ActorItemHelper for whom's items to test.
 * @param {Item} item Item to get the children of.
 * @returns {Array} An array of child items.
 */
export function getChildItems(actorItemHelper, item) {
    if (!actorItemHelper) return [];
    if (!containsItems(item)) return [];
    return actorItemHelper.filterItems(x => item.data.data.container.contents.find(y => y.id === x.id));
}

/**
 * Returns the containing item for a given item.
 * 
 * @param {Array} items Array of items to test, typically actor.items.
 * @param {Item} item Item to find the parent of.
 * @returns {Item} The parent item of the item, or null if not contained.
 */
export function getItemContainer(items, item) {
    return items.find(x => x.data.data.container?.contents?.find(y => y.id === item.id) !== undefined);
}

/**
 * Checks if two given items can be merged.
 * @param {Item} itemA 
 * @param {Item} itemB 
 */
function canMerge(itemA, itemB) {
    if (!itemA || !itemB) {
        console.log(`Can't merge because of null-items: itemA: ${itemA}, itemB: ${itemB}`)
        return false;
    }
    if (itemA.name !== itemB.name || itemA.type !== itemB.type) {
        console.log(`Can't merge because of name or type mismatch: itemA: ${itemA.type}/${itemA.name}, itemB: ${itemB.type}/${itemB.name}`);
        return false;
    }

    // Containers cannot merge, otherwise you can have multiple containers containing the same items multiple times, etc.
    if (itemA.type === "container" || itemB.type === "container") {
        console.log(`Can't merge because one or both items are a container: itemA: ${itemA.type}/${itemA.name}, itemB: ${itemB.type}/${itemB.name}`);
        return false;
    }

    // If items contain other items, they cannot merge. This can be the case for non-containers like armors with armor upgrades, etc.
    const itemAContainsItems = containsItems(itemA);
    const itemBContainsItems = containsItems(itemB);
    if (itemAContainsItems || itemBContainsItems) {
        console.log(`Can't merge because one or both items contain items: itemA: ${itemAContainsItems}, itemB: ${itemBContainsItems}`);
        return false;
    }

    // Perform deep comparison on item data.
    let itemDataA = duplicate(itemA.data.data);
    delete itemDataA.quantity;

    let itemDataB = duplicate(itemB.data.data);
    delete itemDataB.quantity;

    // TODO: Remove all keys that are not template appropriate given the item type, remove all keys that are not shared?

    const deepEqual = value_equals(itemDataA, itemDataB, false, true);
    return deepEqual;
}

export function getFirstAcceptableStorageIndex(container, itemToAdd) {
    let index = -1;
    if (!(container.type in SFRPG.containableTypes)) {
        return null;
    }

    for (const storageOption of container.data.data.container.storage) {
        index += 1;
        if (storageOption.amount == 0) {
            //console.log(`Skipping storage ${index} because it has a 0 amount.`);
            continue;
        }

        if (!storageOption.acceptsType.includes(itemToAdd.type)) {
            //console.log(`Skipping storage ${index} because it doesn't accept ${itemToAdd.type}.`);
            continue;
        }

        if (storageOption.weightProperty && !itemToAdd.data.data[storageOption.weightProperty]) {
            //console.log(`Skipping storage ${index} because it does not match the weight settings.`);
            continue;
        }

        if (storageOption.type === "slot") {
            const storedItemLinks = container.data.data.container.contents.filter(x => x.index === index);

            const itemsTypes = ["", "ammunitionSlot"];
            if (storageOption.weightProperty === "items" || itemsTypes.includes(storageOption.subtype)) {
                const numItemsInStorage = storedItemLinks.length;
                if (numItemsInStorage >= storageOption.amount) {
                    //console.log(`Skipping storage ${index} because it has too many items in the slots already. (${numItemsInStorage} / ${storageOption.amount})`);
                    continue;
                }
            } else {
                const storedItems = storedItemLinks.map(x => container.actor?.items.get(x.id)).filter(x => x);
                const totalStoredAmount = storedItems.reduce((accumulator, currentValue, currentIndex, array) => {
                    return accumulator + currentValue.data.data[storageOption.weightProperty];
                }, itemToAdd.data.data[storageOption.weightProperty]);

                if (totalStoredAmount > storageOption.amount) {
                    //console.log(`Skipping storage ${index} because it has too many items in the slots already. (${totalStoredAmount} / ${storageOption.amount})`);
                    continue;
                }
            }
        }

        return index;
    }

    return null;
}

function acceptsItem(containerItem, itemToAdd, actor) {
    if (!containerItem || !itemToAdd) {
        //console.log("Rejected because container or item is null");
        return false;
    }

    if (!(itemToAdd.type in SFRPG.containableTypes)) {
        //console.log("Rejected because item is not a containable item: " + itemToAdd.type);
        return false;
    }

    if (!containerItem.data.data.container) {
        console.log("Rejected because target is not a container");
        return false;
    }

    if (containerItem.data.data.quantity > 1) {
        console.log("Rejected because only items with a quantity of 1 can contain items.");
        return false;
    }

    let storageFound = getFirstAcceptableStorageIndex(containerItem, itemToAdd);
    if (storageFound === null) {
        console.log("Rejected because no suitable storage found");
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
    if (!actor || !actor.actor) throw "Inventory::wouldCreateParentCycle: No actor specified.";
    if (item === container) return true;

    // If the item has no children it cannot create cycles.
    if (!containsItems(item)) return false;

    if (item.data.data.container.contents.find(y => y.id === container.id)) return true;

    let itemsToTest = duplicate(item.data.data.container.contents || []);
    while (itemsToTest.length > 0) {
        const content = itemsToTest.shift();
        const child = actor.actor.items.get(content.id);
        if (!child) continue;

        if (!containsItems(child)) continue;
        if (child.data.data.container.contents.find(y => y.id === container.id)) return true;
        itemsToTest = itemsToTest.concat(child.data.data.container.contents);
    }
    return false;
}

/******************************************************************************
 * RPC handlers
 ******************************************************************************/
export async function onCreateItemCollection(message) {
    const payload = message.payload;
    if (!payload.itemData) {
        return false;
    }

    if (!canvas.initialized) {
        return false;
    }

    const createdTokenPromise = canvas.scene.createEmbeddedDocuments("Token", [{
        name: payload.itemData[0].name,
        x: payload.position.x,
        y: payload.position.y,
        img: payload.itemData[0].img,
        hidden: false,
        locked: true,
        disposition: 0,
        flags: {
            "sfrpg": {
                "itemCollection": {
                    items: payload.itemData,
                    locked: payload.settings.locked,
                    deleteIfEmpty: payload.settings.deleteIfEmpty
                }
            }
        }
    }]);

    /*createdTokenPromise.then((createdTokens) => {
        const createdToken = createdTokens[0];
        console.log(createdToken);
        
        createdToken.createEmbeddedDocuments("Item", payload.itemData);
    });*/
    return createdTokenPromise;
}

async function onItemDraggedToCollection(message) {
    const data = message.payload;

    const target = ActorItemHelper.FromObject(data.target);
    const items = target.token.data.flags.sfrpg.itemCollection.items;

    let targetContainer = null;
    if (data.containerId) {
        targetContainer = items.find(x => x.id === data.containerId);
    }

    let newItems = [];
    if (data.pack) {
        const pack = game.packs.get(data.pack);
        const itemData = await pack.getDocument(data.draggedItemId);
        newItems.push(duplicate(itemData));
    } else if (data.source.tokenId || data.source.actorId) {
        // from another token
        const source = ActorItemHelper.FromObject(data.source);
        if (!source.isValid()) {
            return;
        }

        newItems.push(data.draggedItemData);

        const itemIdsToDelete = [data.draggedItemData._id];

        const sourceItemData = data.draggedItemData;
        if (source !== null && sourceItemData.data.container?.contents && sourceItemData.data.container.contents.length > 0) {
            const containersToTest = [sourceItemData];
            while (containersToTest.length > 0)
            {
                const container = containersToTest.shift();
                const children = source.filterItems(x => container.data.container.contents.find(y => y.id === x.id));
                if (children) {
                    for (const child of children) {
                        newItems.push(child.data);
                        itemIdsToDelete.push(child.id);

                        if (child.data.data.container?.contents && child.data.data.container.contents.length > 0) {
                            containersToTest.push(child.data);
                        }
                    }
                }
            }
        }

        await source.deleteItem(itemIdsToDelete);
    } else {
        const sidebarItem = game.items.get(data.draggedItemId);
        if (sidebarItem) {
            const itemData = duplicate(sidebarItem.data);
            newItems.push(duplicate(itemData));
        }
    }

    for (const item of newItems) {
        item._id = generateUUID();
    }

    if (newItems.length > 0) {
        if (targetContainer && targetContainer.data.container?.contents) {
            for (const newItem of newItems) {
                const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, newItem) || 0;
                targetContainer.data.container.contents.push({id: newItem._id, index: preferredStorageIndex});
            }
        }
        newItems = items.concat(newItems);
        const update = {
            "flags.sfrpg.itemCollection.items": newItems
        }
        await target.token.document.update(update);
    }
}

async function onItemCollectionItemDraggedToPlayer(message) {
    const data = message.payload;

    // Unpack data
    const source = ActorItemHelper.FromObject(data.source);
    const target = ActorItemHelper.FromObject(data.target);

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
        targetContainer = target.getItem(data.containerId);
    }

    // Add items to target
    let uncontainedItemIds = [];
    const copiedItemIds = [];
    const itemToItemMapping = {};

    // Get child items as well
    const itemsToTest = duplicate(data.draggedItems);
    while (itemsToTest.length > 0) {
        const draggedItem = itemsToTest.shift();
        if (draggedItem.data?.container?.contents?.length > 0) {
            draggedItem.data.container.contents = draggedItem.data.container.contents.filter(x => x.id);
            for (const {id:contentItemId, index:contentItemIndex} of draggedItem.data.container.contents) {
                if (contentItemId) {
                    const contentItem = source.token.data.flags.sfrpg.itemCollection.items.find(x => x._id == contentItemId);
                    if (contentItem) {
                        data.draggedItems.push(contentItem);
                        itemsToTest.push(contentItem);
                    }
                }
            }
        }
    }

    // If effects are serialized (0.8) remove them now
    const oldIds = [];
    for (const item of data.draggedItems) {
        oldIds.push(item._id);
        item._id = null;
        item.effects = [];
    }

    const createdItems = await target.createItem(data.draggedItems);
    for (let i = 0; i<createdItems.length; i++) {
        const newItem = createdItems[i];
        const originalItem = data.draggedItems[i];
        originalItem._id = oldIds[i];

        itemToItemMapping[originalItem._id] = newItem;
        copiedItemIds.push(originalItem._id);
        uncontainedItemIds.push(newItem.id);
    }

    const bulkUpdates = [];
    for (const originalItem of data.draggedItems) {
        const newItem = itemToItemMapping[originalItem._id];
        if (originalItem.data.container?.contents && originalItem.data.container.contents.length > 0) {
            originalItem.data.container.contents = originalItem.data.container.contents.filter(x => x.id);
            const newContents = [];
            for (const originalContent of originalItem.data.container.contents) {
                const originalContentItem = data.draggedItems.find(x => x._id === originalContent.id);
                if (originalContentItem) {
                    const newContentItem = itemToItemMapping[originalContentItem._id];
                    newContents.push({id: newContentItem.id, index: originalContent.index});
                    uncontainedItemIds = uncontainedItemIds.filter(x => x !== newContentItem.id);
                }
            }

            const update = {_id: newItem.id, "data.container.contents": newContents};
            bulkUpdates.push(update);
        }
    }
    if (bulkUpdates.length > 0) {
        await target.actor.updateEmbeddedDocuments("Item", bulkUpdates);
    }

    // Remove items from source token
    let sourceItems = duplicate(source.token.data.flags.sfrpg.itemCollection.items);
    sourceItems = sourceItems.filter(x => !copiedItemIds.includes(x._id));
    await source.token.document.update({"flags.sfrpg.itemCollection.items": sourceItems});

    if (sourceItems.length === 0 && source.token.data.flags.sfrpg.itemCollection.deleteIfEmpty) {
        await source.token.document.delete();
    }

    // Add any uncontained items into targetItem, if applicable
    if (targetContainer) {
        const acceptableItemIds = [];
        for (let uncontainedItemId of uncontainedItemIds) {
            const uncontainedItem = target.getItem(uncontainedItemId);
            if (acceptsItem(targetContainer, uncontainedItem, target.actor)) {
                let preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, uncontainedItem) || 0;
                acceptableItemIds.push({id: uncontainedItemId, index: preferredStorageIndex});
            }
        }

        if (acceptableItemIds.length > 0) {
            const combinedContents = targetContainer.data.data.container.contents.concat(acceptableItemIds);
            await target.updateItem(targetContainer.id, {"data.container.contents": combinedContents});
        }
    }
}

async function onInventoryWarningReceived(message) {
    ui.notifications.info(game.i18n.format(message.payload));
}

/******************************************************************************
 * Helper classes
 ******************************************************************************/

 /**
  * A helper class that takes an actor, token, and scene id and neatly wraps the
  * item interfaces so that they go to the right actor data. Unlinked tokens thus
  * remain unlinked from the parent actor, while linked tokens will share with
  * their parent.
  */
export class ActorItemHelper {
    constructor(actorId, tokenId, sceneId, options = {}) {
        this.actorId = actorId;
        this.tokenId = tokenId;
        this.sceneId = sceneId;

        if (tokenId) {
            this.token = canvas.tokens?.placeables.find(x => x.id === tokenId);
            if (!this.token) {
                this.token = game.scenes.get(sceneId).data.tokens.find(x => x.id === tokenId);
            }

            if (this.token) {
                this.scene = this.token.scene || game.scenes.get(sceneId);
                this.actor = this.token.actor;
            }
        }
        
        if (!this.actor && actorId) {
            this.actor = game.actors.get(actorId);
        }

        if (options?.debug) {
            console.trace();
            console.log([actorId, tokenId, sceneId]);
            console.log([this.actor, this.token, this.scene]);
        }
    }

    /**
     * Parses a new ActorItemHelper out of an object containing actorId, tokenId, and sceneId.
     * @param {Object} actorReferenceObject 
     */
    static FromObject(actorReferenceObject, options = {}) {
        return new ActorItemHelper(actorReferenceObject.actorId, actorReferenceObject.tokenId, actorReferenceObject.sceneId, options);
    }

    toObject() {
        return {actorId: this.actorId, tokenId: this.tokenId, sceneId: this.sceneId};
    }

    static IsValidHelper(object) {
        return (object && object instanceof ActorItemHelper && object.isValid());
    }

    isValid() {
        return (this.actor);
    }

    /**
     * Wrapper around actor.items.get.
     * @param {String} itemId ID of item to get.
     */
    getItem(itemId) {
        if (!this.actor) return null;
        return this.actor.items.get(itemId);
    }

    /**
     * Wrapper around actor.createOwnedItem.
     * @param {Object} itemData Data for item to create.
     * @returns An array of newly created items.
     */
    async createItem(itemData) {
        if (!this.actor) return null;

        const dataToCreate = itemData instanceof Array ? itemData : [itemData];
        const createResult = await this.actor.createEmbeddedDocuments("Item", dataToCreate, {});
        const newItem = createResult instanceof Array ? createResult : [createResult];

        return newItem;
    }

    /**
     * Wrapper around actor.updateEmbeddedDocuments.
     * @param {Object} update Data to update with. Must have an id field.
     */
    async updateItem(itemId, update) {
        if (!this.actor) return null;

        return this.actor.updateEmbeddedDocuments("Item", [{ "_id": itemId, data: update}]);
    }

    /**
     * Wrapper around actor.deleteEmbeddedDocuments, also removes the item cleanly from its container, if applicable.
     * @param {String} itemId ID of item to delete.
     * @param {Boolean} recursive (Optional) Set to true to also delete contained items. Defaults to false.
     */
    async deleteItem(itemId, recursive = false) {
        if (!this.actor) return null;

        const itemIdsToDelete = (itemId instanceof Array) ? itemId : [itemId];

        if (recursive) {
            let idsToTest = [itemId];
            while (idsToTest.length > 0) {
                let idToTest = idsToTest.shift();
                let item = this.getItem(idToTest);
                if (item && item.data.data.container?.contents) {
                    for (let containedItem of item.data.data.container.contents) {
                        itemIdsToDelete.push(containedItem.id);
                        idsToTest.push(containedItem.id);
                    }
                }
            }
        }

        /** Clean up parent container, if deleted from container. */
        const promises = [];
        const container = this.actor.items.find(x => x.data.data?.container?.contents?.find(y => y.id === itemId) !== undefined);
        if (container) {
            const newContents = container.data.data.container.contents.filter(x => x.id !== itemId);
            promises.push(this.actor.updateEmbeddedDocuments("Item", [{"_id": container.id, "data.container.contents": newContents}]));
        }

        promises.push(this.actor.deleteEmbeddedDocuments("Item", itemIdsToDelete, {}));

        return Promise.all(promises);
    }

    /**
     * Wrapper around actor.items.find().
     * @param {Function} fn Method used to search the item.
     * @returns The first item matching fn. Null if nothing is found or invalid helper.
     */
    findItem(fn) {
        if (!ActorItemHelper.IsValidHelper(this)) {
            return null;
        }
        return this.actor.items.find(fn);
    }

    /**
     * Wrapper around actor.items.filter().
     * @param {*} fn Method used to filter the items.
     * @returns Array of items matching fn. Null if invalid helper.
     */
    filterItems(fn) {
        if (!ActorItemHelper.IsValidHelper(this)) {
            return null;
        }
        return this.actor.items.filter(fn);
    }

    /**
     * Function that migrates actor items to the new data format, using some rough guesstimations.
     * Returns null if no migrations are performed, or a Promise if there is.
     */
    migrateItems() {
        if (!this.isValid()) return null;

        const propertiesToTest = ["contents", "storageCapacity", "contentBulkMultiplier", "acceptedItemTypes", "fusions", "armor.upgradeSlots", "armor.upgrades"];
        const migrations = [];
        for (const item of this.actor.items) {
            const itemData = duplicate(item.data.data);
            let isDirty = false;

            // Migrate original format
            const migrate = propertiesToTest.filter(x => itemData.hasOwnProperty(x));
            if (migrate.length > 0) {
                //console.log(migrate);

                const container = {
                    contents: (itemData.contents || []).map(x => { return { id: x, index: 0 }; }),
                    storage: []
                };

                if (item.type === "container") {
                    const currentStorage = itemData?.container?.storage[0];
                    container.storage.push({
                        type: currentStorage?.type || "bulk",
                        subtype: currentStorage?.subtype || "",
                        amount: currentStorage?.amount || itemData.storageCapacity || 0,
                        acceptsType: currentStorage?.acceptsType || itemData.acceptedItemTypes ? Object.keys(itemData.acceptedItemTypes) : [],
                        affectsEncumbrance: (currentStorage?.affectsEncumbrance !== null || undefined) ? (currentStorage?.affectsEncumbrance) : ((itemData.contentBulkMultiplier === 0) ? false : true),
                        weightProperty: currentStorage?.weightProperty || "bulk"
                    });
                } else if (item.type === "weapon") {
                    container.storage.push({
                        type: "slot",
                        subtype: "fusion",
                        amount: itemData.level,
                        acceptsType: ["fusion"],
                        affectsEncumbrance: false,
                        weightProperty: "level"
                    });
                } else if (item.type === "equipment") {
                    container.storage.push({
                        type: "slot",
                        subtype: "armorUpgrade",
                        amount: itemData.armor?.upgradeSlots || 0,
                        acceptsType: ["upgrade", "weapon"],
                        affectsEncumbrance: true,
                        weightProperty: "slots"
                    });
                    container.storage.push({
                        type: "slot",
                        subtype: "weaponSlot",
                        amount: itemData.weaponSlots || 0,
                        acceptsType: ["weapon"],
                        affectsEncumbrance: true,
                        weightProperty: "slots"
                    });
                }

                itemData["container"] = container;

                delete itemData.contents;
                delete itemData.storageCapacity;
                delete itemData.acceptedItemTypes;
                delete itemData.contentBulkMultiplier;

                delete itemData.containedItemIds;
                delete itemData.fusions;
                if (itemData.armor) {
                    delete itemData.armor.upgradeSlots;
                    delete itemData.armor.upgrades;
                }

                isDirty = true;
            }

            // Migrate intermediate format
            if (itemData.container?.contents?.length > 0) {
                if (itemData.container.contents[0] instanceof String) {
                    for (let i = 0; i<itemData.container.contents.length; i++) {
                        itemData.container.contents[i] = {id: itemData.container.contents[0], index: 0};
                    }

                    isDirty = true;
                }

                if (itemData.container.itemWeightMultiplier) {
                    delete itemData.container.itemWeightMultiplier;
                    isDirty = true;
                }
            }

            if (itemData.container?.storage && itemData.container.storage.length > 0) {
                for (let storage of itemData.container.storage) {
                    if (storage.hasOwnProperty("weightMultiplier")) {
                        storage["affectsEncumbrance"] = storage.weightMultiplier === 0 ? false : true;
                        delete storage.weightMultiplier;
                        isDirty = true;
                    }
                }
            }

            /** Ensure deleted items are cleaned up. */
            const newContents = itemData.container?.contents?.filter(x => this.actor.items.find(ownedItem => ownedItem.id === x.id));
            if (newContents?.length !== itemData.container?.contents?.length) {
                itemData.container.contents = newContents;
                isDirty = true;
            }

            // Test for ammunition slots
            if (item.type === "weapon" && itemData.capacity && itemData.capacity.max > 0) {
                const ammunitionStorageSlot = itemData.container.storage.find(x => x.acceptsType.includes("ammunition"));
                if (!ammunitionStorageSlot) {
                    itemData.container.storage.push({
                        type: "slot",
                        subtype: "ammunitionSlot",
                        amount: 1,
                        acceptsType: ["ammunition"],
                        affectsEncumbrance: true,
                        weightProperty: ""
                    });
                    isDirty = true;
                }
            }

            if (isDirty) {
                console.log("> Updating container settings for " + item.name);
                migrations.push({ _id: item.id, data: itemData});
            }
        }

        if (migrations.length > 0) {
            const result = this.actor.updateEmbeddedDocuments("Item", migrations);
            return result;
        }
        
        return null;
    }
}