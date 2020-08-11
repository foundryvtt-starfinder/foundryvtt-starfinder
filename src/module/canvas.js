import { moveItemBetweenActorsAsync } from "./actor/actor-inventory.js";

/**
 * Override the default Grid measurement function to add additional distance for subsequent diagonal moves
 * See BaseGrid.measureDistance for more details.
 * 
 * @param {Object[]} segments The starting position
 * @param {Object} options The ending position
 * @returns {Number[]} An Array of distance measurmements for each segment
 */
export const measureDistances = function(segments, options={}) {
    if (!options.gridSpaces) return BaseGrid.prototype.measureDistance.call(this, segments, options);

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

export async function handleItemDrop(data) {
    console.log("Canvas::handleItemDrop()");
    
    // Potential sources:
    // Actor sheet, Token Actor sheet (May be linked to an Actor), Sidebar Item, Compendium
    let sourceActor = null;
    let sourceItem = null;
    let sourceItemData = null;
    if ("pack" in data) {
        // Source is compendium
        console.log("> Dragged item from compendium: " + data.pack);
        const pack = game.packs.get(data.pack);
        sourceItemData = await pack.getEntry(data.id);
    } else if ("tokenId" in data) {
        // Source is token sheet
        console.log("> Dragged item from token: " + data.tokenId);
        let sourceToken = canvas.tokens.get(data.tokenId);
        if (!sourceToken) {
            ui.notifications.info(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
            return;
        }
        sourceActor = sourceToken.actor;
        sourceItemData = data.data;
        sourceItem = sourceActor.items.get(sourceItemData._id);
    } else if ("actorId" in data) {
        // Source is actor sheet
        console.log("> Dragged item from actor: " + data.actorId);
        sourceActor = game.actors.get(data.actorId);
        sourceItemData = data.data;
        sourceItem = sourceActor.items.get(sourceItemData._id);
    } else if ("id" in data) {
        // Source is sidebar
        console.log("> Dragged item from sidebar: " + data.id);
        sourceItem = game.items.get(data.id);
        sourceItemData = sourceItem.data;
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
	for (let p of canvas.tokens.placeables) {
		if (data.x < p.x + p.width && data.x > p.x && data.y < p.y + p.height && data.y > p.y && p instanceof Token) {
			targetActor = p.actor;
			break;
		}
    }

    // Create a placeable instead and do item transferral there.
    if (targetActor === null) {
        ui.notifications.info(game.i18n.format("SFRPG.Canvas.Interface.NoTargetTokenForItemDrop"));
        return;
    }

    if (sourceItem) {
        await moveItemBetweenActorsAsync(sourceActor, sourceItem, targetActor);
    } else {
        await targetActor.createOwnedItem(sourceItemData);
    }
}