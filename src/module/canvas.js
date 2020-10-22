import { moveItemBetweenActorsAsync, ActorItemHelper } from "./actor/actor-inventory.js";
import { ItemCollectionSheet } from "./apps/item-collection-sheet.js";

import { RPC } from "./rpc.js"

Hooks.on('canvasReady', onCanvasReady);
Hooks.on('createToken', onTokenCreated);
Hooks.on('updateToken', onTokenUpdated);

function onCanvasReady(...args) {
    for (let placeable of canvas.tokens.placeables) {
		if (placeable.getFlag("sfrpg", "itemCollection")) {
            setupLootCollectionTokenInteraction(placeable);
        }
    }
}

async function onTokenCreated(scene, tokenData, tokenFlags, userId) {
    if (getProperty(tokenData, "flags.sfrpg.itemCollection")) {
        const token = canvas.tokens.placeables.find(x => x.id === tokenData._id);

        await new Promise(resolve => setTimeout(resolve, 25));

        setupLootCollectionTokenInteraction(token);
        
        for (let appId in token.apps) {
            let app = token.apps[appId];
            app.render(true);
        }
    }
}

async function onTokenUpdated(scene, tokenData, tokenFlags, userId) {
    if (getProperty(tokenData, "flags.sfrpg.itemCollection")) {
        const token = canvas.tokens.placeables.find(x => x.id === tokenData._id);

        await new Promise(resolve => setTimeout(resolve, 25));

        setupLootCollectionTokenInteraction(token);
        
        for (let appId in token.apps) {
            let app = token.apps[appId];
            app.render(true);
        }
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
    if (!options?.gridSpaces) return BaseGrid.prototype.measureDistances.call(this, segments, options);

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

        else return (ns + nd) * canvas.scene.data.gridDistance;
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

export async function handleItemDropCanvas(data) {
    //console.log("Canvas::handleItemDrop()");
    
    // Potential sources:
    // Actor sheet, Token Actor sheet (May be linked to an Actor), Sidebar Item, Compendium
    let sourceActor = null;
    let sourceItem = null;
    let sourceItemData = null;
    if ("pack" in data) {
        // Source is compendium
        //console.log("> Dragged item from compendium: " + data.pack);
        const pack = game.packs.get(data.pack);
        sourceItemData = duplicate(await pack.getEntry(data.id));
    } else if ("tokenId" in data) {
        // Source is token sheet
        //console.log("> Dragged item from token: " + data.tokenId);
        let sourceToken = canvas.tokens.get(data.tokenId);
        if (!sourceToken) {
            ui.notifications.info(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
            return;
        }
        sourceActor = new ActorItemHelper(sourceToken.actor._id, sourceToken.id, sourceToken.scene.id);
        sourceItemData = duplicate(data.data);
        sourceItem = sourceActor.getOwnedItem(sourceItemData._id);
    } else if ("actorId" in data) {
        // Source is actor sheet
        //console.log("> Dragged item from actor: " + data.actorId);
        sourceActor = new ActorItemHelper(data.actorId, null, null);
        sourceItemData = duplicate(data.data);
        sourceItem = sourceActor.getOwnedItem(sourceItemData._id);
    } else if ("id" in data) {
        // Source is sidebar
        //console.log("> Dragged item from sidebar: " + data.id);
        sourceItem = game.items.get(data.id);
        sourceItemData = duplicate(sourceItem.data);
    } else {
        // Source is anywhere else
        // TODO: Check what dragging from placable menu will look like
        console.log("> Dragged item from unknown source!");
        console.log(event);
        console.log(data);
        return;
    }

    // Potential targets:
    // Canvas (floor), Token Actor (may be linked)
    let targetActor = null;
	for (let placeable of canvas.tokens.placeables) {
		if (data.x < placeable.x + placeable.width && data.x > placeable.x && data.y < placeable.y + placeable.height && data.y > placeable.y && placeable instanceof Token) {
			targetActor = placeable.actor;
			break;
		}
    }

    // Create a placeable instead and do item transferral there.
    if (targetActor === null) {
        let itemData = [sourceItemData];
        if (sourceActor !== null && sourceItemData.data.container?.contents && sourceItemData.data.container.contents.length > 0) {
            let containersToTest = [sourceItemData];
            while (containersToTest.length > 0)
            {
                let container = containersToTest.shift();
                let children = sourceActor.filterItems(x => container.data.container.contents.find(y => y.id === x._id));
                if (children) {
                    for (let child of children) {
                        itemData.push(child.data);

                        if (child.data.data.container?.contents && child.data.data.container.contents.length > 0) {
                            containersToTest.push(child.data);
                        }
                    }
                }
            }
        }

        await placeItemCollectionOnCanvas(data.x, data.y, itemData, true);

        // Now remove old items
        if (sourceActor) {
            let idsToDrop = [];
            for (let droppedItem of itemData) {
                idsToDrop.push(droppedItem._id);
            }
            await sourceActor.deleteOwnedItem(idsToDrop);
        }

        return true;
    }

    let target = new ActorItemHelper(targetActor._id, targetActor.token.id, targetActor.token.scene.id)

    if (sourceItem) {
        await moveItemBetweenActorsAsync(sourceActor, sourceItem, target);
    } else {
        await targetActor.createOwnedItem(sourceItemData);
    }
}

/**
 * Places an item collection on the canvas as a token for players to interact with.
 * 
 * @param {Integer} x X Coordinate to place the item at.
 * @param {Integer} y Y Coordinate to place the item at.
 * @param {Boolean} deleteIfEmpty Should this Token be deleted when its last item is removed?
 * @param {Object} itemData Either a single item data, or an array of item data, that are to be placed on the currently active canvas.
 */
async function placeItemCollectionOnCanvas(x, y, itemData, deleteIfEmpty) {
    if (!itemData) {
        return;
    }

    if (!(itemData instanceof Array)) {
        itemData = [itemData];
    }

    for (let item of itemData) {
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

    RPC.sendMessageTo("gm", "createItemCollection", msg);
}

function setupLootCollectionTokenInteraction(lootCollectionToken) {
    lootCollectionToken.mouseInteractionManager.callbacks.clickLeft2 = openLootCollectionSheet.bind(lootCollectionToken);
    lootCollectionToken.mouseInteractionManager.permissions.clickLeft2 = () => true;
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
    
    relevantToken.hasPerm = () => true;
    const lootCollectionSheet = new ItemCollectionSheet(relevantToken);
    lootCollectionSheet.render(true);
}