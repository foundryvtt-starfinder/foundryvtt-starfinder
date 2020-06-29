/**
 * The Starfinder game system for Foundry Virtual Tabletop
 * Author: wildj79
 * Software License: MIT
 * Content License: OGL v1.0a
 * Repository: https://github.com/wildj79/foundryvtt-starfinder
 * Issue Tracker: https://github.com/wildj79/foundryvtt-starfinder/issues
 */

import { STARFINDER } from "./module/config.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { registerSystemSettings } from "./module/settings.js";
import { measureDistances, getBarAttribute } from "./module/canvas.js";
import { ActorStarfinder } from "./module/actor/actor.js";
import { ActorSheetStarfinderCharacter } from "./module/actor/sheet/character.js";
import { ActorSheetStarfinderNPC } from "./module/actor/sheet/npc.js";
import { ActorSheetStarfinderStarship } from "./module/actor/sheet/starship.js";
import { ActorSheetStarfinderVehicle } from "./module/actor/sheet/vehicle.js";
import { ItemStarfinder } from "./module/item/item.js";
import { ItemSheetStarfinder } from "./module/item/sheet.js";
import { highlightCriticalSuccessFailure } from "./module/dice.js";
import { _getInitiativeFormula, addChatMessageContextOptions } from "./module/combat.js";
import Engine from "./module/engine/engine.js";
import registerSystemRules from "./module/rules.js";
import { StarfinderModifierTypes, StarfinderModifierType, StarfinderEffectType } from "./module/modifiers/types.js";
import StarfinderModifier from "./module/modifiers/modifier.js";
import { generateUUID } from "./module/utilities.js";
import migrateWorld from './module/migration.js';
import CounterManagement from "./module/classes/counter-management.js";

Hooks.once('init', async function () {
    console.log(`Starfinder | Initializeing Starfinder System`);
    console.log(
`__________________________________________________
 ____  _              __ _           _
/ ___|| |_ __ _ _ __ / _(_)_ __   __| | ___ _ __
\\___ \\| __/ _\` | '__| |_| | '_ \\ / _\` |/ _ \\ '__|
 ___) | || (_| | |  |  _| | | | | (_| |  __/ |
|____/ \\__\\__,_|_|  |_| |_|_| |_|\\__,_|\\___|_|
==================================================`
    );

    console.log("Starfinder | Initializeing the rules engine");
    const engine = new Engine();

    game.starfinder = {
        rollItemMacro,
        engine,
        StarfinderModifierType,
        StarfinderEffectType,
        StarfinderModifierTypes,
        StarfinderModifier,
        generateUUID
    };

    CONFIG.STARFINDER = STARFINDER;
    CONFIG.Actor.entityClass = ActorStarfinder;
    CONFIG.Item.entityClass = ItemStarfinder;

    CONFIG.statusEffects = CONFIG.STARFINDER.statusEffectIcons;

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

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, { types: ["character"], makeDefault: true });
    Actors.registerSheet("starfinder", ActorSheetStarfinderNPC, { types: ["npc"], makeDefault: true });
    Actors.registerSheet("starfinder", ActorSheetStarfinderStarship, { types: ["starship"], makeDefault: true });
    Actors.registerSheet("starfinder", ActorSheetStarfinderVehicle, { types: ["vehicle"], makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("starfinder", ItemSheetStarfinder, { makeDefault: true });

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
        "modifierArmorClassAffectedValues"
    ];

    for (let o of toLocalize) {
        CONFIG.STARFINDER[o] = Object.entries(CONFIG.STARFINDER[o]).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);

            return obj;
        }, {});
    }

    console.log("Starfinder | Configuring rules engine");
    registerSystemRules(game.starfinder.engine);

    Handlebars.registerHelper("not", function (value) {
        return !Boolean(value);
    });
});

Hooks.once("ready", () => {
    const currentSchema = game.settings.get('starfinder', 'worldSchemaVersion') ?? 0;
    const systemSchema = Number(game.system.data.schema);
    const needsMigration = currentSchema < systemSchema || currentSchema === 0;

    if (needsMigration && game.user.isGM) {
        migrateWorld()
            .then(_ => ui.notifications.info(game.i18n.localize("STARFINDER.MigrationSuccessfulMessage")))
            .catch(_ => ui.notifications.error(game.i18n.localize("STARFINDER.MigrationErrorMessage")));
    }
});

Hooks.on("canvasInit", function () {
    canvas.grid.diagonalRule = game.settings.get("starfinder", "diagonalMovement");
    SquareGrid.prototype.measureDistances = measureDistances;
    Token.prototype.getBarAttribute = getBarAttribute;
});

Hooks.on("renderChatMessage", (app, html, data) => {
    highlightCriticalSuccessFailure(app, html, data);

    if (game.settings.get("starfinder", "autoCollapseItemCards")) html.find('.card-content').hide();
});
Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => ItemStarfinder.chatListeners(html));

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
    const command = `game.starfinder.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {"starfinder.itemMacro": true}
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
