import { ActorSheetStarfinder } from "../sheet/base.js";

export class ActorSheetStarfinderVehicle extends ActorSheetStarfinder {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["starfinder", "sheet", "actor", "vehicle"],
            width: 600,
            height: 660
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/starfinder/templates/actors/limited-vehicle-sheet.html";
        return "systems/starfinder/templates/actors/vehicle-sheet.html";
    }
}