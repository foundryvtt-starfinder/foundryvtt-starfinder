/**
 * The Starfinder game system for Foundry Virtual Tabletop
 * Author: The Foundry Starfinder Development Team
 * Software License: MIT
 * Content License: OGL v1.0a
 * Repository: https://github.com/foundryvtt-starfinder/foundryvtt-starfinder
 * Issue Tracker: https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/issues
 */
import { ActorItemHelper, initializeRemoteInventory } from "./module/actor/actor-inventory-utils.js";
import { ActorSFRPG } from "./module/actor/actor.js";
import { SFRPGDamage, SFRPGHealingSetting } from "./module/actor/mixins/actor-damage.js";
import { ActorSheetSFRPG } from "./module/actor/sheet/base.js";
import { ActorSheetSFRPGCharacter } from "./module/actor/sheet/character.js";
import { ActorSheetSFRPGDrone } from "./module/actor/sheet/drone.js";
import { ActorSheetSFRPGHazard } from "./module/actor/sheet/hazard.js";
import { ActorSheetSFRPGNPC } from "./module/actor/sheet/npc.js";
import { ActorSheetSFRPGStarship } from "./module/actor/sheet/starship.js";
import { ActorSheetSFRPGVehicle } from "./module/actor/sheet/vehicle.js";
import { ActorSheetFlags } from './module/apps/actor-flags.js';
import { ChoiceDialog } from './module/apps/choice-dialog.js';
import { DroneRepairDialog } from './module/apps/drone-repair-dialog.js';
import { AddEditSkillDialog } from './module/apps/edit-skill-dialog.js';
import { InputDialog } from './module/apps/input-dialog.js';
import { ItemCollectionSheet } from './module/apps/item-collection-sheet.js';
import { ItemDeletionDialog } from './module/apps/item-deletion-dialog.js';
import SFRPGModifierApplication from './module/apps/modifier-app.js';
import { ActorMovementConfig } from './module/apps/movement-config.js';
import { NpcSkillToggleDialog } from './module/apps/npc-skill-toggle-dialog.js';
import { ShortRestDialog } from './module/apps/short-rest.js';
import { SpellCastDialog } from './module/apps/spell-cast-dialog.js';
import { TraitSelectorSFRPG } from './module/apps/trait-selector.js';
import { canvasHandler } from "./module/canvas/canvas.js";
import { MeasuredTemplateSFRPG, TemplateLayerSFRPG } from "./module/canvas/template-overrides.js";
import { addChatMessageContextOptions } from "./module/chat/chat-message-options.js";
import CounterManagement from "./module/classes/counter-management.js";
import { CombatSFRPG } from "./module/combat/combat.js";
import { SFRPG } from "./module/config.js";
import { DiceSFRPG } from './module/dice.js';
import Engine from "./module/engine/engine.js";
import { preloadHandlebarsTemplates, setupHandlebars } from "./module/handlebars.js";
import { ItemSFRPG } from "./module/item/item.js";
import { ItemSheetSFRPG } from "./module/item/sheet.js";
import migrateWorld from './module/migration.js';
import SFRPGModifier from "./module/modifiers/modifier.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "./module/modifiers/types.js";
import { RPC } from "./module/rpc.js";
import registerSystemRules from "./module/rules.js";
import { registerSystemSettings } from "./module/system/settings.js";
import TooltipManagerSFRPG from "./module/tooltip.js";
import { generateUUID } from "./module/utils/utilities.js";

import BaseEnricher from "./module/system/enrichers/base.js";
import BrowserEnricher from "./module/system/enrichers/browser.js";
import CheckEnricher from "./module/system/enrichers/check.js";
import IconEnricher from "./module/system/enrichers/icon.js";
import TemplateEnricher from "./module/system/enrichers/template.js";

import RollDialog from "./module/apps/roll-dialog.js";
import { HotbarSFRPG } from "./module/apps/ui/hotbar.js";
import AbilityTemplate from "./module/canvas/ability-template.js";
import setupVision from "./module/canvas/vision.js";
import { initializeBrowsers } from "./module/packs/browsers.js";
import SFRPGRoll from "./module/rolls/roll.js";
import RollContext from "./module/rolls/rollcontext.js";
import RollNode from "./module/rolls/rollnode.js";
import RollTree from "./module/rolls/rolltree.js";
import registerCompendiumArt from "./module/system/compendium-art.js";
import { connectToDocument, rollItemMacro } from "./module/system/item-macros.js";
import { SFRPGTokenHUD } from "./module/token/token-hud.js";
import SFRPGTokenDocument from "./module/token/tokendocument.js";

import { extendDragData } from "./module/item/drag-data.js";
import { getAlienArchiveBrowser } from "./module/packs/alien-archive-browser.js";
import { getEquipmentBrowser } from "./module/packs/equipment-browser.js";
import { getSpellBrowser } from "./module/packs/spell-browser.js";
import { getStarshipBrowser } from "./module/packs/starship-browser.js";

let initTime = null;

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */
const moduleStructure = {
    AbilityTemplate,
    applications: {
        // Actor Sheets
        ActorSheetSFRPG,
        ActorSheetSFRPGCharacter,
        ActorSheetSFRPGDrone,
        ActorSheetSFRPGHazard,
        ActorSheetSFRPGNPC,
        ActorSheetSFRPGStarship,
        ActorSheetSFRPGVehicle,
        // Item Sheets
        ItemCollectionSheet,
        ItemSheetSFRPG,
        // Dialogs
        ActorMovementConfig,
        AddEditSkillDialog,
        ChoiceDialog,
        DroneRepairDialog,
        InputDialog,
        ItemDeletionDialog,
        RollDialog,
        NpcSkillToggleDialog,
        SpellCastDialog,
        ShortRestDialog,
        // Misc
        ActorSheetFlags,
        SFRPGModifierApplication,
        TraitSelectorSFRPG
    },
    compendiumArt: { map: new Map(), refresh: registerCompendiumArt },
    config: SFRPG,
    dice: DiceSFRPG,
    documents: { ActorSFRPG, ItemSFRPG, CombatSFRPG },
    entities: { ActorSFRPG, ItemSFRPG },
    generateUUID,
    // Document browsers
    getSpellBrowser,
    getEquipmentBrowser,
    getAlienArchiveBrowser,
    getStarshipBrowser,
    migrateWorld,
    rollItemMacro,
    rolls: {
        RollContext,
        RollNode,
        RollTree,
        SFRPGRoll
    },
    RPC,
    SFRPGEffectType,
    SFRPGModifier,
    SFRPGModifierType,
    SFRPGModifierTypes,
    timedEffects: new Map(),

    // Namespace style
    Actor: {
        Damage: {
            SFRPGHealingSetting,
            SFRPGDamage
        },
        Modifiers: {
            SFRPGEffectType,
            SFRPGModifier,
            SFRPGModifierType,
            SFRPGModifierTypes
        },
        Sheet: {
            Base: ActorSheetSFRPG,
            Character: ActorSheetSFRPGCharacter,
            Npc: ActorSheetSFRPGNPC,
            Drone: ActorSheetSFRPGDrone,
            Starship: ActorSheetSFRPGStarship,
            Vehicle: ActorSheetSFRPGVehicle
        },
        Type: ActorSFRPG
    }
};

globalThis.sfrpg = moduleStructure;

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
    initTime = (new Date()).getTime();
    console.log(`Starfinder | [INIT] Initializing the Starfinder System`);

    console.log(
        `__________________________________________________
 ____  _              __ _           _
/ ___|| |_ __ _ _ __ / _(_)_ __   __| | ___ _ __
\\___ \\| __/ _\` | '__| |_| | '_ \\ / _\` |/ _ \\ '__|
 ___) | || (_| | |  |  _| | | | | (_| |  __/ |
|____/ \\__\\__,_|_|  |_| |_|_| |_|\\__,_|\\___|_|
==================================================`
    );

    // CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;

    console.log("Starfinder | [INIT] Initializing the rules engine");
    const engine = new Engine();

    moduleStructure.engine = engine;
    game.sfrpg = moduleStructure;

    CONFIG.SFRPG = SFRPG;
    CONFIG.statusEffects = CONFIG.SFRPG.statusEffects;

    console.log("Starfinder | [INIT] Overriding document classes");
    CONFIG.Actor.documentClass = ActorSFRPG;
    CONFIG.Item.documentClass = ItemSFRPG;
    CONFIG.Combat.documentClass = CombatSFRPG;
    CONFIG.Dice.rolls.unshift(SFRPGRoll);

    CONFIG.time.roundTime = 6;

    CONFIG.Token.documentClass = SFRPGTokenDocument;

    CONFIG.Canvas.layers.templates.layerClass = TemplateLayerSFRPG;
    CONFIG.MeasuredTemplate.objectClass = MeasuredTemplateSFRPG;
    CONFIG.MeasuredTemplate.defaults.angle = 90; // SF uses 90 degree cones

    CONFIG.ui.hotbar = HotbarSFRPG;

    CONFIG.fontDefinitions["Exo2"] = {
        editor: true,
        fonts: [
            {urls: ["../systems/sfrpg/fonts/exo2-variablefont_wght.woff2"]},
            {urls: ["../systems/sfrpg/fonts/exo2-italic-variablefont_wght.woff2"], weight: 700}
        ]
    };

    CONFIG.fontDefinitions["Orbitron"] = {
        editor: true,
        fonts: [
            {urls: ["../systems/sfrpg/fonts/orbitron-variablefont_wght.woff2"]}
        ]
    };

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

    console.log("Starfinder | [INIT] Configuring rules engine");
    registerSystemRules(game.sfrpg.engine);

    console.log("Starfinder | [INIT] Registering system settings");
    registerSystemSettings();

    if (game.settings.get("sfrpg", "sfrpgTheme")) {
        const setAnvil = () => {
            const logo = document.querySelector("#logo");
            logo.loading = "eager";
            logo.src = "systems/sfrpg/images/starfinder_icon.webp";
            logo.style.width = "92px";
            logo.style.height = "92px";
            logo.style.margin = "0 0 0 9px";
        };

        const dummy = document.createElement("img");
        dummy.addEventListener("load", setAnvil);
        dummy.loading = "eager";
        dummy.src = "systems/sfrpg/images/starfinder_icon.webp";

        const r = document.querySelector(':root');
        r.style.setProperty("--color-border-highlight-alt", "#0080ff");
        r.style.setProperty("--color-border-highlight", "#00a0ff");
        r.style.setProperty("--color-text-hyperlink", "#38b5ff");
        r.style.setProperty("--color-shadow-primary", "#00a0ff");
        r.style.setProperty("--color-shadow-highlight", "#00a0ff");
        r.style.setProperty("--sfrpg-theme-blue", "#235683");
    }

    console.log("Starfinder | [INIT] Overriding tooltips");
    Object.defineProperty(game, "tooltip", {value: new TooltipManagerSFRPG(), configurable: true, enumerable: true});

    console.log("Starfinder | [INIT] Registering sheets");
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("sfrpg", ActorSheetSFRPGCharacter, { types: ["character"],     makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGDrone,     { types: ["drone"],         makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGHazard,    { types: ["hazard"],        makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGNPC,       { types: ["npc", "npc2"],   makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGStarship,  { types: ["starship"],      makeDefault: true });
    Actors.registerSheet("sfrpg", ActorSheetSFRPGVehicle,   { types: ["vehicle"],       makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("sfrpg", ItemSheetSFRPG, { makeDefault: true });

    console.log("Starfinder | [INIT] Preloading handlebar templates");
    preloadHandlebarsTemplates();

    console.log("Starfinder | [INIT] Setting up inline buttons");
    CONFIG.TextEditor.enrichers.push(new BrowserEnricher(), new IconEnricher(), new CheckEnricher(), new TemplateEnricher());

    console.log("Starfinder | [INIT] Applying inline icons");
    CONFIG.Actor.typeIcons = {
        character: "fas fa-user",
        npc2: "fas fa-spaghetti-monster-flying",
        npc: "fas fa-spaghetti-monster-flying",
        drone: "fas fa-robot",
        starship: "fas fa-rocket",
        vehicle: "fas fa-car",
        hazard: "fas fa-skull-crossbones"
    };

    CONFIG.Item.typeIcons = {
        "archetypes": "fas fa-id-badge",
        "class": "fas fa-id-card",
        "race": "fas fa-user-tag",
        "theme": "fas fa-user-tie",

        "actorResource": "fas fa-chart-pie",
        "feat": "fas fa-medal",
        "spell": "fas fa-wand-magic-sparkles",
        "effect": "fas fa-stopwatch",

        "asi": "fas fa-person-arrow-up-from-line",

        "chassis": "fas fa-car-battery",
        "mod": "fas fa-screwdriver-wrench",

        "starshipAblativeArmor": "fas fa-shield-halved",
        "starshipAction": "fas fa-crosshairs",
        "starshipArmor": "fas fa-user-shield",
        "starshipComputer": "fas fa-server",
        "starshipCrewQuarter": "fas fa-house-user",
        "starshipDefensiveCountermeasure": "fas fa-shield-heart",
        "starshipDriftEngine": "fas fa-atom",
        "starshipExpansionBay": "fas fa-boxes-packing",
        "starshipFortifiedHull": "fas fa-house-lock",
        "starshipFrame": "fas fa-gears",
        "starshipOtherSystem": "fas fa-gear",
        "starshipPowerCore": "fas fa-radiation",
        "starshipReinforcedBulkhead": "fas fa-file-shield",
        "starshipSecuritySystem": "fas fa-user-lock",
        "starshipSensor": "fas fa-location-crosshairs",
        "starshipShield": "fas fa-shield",
        "starshipSpecialAbility": "fas fa-medal",
        "starshipThruster": "fas fa-shuttle-space",
        "starshipWeapon": "fas fa-explosion",

        "vehicleAttack": "fas fa-gun",
        "vehicleSystem": "fas fa-gear",

        "ammunition": "fas fa-box-archive",
        "augmentation": "fas fa-vr-cardboard",
        "consumable": "fas fa-beer-mug-empty",
        "container": "fas fa-briefcase",
        "equipment": "fas fa-shirt",
        "fusion": "fas fa-bolt",
        "goods": "fas fa-boxes-stacked",
        "hybrid": "fas fa-hat-wizard",
        "magic": "fas fa-wand-magic",
        "shield": "fas fa-shield",
        "technological": "fas fa-microchip",
        "upgrade": "fas fa-link",
        "weapon": "fas fa-gun",
        "weaponAccessory": "fas fa-gears"
    };

    console.log("Starfinder | [INIT] Adding math functions");
    SFRPGRoll.registerMathFunctions();

    const finishTime = (new Date()).getTime();
    console.log(`Starfinder | [INIT] Done (operation took ${finishTime - initTime} ms)`);
});

Hooks.once("i18nInit", () => {
    console.log("Starfinder | [I18N] Localizing global arrays");
    const toLocalize = [
        "abilities",
        "abilityActivationTypes",
        "acpEffectingArmorType",
        "actionTargets",
        "actionTargetsStarship",
        "actorSizes",
        "actorTypes",
        "alignments",
        "alignmentsNPC",
        "ammunitionTypes",
        "armorProficiencies",
        "armorTypes",
        "augmentationSystems",
        "augmentationTypes",
        "babProgression",
        "capacityUsagePer",
        "combatRoles",
        "combatRolesDescriptions",
        "conditionTypes",
        "consumableTypes",
        "containableTypes",
        "currencies",
        "damageReductionTypes",
        "damageTypeOperators",
        "damageTypes",
        "difficultyLevels",
        "distanceUnits",
        "constantDistanceUnits",
        "variableDistanceUnits",
        "durationTypes",
        "effectDurationTypes",
        "descriptors",
        "descriptorsTooltips",
        "energyDamageTypes",
        "energyResistanceTypes",
        "featTypes",
        "flightManeuverability",
        "healingTypes",
        "itemActionTypes",
        "itemTypes",
        "kineticDamageTypes",
        "languages",
        "limitedUsePeriods",
        "maneuverability",
        "modifierArmorClassAffectedValues",
        "modifierEffectTypes",
        "modifierType",
        "modifierTypes",
        "saveDescriptors",
        "saveProgression",
        "saves",
        "senses",
        "skillProficiencyLevels",
        "skills",
        "specialAbilityTypes",
        "specialMaterials",
        "speeds",
        "spellAreaEffects",
        "spellAreaShapes",
        "spellcastingClasses",
        "spellLevels",
        "spellPreparationModes",
        "starshipArcs",
        "starshipRoles",
        "starshipSizes",
        "starshipSystemStatus",
        "starshipWeaponClass",
        "starshipWeaponProperties",
        "starshipWeaponRanges",
        "starshipWeaponTypes",
        "turnEventTypes",
        "vehicleCoverTypes",
        "vehicleSizes",
        "vehicleTypes",
        "weaponCategories",
        "weaponCriticalHitEffects",
        "weaponDamageTypes",
        "weaponProficiencies",
        "weaponProperties",
        "weaponPropertiesTooltips",
        "weaponTypes"
    ];

    for (const o of toLocalize) {
        CONFIG.SFRPG[o] = Object.entries(CONFIG.SFRPG[o]).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);

            return obj;
        }, {});
    }

    for (const element of SFRPG.globalAttackRollModifiers) {
        element.bonus.name = game.i18n.localize(element.bonus.name);
        element.bonus.notes = game.i18n.localize(element.bonus.notes);
    }

    for (const obj of Object.values(SFRPG.featureCategories)) {
        obj.category = game.i18n.localize(obj.category);
        obj.label = game.i18n.localize(obj.label);
    }

    CONFIG.SFRPG.statusEffects.forEach(e => e.label = game.i18n.localize(e.label));
});

Hooks.once("setup", function() {
    console.log(`Starfinder | [SETUP] Setting up Starfinder System subsystems`);
    const setupTime = (new Date()).getTime();

    /**
     * Manage counter classe feature from combat tracker
     * Like Solarian Attenument / Vanguard Entropic Point and Soldat Ki Point
    **/
    console.log("Starfinder | [SETUP] Initializing counter management");
    const counterManagement = new CounterManagement();
    counterManagement.setup();

    console.log("Starfinder | [SETUP] Initializing RPC system");
    RPC.initialize();

    console.log("Starfinder | [SETUP] Initializing remote inventory system");
    initializeRemoteInventory();

    console.log("Starfinder | [SETUP] Caching starship actions");
    ActorSheetSFRPGStarship.ensureStarshipActions();

    console.log("Starfinder | [SETUP] Registering custom handlebars");
    setupHandlebars();

    const finishTime = (new Date()).getTime();
    console.log(`Starfinder | [SETUP] Done (operation took ${finishTime - setupTime} ms)`);
});

Hooks.once("ready", async () => {
    console.log(`Starfinder | [READY] Preparing system for operation`);
    const readyTime = (new Date()).getTime();

    console.log("Starfinder | [READY] Overriding token HUD");
    canvas.hud.token = new SFRPGTokenHUD();

    console.log("Starfinder | [READY] Initializing compendium browsers");
    initializeBrowsers();

    console.log("Starfinder | [READY] Setting up Vision Modes");
    setupVision();

    console.log("Starfinder | [READY] Applying artwork from modules to compendiums");
    registerCompendiumArt();

    console.log("Starfinder | [READY] Setting up event listeners");
    BaseEnricher.addListeners();
    ItemSFRPG.chatListeners($("body"));
    extendDragData();

    console.log("Starfinder | [READY] Connecting item macros to items");
    for (const macro of game.macros) {
        connectToDocument(macro);
    }

    if (game.users.activeGM?.isSelf) {
        const currentSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;
        const systemSchema = Number(game.system.flags.sfrpg.schema);
        const needsMigration = currentSchema < systemSchema || currentSchema === 0;

        let migrationPerformed = false;
        if (needsMigration) {
            console.log("Starfinder | [READY] Performing world migration");
            try {
                migrationPerformed = await migrateWorld();
            } catch {
                ui.notifications.error(game.i18n.localize("SFRPG.MigrationErrorMessage"), {permanent: true});
                console.error(error);
            }

            if (migrationPerformed) {
                ui.notifications.info(game.i18n.localize("SFRPG.MigrationSuccessfulRefreshMessage"), {permanent: true});
            } else {
                ui.notifications.info(game.i18n.localize("SFRPG.MigrationSuccessfulMessage"), {permanent: true});
            }

        }

        console.log("Starfinder | [READY] Checking items for container updates");
        if (migrationPerformed) migrateOldContainers();

    }

    Hooks.on("dropCanvasData", (canvas, data) => canvasHandler(canvas, data));

    const finishTime = (new Date()).getTime();
    console.log(`Starfinder | [READY] Done (operation took ${finishTime - readyTime} ms)`);

    const startupDuration = finishTime - initTime;
    console.log(`Starfinder | [STARTUP] Total launch took ${Number(startupDuration / 1000).toFixed(2)} seconds.`);
});
async function migrateOldContainers() {
    const promises = [];
    for (const actor of game.actors.contents) {
        const sheetActorHelper = new ActorItemHelper(actor.id, null, null);
        const migrationProcess = sheetActorHelper.migrateItems();
        if (migrationProcess) {
            promises.push(migrationProcess);
        }
    }

    for (const scene of game.scenes.contents) {
        for (const token of scene.tokens) {
            if (!token.actorLink) {
                const sheetActorHelper = new ActorItemHelper(token.actor?.id ?? token.actorId, token.id, scene.id);
                const migrationProcess = sheetActorHelper.migrateItems();
                if (migrationProcess) {
                    promises.push(migrationProcess);
                }
            }
        }
    }

    if (promises.length > 0) {
        console.log(`Starfinder | [READY] Updating containers in ${promises.length} documents.`);
        return Promise.all(promises);
    }
}

Hooks.on("renderChatMessage", (app, html, data) => {
    DiceSFRPG.highlightCriticalSuccessFailure(app, html, data);
    DiceSFRPG.addDamageTypes(app, html, data);

    if (game.settings.get("sfrpg", "autoCollapseItemCards")) html.find('.card-content').hide();
});

Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);

Handlebars.registerHelper('isObject', function(item) {
    if (typeof item === "object") {
        return true;
    } else {
        return false;
    }
});

Hooks.on("renderSidebarTab", async (app, html) => {
    if (app.options.id === "settings") {
        const textToAdd = `<a href="https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/blob/master/changelist.md">Starfinder Patch Notes</a>`;
        const gameDetails = document.getElementById("game-details");
        if (gameDetails) {
            const systemSection = gameDetails.getElementsByClassName("system")[0];
            if (systemSection) {
                systemSection.insertAdjacentHTML("afterend", textToAdd);
            }
        }
    }
});

// Set this hook up outside of init for the sake of module compatibility.
Hooks.on("renderPause", () => {
    if (game.settings.get("sfrpg", "sfrpgTheme")) {
        const paused = document.querySelector("figure#pause");
        const icon = paused.children[0];
        icon.src = "systems/sfrpg/images/cup/organizations/starfinder_society.webp";
    }
});
