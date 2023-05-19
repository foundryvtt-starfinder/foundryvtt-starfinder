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
            return item.rollAttack();
        case "damage":
        case "healing":
            return item.rollDamage();
        case "activate":
            return item.setActive(!item.isActive());
        case "use":
            return item.rollConsumable();
        default:
            return item.roll();
    }

}

Hooks.on("getHotbarEntryContext", (element, li) => {
    const viewActor = {
        name: "SFRPG.Macro.ViewActor",
        icon: "<i class=\"fas fa-user\"></i>",
        condition: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                return !!item.actor;
            }
        },
        callback: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                item.actor.sheet.render(true);
            }
        }
    };

    const viewItem = {
        name: "SFRPG.Macro.ViewItem",
        icon: "<i class=\"fas fa-suitcase\"></i>",
        condition: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                return !!fromUuidSync(itemMacroDetails?.itemUuid);
            }
        },
        callback: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                item.sheet.render(true);
            }
        }
    };

    li.push(viewActor, viewItem);
});
