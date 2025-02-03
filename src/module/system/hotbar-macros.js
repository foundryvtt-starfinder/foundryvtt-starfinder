import { ActorItemHelper, getChildItems } from "../actor/actor-inventory-utils.js";

const createMacroFnLookup = {
    Item: createItemMacro,
    SkillCheck: createSkillCheckMacro,
    SaveCheck: createSaveCheckMacro,
    AbilityCheck: createAbilityCheckMacro
};

Hooks.on("hotbarDrop", async (bar, data, slot) => {
    const createMacroFn = data && createMacroFnLookup[data.type];
    if (createMacroFn) {
        game.user.assignHotbarMacro(await createMacroFn(data), slot);
    } else {
        // silently ignore this hook, just in case someone else will pick it up.
    }
});

/**
 * Utility function for calling `Macro.create` only if an identical macro
 * doesn't already exist. If one does, return that one instead.
 *
 * @param {Object} data Macro creation description.
 * @returns {Promise<Macro>}
 */
function findElseCreateMacro(data) {
    const existingMacro = game.macros.contents
        .find(m => (m.name === data.name) && (m.command === data.command));

    return existingMacro
        ? Promise.resolve(existingMacro)
        : Macro.create(data, { displaySheet: false });
}

/**
 * Create a Macro form an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 *
 * @param {Object} data The item data
 * @returns {Promise<Macro>}
 */
async function createItemMacro(data) {
    const item = await Item.fromDropData(data);
    if (!item || !item.actor) return;

    let macroType = data?.macroType || "chatCard";
    if (macroType.includes("feat")) macroType = "activate";
    if (item.type === "spell") macroType = "cast";

    const macro = await findElseCreateMacro({
        name: item.name + (macroType !== "chatCard" ? ` (${game.i18n.localize(`SFRPG.ItemMacro.${macroType.capitalize()}`)})` : ""),
        type: "script",
        img: item.img,
        command: `game.sfrpg.rollItemMacro("${item.uuid}", "${macroType}");`,
        flags: {
            sfrpg: {
                actor: item.actor.uuid,
                itemMacro: {
                    itemUuid: item.uuid,
                    macroType: macroType
                }
            }
        }
    });
    connectToDocument(macro);
    return macro;
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
        if (!item) return ui.notifications.error(`Cannot find the item associated with this item macro.`);
        else {
            foundry.utils.logCompatibilityWarning("You are using an item macro which uses the item's name instead of its UUID. Support for these types of item macros will be removed in a future version of the SFRPG system. It is recommended to delete and re-create this item macro.", {since: "0.25"});
            return item;
        }

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
        case "cast":
            return item.useSpell();
        case "use":
            return item.rollConsumable({ event });
        default:
            return item.roll();
    }

}

const skillIconDefault = "icons/svg/d20.svg";
const skillIconLookup = {
    // Wanted: better icons
    acr: "icons/skills/movement/feet-winged-boots-brown.webp",
    ath: "icons/magic/control/buff-strength-muscle-damage-orange.webp",
    blu: "icons/sundries/gaming/playing-cards.webp",
    com: "systems/sfrpg/icons/equipment/technological items/datapad.webp",
    cul: "icons/commodities/treasure/bust-carved-stone.webp",
    dip: "icons/skills/social/diplomacy-handshake.webp",
    dis: "icons/magic/perception/silhouette-stealth-shadow.webp",
    eng: "icons/commodities/tech/blueprint.webp",
    int: "icons/magic/unholy/silhouette-evil-horned-giant.webp",
    lsc: "icons/commodities/gems/gem-amber-insect-orange.webp",
    med: "systems/sfrpg/icons/equipment/technological items/medkit-advanced.webp",
    mys: "icons/commodities/materials/parchment-secrets.webp",
    per: "icons/creatures/eyes/human-single-brown.webp",
    phs: "icons/tools/laboratory/vial-orange.webp",
    pil: "systems/sfrpg/icons/equipment/technological items/microgoggles.webp",
    pro: "systems/sfrpg/icons/equipment/goods/credstick.webp",
    sen: "icons/magic/perception/eye-ringed-glow-angry-teal.webp",
    sle: "icons/magic/air/air-smoke-casting.webp",
    ste: "icons/creatures/magical/humanoid-silhouette-dashing-blue.webp",
    sur: "icons/tools/navigation/map-plain-green.webp"
};

/**
 * Create a macro for a skill check
 *
 * @param {Object} data The skill check data
 * @returns {Promise<Macro>}
 */
async function createSkillCheckMacro(data) {
    const baseSkill = data.skill.substring(0, 3);
    return await findElseCreateMacro({
        name: game.i18n.format(`SFRPG.Rolls.Dice.${data.subname ? "SkillCheckTitleWithProfession" : "SkillCheckTitle"}`, {
            skill: CONFIG.SFRPG.skills[baseSkill],
            profession: data.subname
        }),
        type: "script",
        img: skillIconLookup[baseSkill] ?? skillIconDefault,
        command: `fromUuidSync(${JSON.stringify(data.actor)}).rollSkill(${JSON.stringify(data.skill)})`,
        flags: {
            sfrpg: {
                actor: data.actor
            }
        }
    });
}

const saveIconDefault = "icons/svg/d20.svg";
const saveIconLookup = {
    // Wanted: better icons
    fort:   "icons/skills/social/intimidation-impressing.webp",
    reflex: "icons/skills/movement/feet-winged-boots-brown.webp",
    will:   "icons/magic/holy/meditation-chi-focus-blue.webp"
};

/**
 * Create a macro for saves
 *
 * @param {Object} data The save data
 * @returns {Promise<Macro>}
 */
async function createSaveCheckMacro(data) {
    return await findElseCreateMacro({
        name: game.i18n.format("SFRPG.Rolls.Dice.SaveTitle", {
            label: CONFIG.SFRPG.saves[data.save]
        }),
        type: "script",
        img: saveIconLookup[data.save] ?? saveIconDefault,
        command: `fromUuidSync(${JSON.stringify(data.actor)}).rollSave(${JSON.stringify(data.save)})`,
        flags: {
            sfrpg: {
                actor: data.actor
            }
        }
    });
}

const abilityIconDefault = "icons/svg/d20.svg";
const abilityIconLookup = {
    // Wanted: better icons
    str: "icons/magic/control/buff-strength-muscle-damage-orange.webp",
    dex: "icons/skills/movement/feet-winged-boots-brown.webp",
    con: "icons/magic/life/heart-area-circle-red-green.webp",
    int: "icons/tools/scribal/spectacles-glasses.webp",
    wis: "icons/commodities/treasure/figurine-owl.webp",
    cha: "icons/skills/social/thumbsup-approval-like.webp"
};

/**
 * Create a macro for ability checks
 *
 * @param {Object} data The ability data
 * @returns {Promise<Macro>}
 */
async function createAbilityCheckMacro(data) {
    return await findElseCreateMacro({
        name: game.i18n.format("SFRPG.Rolls.Dice.AbilityCheckTitle", {
            label: CONFIG.SFRPG.abilities[data.ability]
        }),
        type: "script",
        img: abilityIconLookup[data.ability] ?? abilityIconDefault,
        command: `fromUuidSync(${JSON.stringify(data.actor)}).rollAbility(${JSON.stringify(data.ability)})`,
        flags: {
            sfrpg: {
                actor: data.actor
            }
        }
    });
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
