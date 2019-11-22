/**
 * The Starfinder game system for Foundry Virtual Tabletop
 * Author: wildj79
 * Software License: MIT
 * Content License: OGL v1.0a
 * Repository: https://github.com/wildj79/foundryvtt-starfinder
 * Issue Tracker: https://github.com/wildj79/foundryvtt-starfinder/issues
 */

 import { STARFINDER } from "./module/config";
 import { preloadHandlebarsTemplates } from "./module/templates";
 import { registerSystemSettings } from "./module/settings";
 import { measureDistance, getBarAttribute } from "./module/canvas";

 Hooks.once('init', async function () {
     console.log(`Starfinder | Initializeing Starfinder System`);

     game.starfinder = {};

     CONFIG.STARFINDER = STARFINDER;
     CONFIG.Actor.entityClass = ActorStarfinder;
     CONFIG.Item.entityClass = ItemStarfinder;

     registerSystemSettings();

     await preloadHandlebarsTemplates();
 });

 Hooks.once("setup", function() {
     const toLocalize = [
         "abilities", "alignments", "currencies", "distanceUnits", "itemActionTypes", "senses", "skills", "targetTypes",
         "timePeriods"
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
