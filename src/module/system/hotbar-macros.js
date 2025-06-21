import { ActorItemHelper, getChildItems } from "../actor/actor-inventory-utils.js";
import { checkIcons } from "./enrichers/check.js";

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
async function findElseCreateMacro(data) {
    return game.macros.find(macro => (macro.name === data.name) && (macro.command === data.command))
        ?? Macro.create(data, { displaySheet: false });
}

/**
 * Create a Macro form an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 *
 * @param {Object} data The item data
 * @returns {Promise<Macro|null>}
 */
async function createItemMacro(data) {
    let macro = null;

    const item = await Item.fromDropData(data);
    if (item && item.actor) {
        let macroType = data.macroType || "chatCard";
        if (macroType.includes("feat")) macroType = "activate";
        if (item.type === "spell") macroType = "cast";

        macro = await findElseCreateMacro({
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
    }

    return macro;
}

export function rollItemMacro(itemUuid, macroType) {
    let item = fromUuidSync(itemUuid);
    if (!item) {
        // For backward compatibility's sake, fallback to the old method of searching by name.
        /** @todo Remove this at some point */

        const speaker = ChatMessage.getSpeaker();
        const actor = undefined
            || (speaker.token && game.actors.tokens[speaker.token])
            || (speaker.actor && game.actors.get(speaker.actor))
        ;

        if (actor) {
            item = actor.items.find(i => i.name === itemUuid);
            if (item) {
                foundry.utils.logCompatibilityWarning("You are using an item macro which uses the item's name instead of its UUID. Support for these types of item macros will be removed in a future version of the SFRPG system. It is recommended to delete and re-create this item macro.", {since: "0.25"});
            }
        }
    }

    if (!item) {
        return ui.notifications.error(`Cannot find the item associated with this item macro.`);
    } else switch (macroType) {
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
    // NOTE: If you're here because an icon is broken, try running `scripts/fa-svg-update/fa-svg-update.js`
    acr: `systems/sfrpg/icons/fa-svg/${checkIcons["acrobatics"]}.svg`,
    ath: `systems/sfrpg/icons/fa-svg/${checkIcons["athletics"]}.svg`,
    blu: `systems/sfrpg/icons/fa-svg/${checkIcons["bluff"]}.svg`,
    com: `systems/sfrpg/icons/fa-svg/${checkIcons["computers"]}.svg`,
    cul: `systems/sfrpg/icons/fa-svg/${checkIcons["culture"]}.svg`,
    dip: `systems/sfrpg/icons/fa-svg/${checkIcons["diplomacy"]}.svg`,
    dis: `systems/sfrpg/icons/fa-svg/${checkIcons["disguise"]}.svg`,
    eng: `systems/sfrpg/icons/fa-svg/${checkIcons["engineering"]}.svg`,
    int: `systems/sfrpg/icons/fa-svg/${checkIcons["intimidate"]}.svg`,
    lsc: `systems/sfrpg/icons/fa-svg/${checkIcons["life-science"]}.svg`,
    med: `systems/sfrpg/icons/fa-svg/${checkIcons["medicine"]}.svg`,
    mys: `systems/sfrpg/icons/fa-svg/${checkIcons["mysticism"]}.svg`,
    per: `systems/sfrpg/icons/fa-svg/${checkIcons["perception"]}.svg`,
    phs: `systems/sfrpg/icons/fa-svg/${checkIcons["physical-science"]}.svg`,
    pil: `systems/sfrpg/icons/fa-svg/${checkIcons["piloting"]}.svg`,
    pro: `systems/sfrpg/icons/fa-svg/${checkIcons["profession"]}.svg`,
    sen: `systems/sfrpg/icons/fa-svg/${checkIcons["sense-motive"]}.svg`,
    sle: `systems/sfrpg/icons/fa-svg/${checkIcons["sleight-of-hand"]}.svg`,
    ste: `systems/sfrpg/icons/fa-svg/${checkIcons["stealth"]}.svg`,
    sur: `systems/sfrpg/icons/fa-svg/${checkIcons["survival"]}.svg`
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
    // NOTE: If you're here because an icon is broken, try running `scripts/fa-svg-update/fa-svg-update.js`
    fort:   `systems/sfrpg/icons/fa-svg/${checkIcons["fortitude"]}.svg`,
    reflex: `systems/sfrpg/icons/fa-svg/${checkIcons["reflex"]}.svg`,
    will:   `systems/sfrpg/icons/fa-svg/${checkIcons["will"]}.svg`
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
    // NOTE: If you're here because an icon is broken, try running `scripts/fa-svg-update/fa-svg-update.js`
    str: `systems/sfrpg/icons/fa-svg/${checkIcons["strength"]}.svg`,
    dex: `systems/sfrpg/icons/fa-svg/${checkIcons["dexterity"]}.svg`,
    con: `systems/sfrpg/icons/fa-svg/${checkIcons["constitution"]}.svg`,
    int: `systems/sfrpg/icons/fa-svg/${checkIcons["intelligence"]}.svg`,
    wis: `systems/sfrpg/icons/fa-svg/${checkIcons["wisdom"]}.svg`,
    cha: `systems/sfrpg/icons/fa-svg/${checkIcons["charisma"]}.svg`
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
