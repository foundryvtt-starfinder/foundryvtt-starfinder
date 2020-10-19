/**
 * The Starfinder game system for Foundry Virtual Tabletop
 * Author: wildj79
 * Software License: MIT
 * Content License: OGL v1.0a
 * Repository: https://github.com/wildj79/foundryvtt-starfinder
 * Issue Tracker: https://github.com/wildj79/foundryvtt-starfinder/issues
 */
import { SFRPG } from "./module/config.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { registerSystemSettings } from "./module/settings.js";
import { measureDistances, getBarAttribute, handleItemDropCanvas } from "./module/canvas.js";
import { ActorSFRPG } from "./module/actor/actor.js";
import { initializeRemoteInventory, ActorItemHelper } from "./module/actor/actor-inventory.js";
import { ActorSheetSFRPGCharacter } from "./module/actor/sheet/character.js";
import { ActorSheetSFRPGNPC } from "./module/actor/sheet/npc.js";
import { ActorSheetSFRPGStarship } from "./module/actor/sheet/starship.js";
import { ActorSheetSFRPGVehicle } from "./module/actor/sheet/vehicle.js";
import { ActorSheetSFRPGDrone } from "./module/actor/sheet/drone.js";
import { ItemSFRPG } from "./module/item/item.js";
import { CombatSFRPG } from "./module/combat/combat.js";
import { ItemSheetSFRPG } from "./module/item/sheet.js";
import { highlightCriticalSuccessFailure } from "./module/dice.js";
import { _getInitiativeFormula, addChatMessageContextOptions } from "./module/combat.js";
import Engine from "./module/engine/engine.js";
import registerSystemRules from "./module/rules.js";
import { SFRPGModifierTypes, SFRPGModifierType, SFRPGEffectType } from "./module/modifiers/types.js";
import SFRPGModifier from "./module/modifiers/modifier.js";
import { generateUUID } from "./module/utilities.js";
import migrateWorld from './module/migration.js';
import CounterManagement from "./module/classes/counter-management.js";
import templateOverrides from "./module/template-overrides.js";
import { computeCompoundBulkForItem } from "./module/actor/actor-inventory.js"
import { RPC } from "./module/rpc.js"
import { DiceSFRPG } from './module/dice.js'

import { } from "./module/packs/browsers.js"
import { } from "./module/combat/combat.js"

let defaultDropHandler = null;

Hooks.once('init', async function () {
    console.log(`SFRPG | Initializing the Starfinder System`);
    console.log(
`__________________________________________________
 ____  _              __ _           _
/ ___|| |_ __ _ _ __ / _(_)_ __   __| | ___ _ __
\\___ \\| __/ _\` | '__| |_| | '_ \\ / _\` |/ _ \\ '__|
 ___) | || (_| | |  |  _| | | | | (_| |  __/ |
|____/ \\__\\__,_|_|  |_| |_|_| |_|\\__,_|\\___|_|
==================================================`
    );

    console.log("SFRPG | Initializing the rules engine");
    const engine = new Engine();

    game.sfrpg = {
        rollItemMacro,
        engine,
        SFRPGModifierType: SFRPGModifierType,
        SFRPGEffectType: SFRPGEffectType,
        SFRPGModifierTypes: SFRPGModifierTypes,
        SFRPGModifier: SFRPGModifier,
        generateUUID,
        migrateWorld,
        dice: DiceSFRPG
    };

    CONFIG.SFRPG = SFRPG;
    CONFIG.Actor.entityClass = ActorSFRPG;
    CONFIG.Item.entityClass = ItemSFRPG;
    CONFIG.Combat.entityClass = CombatSFRPG;

    CONFIG.statusEffects = CONFIG.SFRPG.statusEffectIcons;

    CONFIG.fontFamilies.push("Exo 2");
    CONFIG.defaultFontFamily = "Exo 2";

    CONFIG.canvasTextStyle = new PIXI.TextStyle({
        fontFamily: "Exo 2",
        fontSize: 36,
        fill: "#FFFFFF",
        stroke: "#111111",
        strokeTickness: 1,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
        align: "center",
        wordWrap: false
    });

    registerSystemSettings();

    await preloadHandlebarsTemplates();

    Combat.prototype._getInitiativeFormula = _getInitiativeFormula;
    templateOverrides();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("sfrpg", ActorSheetSFRPGCharacter, { types: ["character"], makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGNPC, { types: ["npc"], makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGStarship, { types: ["starship"], makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGVehicle, { types: ["vehicle"], makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGDrone, { types: ["drone"], makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("sfrpg", ItemSheetSFRPG, { makeDefault: true });

    /**
     * Manage counter classe feature from combat tracker
     * Like Solarian Attenument / Vanguard Entropic Point and Soldat Ki Point
    **/
    let counterManagement = new CounterManagement();
    counterManagement.startup();
});

Hooks.once("setup", function () {
    const toLocalize = [
        "abilities", "alignments", "distanceUnits", "senses", "skills", "currencies", "saves",
        "augmentationTypes", "augmentationSytems", "itemActionTypes", "actorSizes", "starshipSizes",
        "vehicleSizes", "babProgression", "saveProgression", "saveDescriptors", "armorProficiencies",
        "weaponProficiencies", "abilityActivationTypes", "skillProficiencyLevels", "damageTypes",
        "healingTypes", "spellPreparationModes", "limitedUsePeriods", "weaponTypes", "weaponCategories",
        "weaponProperties", "spellAreaShapes", "weaponDamageTypes", "energyDamageTypes", "kineticDamageTypes",
        "languages", "conditionTypes", "modifierTypes", "modifierEffectTypes", "modifierType", "acpEffectingArmorType",
        "modifierArmorClassAffectedValues", "capacityUsagePer", "spellLevels", "armorTypes", "spellAreaEffects",
        "weaponSpecial", "weaponCriticalHitEffects", "featTypes", "allowedClasses", "consumableTypes", "maneuverability",
        "powerCoreSystems", "thrusterSystems", "armorSystems", "computerSystems", "crewQuarterSystems", "defenseSystems",
        "driftEngineSystems", "sensorSystems", "shieldSystems", "expansionBaySystems", "securitySystems", "baseFrames",
        "starshipWeaponTypes", "starshipWeaponClass", "starshipWeaponProperties", "starshipArcs", "starshipWeaponRanges",
        "starshipRoles", "vehicleTypes", "vehicleCoverTypes", "containableTypes"
    ];

    for (let o of toLocalize) {
        CONFIG.SFRPG[o] = Object.entries(CONFIG.SFRPG[o]).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);

            return obj;
        }, {});
    }

    console.log("SFRPG | Configuring rules engine");
    registerSystemRules(game.sfrpg.engine);

    Handlebars.registerHelper("not", function (value) {
        return !Boolean(value);
    });

    Handlebars.registerHelper('greaterThan', function (v1, v2, options) {
        'use strict';
        if (v1 > v2) {
            return true;
        }
        return false;
    });

    Handlebars.registerHelper('ellipsis', function (displayedValue, limit) {
        let str = displayedValue.toString();
        if (str.length <= limit) {
            return str;
        }
        return str.substring(0, limit) + '…';
    });

    Handlebars.registerHelper('getChildBulk', function (children) {
        const bulk = computeCompoundBulkForItem(null, children);
        const reduced = bulk / 10;
        if (reduced < 0.1) {
            return "-";
        } else if (reduced < 1) {
            return "L";
        } else return Math.floor(reduced);
    });

    Handlebars.registerHelper('getTotalStorageCapacity', function (item) {
        let totalCapacity = 0;
        if (item?.data?.container?.storage && item.data.container.storage.length > 0) {
            for (let storage of item.data.container.storage) {
                totalCapacity += storage.amount;
            }
        }
        return totalCapacity;
    });

    Handlebars.registerHelper('capitalize', function (value) {
        return value.capitalize();
    });

    Handlebars.registerHelper('contains', function (container, value) {
        if (!container || !value) return false;

        if (container instanceof Array) {
            return container.includes(value);
        }

        if (container instanceof Object) {
            return container.hasOwnProperty(value);
        }

        return false;
    });

    Handlebars.registerHelper('console', function (value) {
        console.log(value);
    });

    Handlebars.registerHelper('indexOf', function (array, value, zeroBased = true) {
        const index = array.indexOf(value);
        if (index < 0) return index;
        return index + (zeroBased ? 0 : 1);
    });

    /** Returns the value based on whether left is null or not. */
    Handlebars.registerHelper('leftOrRight', function (left, right) {
        return left || right;
    });

    Handlebars.registerHelper('editorPlus', function (options) {
        const target = options.hash['target'];
        if ( !target ) throw new Error("You must define the name of a target field.");
    
        // Enrich the content
        const owner = Boolean(options.hash['owner']);
        const rolls = Boolean(options.hash['rolls']);
        const rollData = options.hash['rollData'];
        const content = TextEditor.enrichHTML(options.hash['content'] || "", {secrets: owner, entities: true, rolls: rolls, rollData: rollData});
    
        // Construct the HTML
        let editor = $(`<div class="editor"><div class="editor-content" data-edit="${target}">${content}</div></div>`);
    
        // Append edit button
        const button = Boolean(options.hash['button']);
        const editable = Boolean(options.hash['editable']);
        if ( button && editable ) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));
        return new Handlebars.SafeString(editor[0].outerHTML);
    });

});

Hooks.once("ready", () => {
    const currentSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;
    const systemSchema = Number(game.system.data.schema);
    const needsMigration = currentSchema < systemSchema || currentSchema === 0;

    if (needsMigration && game.user.isGM) {
        migrateWorld()
            .then(_ => ui.notifications.info(game.i18n.localize("SFRPG.MigrationSuccessfulMessage")))
            .catch(_ => ui.notifications.error(game.i18n.localize("SFRPG.MigrationErrorMessage")));
    }

    defaultDropHandler = canvas._dragDrop.callbacks.drop;
    canvas._dragDrop.callbacks.drop = handleOnDrop.bind(canvas);
});

Hooks.on('ready', () => {
    RPC.initialize();

    initializeRemoteInventory();

    if (game.user.isGM) {
        migrateOldContainers();
    }
});

async function migrateOldContainers() {
    for (let actor of game.actors.entries) {
        let sheetActorHelper = new ActorItemHelper(actor._id, null, null);
        await sheetActorHelper.migrateItems();
    }

    for (let scene of game.scenes.entries) {
        for (let token of scene.data.tokens) {
            let sheetActorHelper = new ActorItemHelper(token.actorId, token._id, scene._id);
            await sheetActorHelper.migrateItems();
        }
    }
}

export async function handleOnDrop(event) {
    event.preventDefault();

	let data = null;
	try {
		data = JSON.parse(event.dataTransfer.getData('text/plain'));
	} catch (err) {
        defaultDropHandler(event);
		return false;
    }

    // We're only interested in overriding item drops.
    if (!data || (data.type !== "Item" && data.type !== "ItemCollection")) {
        return await defaultDropHandler(event);
    }

    // Transform the cursor position to canvas space
	const [x, y] = [event.clientX, event.clientY];
	const t = this.stage.worldTransform;
	data.x = (x - t.tx) / canvas.stage.scale.x;
    data.y = (y - t.ty) / canvas.stage.scale.y;

    if (data.type === "Item") {
        return await handleItemDropCanvas(data);
    }
    return false;
}

Hooks.on("canvasInit", function () {
    canvas.grid.diagonalRule = game.settings.get("sfrpg", "diagonalMovement");
    SquareGrid.prototype.measureDistances = measureDistances;
    Token.prototype.getBarAttribute = getBarAttribute;
});

Hooks.on("renderChatMessage", (app, html, data) => {
    highlightCriticalSuccessFailure(app, html, data);

    if (game.settings.get("sfrpg", "autoCollapseItemCards")) html.find('.card-content').hide();
});
Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => ItemSFRPG.chatListeners(html));

Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type !== "Item") return;
    createItemMacro(data.data, slot);
    return false;
});

/**
 * Create a Macro form an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * 
 * @param {Object} item The item data
 * @param {number} slot The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(item, slot) {
    const command = `game.sfrpg.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {"sfrpg.itemMacro": true}
        }, {displaySheet: false});
    }

    game.user.assignHotbarMacro(macro, slot);
}

function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;

    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    if (item.data.type === 'spell') return actor.useSpell(item);
    return item.roll();
}
