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

 Hooks.once('init', async function () {
     console.log(`Starfinder | Initializeing Starfinder System`);

     game.starfinder = {};

     CONFIG.STARFINDER = STARFINDER;
     CONFIG.Actor.entityClass = ActorStarfinder;
     //CONFIG.Item.entityClass = ItemStarfinder;

     registerSystemSettings();

     await preloadHandlebarsTemplates();

     Actors.unregisterSheet("core", ActorSheet);
     Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, { types: ["character"], makeDefault: true });     
 });

 Hooks.once("setup", function() {
     const toLocalize = [
         "abilities", "alignments", "distanceUnits", "senses", "skills", "currencies"
     ];

     for (let o of toLocalize) {
         CONFIG.STARFINDER[o] = Object.entries(CONFIG.STARFINDER[o]).reduce((obj, e) => {
             obj[e[0]] = game.i18n.localize(e[1]);

             return obj;
         }, {});
     }
 });

 Hooks.on("canvasInti", function () {
     canvas.grid.diagonalRule = game.settings.get("starfinder", "diagonalMovement");
     SquareGrid.prototype.measureDistance = measureDistance;
     Token.prototype.getBarAttribute = getBarAttribute;
 });
