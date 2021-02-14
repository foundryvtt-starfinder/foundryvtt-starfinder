import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGVehicle extends ActorSheetSFRPG {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sfrpg", "sheet", "actor", "vehicle"],
            width: 600,
            height: 685
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/vehicle-sheet-limited.html";
        return "systems/sfrpg/templates/actors/vehicle-sheet-full.html";
    }

    getData() {
        const data = super.getData();

        let lvl = parseFloat(data.data.details.level || 0);
        let levels = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["level"] = lvl >= 1 ? String(lvl) : levels[lvl] || 1;

        this._getCrewData(data)

        return data;
    }

    /**
     * Process any flags that the actor might have that would affect the sheet .
     *
     * @param {Object} data The data object to update with any crew data.
     */
    async _getCrewData(data) {
        let crewData = this.actor.data.data.crew;

        if (!crewData || this.actor.data?.flags?.shipsCrew) {
            crewData = await this._processFlags(data, data.actor.flags);
        }

        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const complementActors = crewData.complement.actorIds.map(crewId => game.actors.get(crewId));
        const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));

        const localizedNoLimit = game.i18n.format("SFRPG.StarshipSheet.Crew.UnlimitedMax");

        const crew = {
            pilots: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Pilot") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit}), actors: pilotActors, dataset: { type: "passenger", role: "pilot" }},
            complement: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Complement") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": complementActors.length, "max": crewData.complement.limit > -1 ? crewData.complement.limit : localizedNoLimit}), actors: complementActors, dataset: { type: "passenger", role: "complement" }},
            passengers: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Passengers") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : localizedNoLimit}), actors: passengerActors, dataset: { type: "passenger", role: "passenger" }}
        };

        data.crew = Object.values(crew);
    }

    /**
     * Organize and classify items for vehicle sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {

        const inventory = {
            inventory: { label: game.i18n.format("SFRPG.VehicleSheet.Attacks.Attacks"), items: [], dataset: { type: "vehicleAttack,weapon" }, allowAdd: true }
        };

        this.processItemContainment(data.items, function (itemType, itemData) {

            // NOTE: We only flag `vehicleAttack` type items as having damage as weapon rolls won't work from the
            // vehicle sheet until we can assign passengers and access their dexterity modifiers.
            if (itemData.item.type == "vehicleAttack") {

                itemData.item.hasDamage = itemData.item.data.damage?.parts && itemData.item.data.damage.parts.length > 0;
            }

            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const levels = { "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let v = "data.details.level";
        let lvl = formData[v];
        lvl = levels[lvl] || parseFloat(lvl);
        if (lvl) formData[v] = lvl < 1 ? lvl : parseInt(lvl);

        super._updateObject(event, formData);
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}