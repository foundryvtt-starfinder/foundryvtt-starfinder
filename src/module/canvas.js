import { moveItemBetweenActorsAsync, onCreateItemCollection, ActorItemHelper } from "./actor/actor-inventory-utils.js";
import { ItemCollectionSheet } from "./apps/item-collection-sheet.js";

import { RPC } from "./rpc.js"

Hooks.on('canvasReady', onCanvasReady);
Hooks.on('createToken', onTokenCreated);
Hooks.on('updateToken', onTokenUpdated);

function onCanvasReady(...args) {
    if (!canvas.initialized) { return; }
    for (const placeable of canvas.tokens.placeables) {
		if (placeable.document.getFlag("sfrpg", "itemCollection")) {
            setupLootCollectionTokenInteraction(placeable, false);
        }
    }
}

function onTokenCreated(document, options, userId) {
    if (!canvas.initialized) { return; }
    if (getProperty(document.data, "flags.sfrpg.itemCollection")) {
        const token = canvas.tokens.placeables.find(x => x.id === document.id);
        if (token) {
            trySetupLootToken(token);
        }
    }
}

function onTokenUpdated(document, options, userId) {
    if (!canvas.initialized) { return; }
    if (getProperty(document.data, "flags.sfrpg.itemCollection")) {
        const token = canvas.tokens.placeables.find(x => x.id === document.id);
        if (token) {
            trySetupLootToken(token);
        }
    }
}

function trySetupLootToken(token) {
    if (token.mouseInteractionManager) {
        setupLootCollectionTokenInteraction(token, true);
    } else {
        const waitForInteraction = new Promise(resolve => setTimeout(resolve, 25));
        waitForInteraction.then(() => trySetupLootToken(token));
    }
}

/**
 * Override the default Grid measurement function to add additional distance for subsequent diagonal moves
 * See BaseGrid.measureDistance for more details.
 * 
 * @param {Object[]} segments The starting position
 * @param {Object} options The ending position
 * @returns {Number[]} An Array of distance measurmements for each segment
 */
export const measureDistances = function(segments, options={}) {
    if (!canvas.initialized) { return; }
    if (!options?.gridSpaces) {
        return BaseGrid.prototype.measureDistances.call(this, segments, options);
    }

    let nDiagonal = 0;
    const rule = this.parent.diagonalRule;
    const d = canvas.dimensions;
    
    return segments.map(s => {
        let r = s.ray;

        let nx = Math.abs(Math.ceil(r.dx / d.size));
        let ny = Math.abs(Math.ceil(r.dy / d.size));

        let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);
        nDiagonal += nd;

        if (rule === "5105") {
            let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
            let spaces = (nd10 * 2) + (nd - nd10) + ns;
            return spaces * canvas.dimensions.distance;
        }

        return (ns + nd) * canvas.scene.data.gridDistance;
    });
};

/**
 * Hijack Token health bar rendering to include temporary and temp-max health in the bar display
 * TODO: This should probably be replaced with a formal Token Class extension
 */
const _TokenGetBarAttribute = Token.prototype.getBarAttribute;
export const getBarAttribute = function (...args) {
    const data = _TokenGetBarAttribute.bind(this)(...args);
    if (data && data.attribute === "attributes.hp") {
        data.value += parseInt(data['temp'] || 0);
        data.max += parseInt(data['tempmax'] || 0);
    }

    return data;
}

/**
 * Places an item collection on the canvas as a token for players to interact with.
 * 
 * @param {Integer} x X Coordinate to place the item at.
 * @param {Integer} y Y Coordinate to place the item at.
 * @param {Boolean} deleteIfEmpty Should this Token be deleted when its last item is removed?
 * @param {Object} itemData Either a single item data, or an array of item data, that are to be placed on the currently active canvas.
 */
function placeItemCollectionOnCanvas(x, y, itemData, deleteIfEmpty) {
    if (!itemData) {
        return false;
    }

    if (!(itemData instanceof Array)) {
        itemData = [itemData];
    }

    for (const item of itemData) {
        if (item.data.equipped) {
            item.data.equipped = false;
        }
    }

    const msg = {
        itemData: itemData,
        position: {x: x, y: y},
        settings: {
            deleteIfEmpty: deleteIfEmpty,
            locked: false
        }
    }

    if (game.user.isGM) {
        const messageData = {
            payload: msg
        };
        return onCreateItemCollection(messageData);
    } else {
        const result = RPC.sendMessageTo("gm", "createItemCollection", msg);
        if (result === "errorRecipientNotAvailable") {
            ui.notifications.error(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.ItemCollectionNoGMError"));
            return false;
        }
    }
    return true;
}

function setupLootCollectionTokenInteraction(lootCollectionToken, updateApps = false) {
    lootCollectionToken.mouseInteractionManager.callbacks.clickLeft2 = openLootCollectionSheet.bind(lootCollectionToken);
    lootCollectionToken.mouseInteractionManager.permissions.clickLeft2 = () => true;

    if (updateApps) {
        for (const appId in lootCollectionToken.apps) {
            const app = lootCollectionToken.apps[appId];
            app.render(true);
        }
    }
}

function openLootCollectionSheet(event) {
    const relevantToken = this;
    if (relevantToken.data.flags.sfrpg.itemCollection.locked && !game.user.isGM) {
        ui.notifications.info(game.i18n.format("SFRPG.ItemCollectionSheet.ItemCollectionLocked"));
        return;
    }

    if (!relevantToken.apps) {
        relevantToken.apps = {};
    }
    
    const lootCollectionSheet = new ItemCollectionSheet(relevantToken.document);
    lootCollectionSheet.options.viewPermission = -1;
    lootCollectionSheet.render(true);
}

async function handleCanvasDropAsync(canvas, data) {
    const document = await Item.fromDropData(data);
    let sourceActor = null;
    const sourceItem = document;
    const sourceItemData = foundry.utils.duplicate(document.data);

    if (document?.parent?.isToken ?? false) {
        sourceActor = new ActorItemHelper(document.parent._id, document.parent.parent._id, document.parent.parent.parent._id);
    } else if (document?.parent ?? false) {
        sourceActor = new ActorItemHelper(document.parent._id);
    }

    // Potential targets:
    // Canvas (floor), Token Actor (may be linked)
    let targetActor = null;
    for (const placeable of canvas.tokens.placeables) {
        if (data.x < placeable.x + placeable.width && data.x > placeable.x && data.y < placeable.y + placeable.height && data.y > placeable.y && placeable instanceof Token) {
            targetActor = placeable.actor;
            break;
        }
    }

    // Create a placeable instead and do item transferral there.
    if (targetActor === null) {
        let transferringItems = [sourceItemData];
        if (sourceActor !== null && sourceItemData.system.container?.contents && sourceItemData.system.container.contents.length > 0) {
            const containersToTest = [sourceItemData];
            while (containersToTest.length > 0)
            {
                const container = containersToTest.shift();
                const children = sourceActor.filterItems(x => container.data.container.contents.find(y => y.id === x.id));
                if (children) {
                    for (const child of children) {
                        transferringItems.push(child.data);

                        if (child.data.data.container?.contents && child.data.data.container.contents.length > 0) {
                            containersToTest.push(child.data);
                        }
                    }
                }
            }
        }
        transferringItems = transferringItems.map(x => { //"rename" .system to .data so placeItemCollectionOnCanvas reads it correctly.
            x.data = x.system;
            return x;
        });
        const hasDropped = placeItemCollectionOnCanvas(data.x, data.y, transferringItems, true);
        if (hasDropped) {
            // Remove old items
            if (sourceActor) {
                const idsToDrop = [];
                for (const droppedItem of transferringItems) {
                    idsToDrop.push(droppedItem._id);
                }
                sourceActor.deleteItem(idsToDrop);
            }
        }
        
        return;
    }

    const target = new ActorItemHelper(targetActor.id, targetActor.token.id, targetActor.token.parent.id)

    if (sourceItem) {
        moveItemBetweenActorsAsync(sourceActor, sourceItem, target);
    } else {
        target.createItem(sourceItemData);
    }
}

export function canvasHandlerV10(canvas, data) {
    // We're only interested in overriding item drops.
    if (!data || (data.type !== "Item" && data.type !== "ItemCollection")) {
        return true;
    }

    if (data.type === "Item") {
        if (!canvas.initialized) { return true; }
        //console.log("Canvas::handleItemDrop()");
        
        handleCanvasDropAsync(canvas, data).then(_ => {});
        return false;
    }
    
    return true;
}