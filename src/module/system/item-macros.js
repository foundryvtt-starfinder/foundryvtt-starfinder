import { ActorItemHelper, getChildItems } from "../actor/actor-inventory-utils.js";

Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type !== "Item") return;
    createItemMacro(data, slot);
    return false;
});

/**
 * Create a Macro form an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 *
 * @param {Object} data The item data
 * @param {number} slot The hotbar slot to use
 * @returns {Promise}
 */
export async function createItemMacro(data, slot) {
    const item = await Item.fromDropData(data);
    if (!item || !item.actor) return;

    let macroType = data?.macroType || "chatCard";
    if (macroType.includes("feat")) macroType = "activate";

    const command = `game.sfrpg.rollItemMacro("${item.uuid}", "${macroType}");`;
    let macro = game.macros.contents.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name + (macroType !== "chatCard" ? ` (${game.i18n.localize(`SFRPG.ItemMacro.${macroType.capitalize()}`)})` : ""),
            type: "script",
            img: item.img,
            command: command,
            flags: {
                sfrpg: {
                    itemMacro: {
                        itemUuid: item.uuid,
                        macroType: macroType
                    }
                }
            }
        }, {displaySheet: false});
    }

    connectToDocument(macro);
    game.user.assignHotbarMacro(macro, slot);

}

export function rollItemMacro(itemUuid, macroType) {

    const item = (() => {
        // New item macros will be created with the first argument as their uuid
        const uuidItem = fromUuidSync(itemUuid);
        if (uuidItem) return uuidItem;

        // For backward compatibility's sake, fallback to the old method of searching by name.
        /** @todo Remove this at some point */
        const speaker = ChatMessage.getSpeaker();
        let actor;

        if (speaker.token) actor = game.actors.tokens[speaker.token];
        if (!actor) actor = game.actors.get(speaker.actor);
        const item = actor ? actor.items.find(i => i.name === itemUuid) : null;
        if (!item)  return ui.notifications.warn(`Your controlled Actor does not have an item valid for this item macro.`);
        else return item;

    })();

    if (!item) return;

    switch (macroType) {
        case "attack":
            return item.rollAttack({ event });
        case "damage":
        case "healing":
            return item.rollDamage({ event });
        case "activate":
            return item.setActive(!item.isActive());
        case "reload":
            return item.reload();
        case "use":
            return item.rollConsumable({ event });
        default:
            return item.roll();
    }

}

/**
 * Find the corresponding item of an item macro, and listen for updates on it and any child items.
 * @param {Macro} macro A macro to search for the corresponding item with.
 * @returns {Boolean} True if any items successfully connected, otherwise false.
 */
export function connectToDocument(macro) {
    const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;

    if (itemMacroDetails?.itemUuid) {
        const item = fromUuidSync(itemMacroDetails?.itemUuid);
        if (!item || !item.actor) return false;
        item.apps[ui.hotbar.appId] = ui.hotbar;

        // Attacking with a weapon with ammo triggers an update on the ammo, not the weapon, so listen to the ammo too.
        const childItems = _getChildItems(item);
        if (!childItems?.length) return;
        for (const child of childItems) {
            child.apps[ui.hotbar.appId] = ui.hotbar;
        }

        return true;
    } else {
        return false;
    }

}

function _getChildItems(item) {
    if (!item.requiresCapacityItem()) {
        return null;
    }

    // Create actor item helper
    const tokenId = item.actor.isToken ? item.actor.token.id : null;
    const sceneId = item.actor.isToken ? item.actor.token.parent.id : null;
    // Pass the actor through on the options object so the constructor doesn't have to try (and fail) and fetch the actor from the compendium.
    const itemHelper = new ActorItemHelper(item.actor.id, tokenId, sceneId, { actor: item.actor });

    return getChildItems(itemHelper, item);

}

// Before deleting an item, remove it from the hotbar's apps, so the delete method doesn't close the hotbar.
Hooks.on("preDeleteItem", (item) => {
    delete item.apps[ui.hotbar.appId];
});

// Add update listeners to all child items whenever an item is updated, in case any child items were swapped.
Hooks.on("updateItem", (item) => {
    if (item.apps[ui.hotbar.appId]) {
        const childItems = _getChildItems(item);
        if (!childItems?.length) return;

        for (const child of childItems) {
            if (child.apps[ui.hotbar.appId]) continue;
            child.apps[ui.hotbar.appId] = ui.hotbar;
        }
    }
});
