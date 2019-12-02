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
 import { measureDistance, getBarAttribute } from "./module/canvas.js";
 import { ActorStarfinder } from "./module/actor/actor.js";
 import { ActorSheetStarfinderCharacter } from "./module/actor/sheet/character.js";
 import { ActorSheetStarfinderNPC } from "./module/actor/sheet/npc.js";
 import { ActorSheetStarfinderStarship } from "./module/actor/sheet/starship.js";
 import { ActorSheetStarfinderVehicle } from "./module/actor/sheet/vehicle.js";
 import { ItemStarfinder } from "./module/item/item.js";
 import { ItemSheetStarfinder } from "./module/item/sheet.js";
 import { highlightCriticalSuccessFailure } from "./module/dice.js";
 import { _getInitiativeFormula, addChatMessageContextOptions } from "./module/combat.js";

 Hooks.once('init', async function () {
     console.log(`Starfinder | Initializeing Starfinder System`);

     game.starfinder = {};

     CONFIG.STARFINDER = STARFINDER;
     CONFIG.Actor.entityClass = ActorStarfinder;
     CONFIG.Item.entityClass = ItemStarfinder;

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
 });

 Hooks.once("setup", function() {
     const toLocalize = [
         "abilities", "alignments", "distanceUnits", "senses", "skills", "currencies", "saves"
     ];

     for (let o of toLocalize) {
         CONFIG.STARFINDER[o] = Object.entries(CONFIG.STARFINDER[o]).reduce((obj, e) => {
             obj[e[0]] = game.i18n.localize(e[1]);

             return obj;
         }, {});
     }
 });

 Hooks.on("canvasInit", function () {
     canvas.grid.diagonalRule = game.settings.get("starfinder", "diagonalMovement");
     SquareGrid.prototype.measureDistance = measureDistance;
     Token.prototype.getBarAttribute = getBarAttribute;
 });

 Hooks.on("renderChatMessage", highlightCriticalSuccessFailure);
 Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
 Hooks.on("renderChatLog", (app, html, data) => ItemStarfinder.chatListeners(html));
