import { ActorItemHelper, moveItemBetweenActorsAsync, onCreateItemCollection } from "../actor/actor-inventory-utils.js";
import { ItemCollectionSheet } from "../apps/item-collection-sheet.js";

import { RPC } from "../rpc.js";

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
    if (getProperty(document, "flags.sfrpg.itemCollection")) {
        const token = canvas.tokens.placeables.find(x => x.id === document.id);
        if (token) {
            trySetupLootToken(token);
        }
    }
}

function onTokenUpdated(document, options, userId) {
    if (!canvas.initialized) { return; }
    if (getProperty(document, "flags.sfrpg.itemCollection")) {
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
 * Measure the distance between two pixel coordinates
 * See BaseGrid.measureDistance for more details
 *
 * @param segments
 * @param options
 */
export const measureDistances = (segments, options = {}) => {
    if (!options.gridSpaces) return BaseGrid.prototype.measureDistances.call(this, segments, options);

    // Track the total number of diagonals
    const diagonalRule = game.settings.get("sfrpg", "diagonalMovement");
    const state = { diagonals: 0 };

    // Iterate over measured segments
    return segments.map((s) => measureDistance(null, null, { ray: s.ray, diagonalRule, state }));
};

/**
 * Measure distance between two points.
 *
 * @param {Point} p0 Start point on canvas
 * @param {Point} p1 End point on canvas
 * @param {object} options Measuring options.
 * @param {"5105"|"555"} [options.diagonalRule] Used diagonal rule. Defaults to 5/10/5
 * @param {Ray} [options.ray] Pre-generated ray to use instead of the points.
 * @param {MeasureState} [options.state] Optional state tracking across multiple measures.
 *
 * @returns {number} Grid distance between the two points.
 */
export const measureDistance = (
    p0,
    p1,
    { ray = null, diagonalRule = "5105", state = { diagonals: 0, cells: 0 } } = {}
) => {

    ray ??= new Ray(p0, p1);
    const gs = canvas.dimensions.size,
        nx = Math.ceil(Math.abs(ray.dx / gs)),
        ny = Math.ceil(Math.abs(ray.dy / gs));

    // Get the number of straight and diagonal moves
    const nDiagonal = Math.min(nx, ny),
        nStraight = Math.abs(ny - nx);

    state.diagonals += nDiagonal;

    let cells = 0;

    if (diagonalRule === "5105") {
        const nd10 = Math.floor(state.diagonals / 2) - Math.floor((state.diagonals - nDiagonal) / 2);
        cells = nd10 * 2 + (nDiagonal - nd10) + nStraight;
    } else cells = nStraight + nDiagonal;

    state.cells += cells;
    return cells * canvas.dimensions.distance;
};

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
        if (item.system.equipped) {
            item.system.equipped = false;
        }
    }

    const msg = {
        itemData: itemData,
        position: {x: x, y: y},
        settings: {
            deleteIfEmpty: deleteIfEmpty,
            locked: false
        }
    };

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
    if (relevantToken.document.flags.sfrpg.itemCollection.locked && !game.user.isGM) {
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
    const sourceItemData = foundry.utils.duplicate(document.system);

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
        const transferringItems = [sourceItem];
        if (sourceActor !== null && sourceItemData.container?.contents && sourceItemData.container.contents.length > 0) {
            const containersToTest = [sourceItemData];
            while (containersToTest.length > 0) {
                const container = containersToTest.shift();
                const children = sourceActor.filterItems(x => container.container.contents.find(y => y.id === x.id));
                if (children) {
                    for (const child of children) {
                        transferringItems.push(child);

                        if (child.system.container?.contents && child.system.container.contents.length > 0) {
                            containersToTest.push(child);
                        }
                    }
                }
            }
        }
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

    const target = new ActorItemHelper(targetActor.id, targetActor.token.id, targetActor.token.parent.id);

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
        // console.log("Canvas::handleItemDrop()");

        handleCanvasDropAsync(canvas, data).then(_ => {});
        return false;
    }

    return true;
}
