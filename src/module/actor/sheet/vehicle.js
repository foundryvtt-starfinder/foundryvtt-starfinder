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
        this._getHangarBayData(data)

        return data;
    }

    /**
     * Process any flags that the crew actor might have that would affect the sheet .
     *
     * @param {Object} data The data object to update with any crew data.
     */
    async _getCrewData(data) {
        let crewData = this.actor.data.data.crew;
        
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const complementActors = crewData.complement.actorIds.map(crewId => game.actors.get(crewId));
        const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));

        const localizedNoLimit = game.i18n.format("SFRPG.VehicleSheet.Passengers.UnlimitedMax");

        const crew = {
            pilots: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Pilot") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit}), actors: pilotActors, dataset: { type: "passenger", role: "pilot" }},
            complement: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Complement") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": complementActors.length, "max": crewData.complement.limit > -1 ? crewData.complement.limit : localizedNoLimit}), actors: complementActors, dataset: { type: "passenger", role: "complement" }},
            passengers: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Passengers") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : localizedNoLimit}), actors: passengerActors, dataset: { type: "passenger", role: "passenger" }}
        };

        data.crew = Object.values(crew);
    }

    /**
     * Process any flags that the hangar bay actor might have that would affect the sheet.
     *
     * @param {Object} data The data object to update with any hangar bay data.
     */
    async _getHangarBayData(data) {
        let hangarBayData = this.actor.data.data.hangarBay;
        data.hasHangarBays = this.actor.data.data.hangarBay.limit > 0;

        const hangarBayActors = hangarBayData.actorIds.map(crewId => game.actors.get(crewId));

        // TODO: Localize
        const localizedNoLimit = "No limit";

        // TODO: Localize
        const hangarBay = { label: "Vehicles" + " " + game.i18n.format("({current} / {max})", {"current": hangarBayActors.length, "max": hangarBayData.limit > -1 ? hangarBayData.limit : localizedNoLimit}), actors: hangarBayActors, dataset: { type: "vehicle" }};

        data.hangarBay = hangarBay;
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

        //   0        1               3
        let [attacks, primarySystems, expansionBays] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.type === "weapon" || item.type === "vehicleAttack") {
                arr[0].push(item);
            }
            else if (item.type === "starshipExpansionBay") arr[2].push(item);

            return arr;
        }, [ [], [], [] ]);

        this.processItemContainment(attacks, function (itemType, itemData) {
            // NOTE: We only flag `vehicleAttack` type items as having damage as weapon rolls won't work from the
            // vehicle sheet until we can assign passengers and access their dexterity modifiers.
            if (itemData.item.type == "vehicleAttack") {

                itemData.item.hasDamage = itemData.item.data.damage?.parts && itemData.item.data.damage.parts.length > 0;
            }
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory

        // TODO: Localize
        const features = {
            primarySystems: { label: "Primary Systems", items: primarySystems, hasActions: false, dataset: { type: "" } },
            expansionBays: { label: game.i18n.format("Expansion Bays ({current} / {max})", {current: expansionBays.length, max: data.data.attributes.expansionBays.value}), items: expansionBays, hasActions: false, dataset: { type: "starshipExpansionBay" } },
        };
        data.features = Object.values(features);
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        // Crew Tab
        html.find('.crew-delete').click(this._onRemoveFromCrew.bind(this));

        let handler = ev => this._onDragCrewStart(ev);
        html.find('li.crew').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        html.find('.crew-list').each((i, li) => {
            li.addEventListener("dragover", this._onCrewDragOver.bind(this), false);
            // li.addEventListener("drop", this._onCrewDrop.bind(this), false);
        });

        html.find('li.crew-header').each((i, li) => {
            li.addEventListener("dragenter", this._onCrewDragEnter, false);
            li.addEventListener("dragleave", this._onCrewDragLeave, false);
        });

        // Roll piloting skill for PC or NPC passengers
        html.find('.passenger-action .passengerPilotingSkill').click(event => this._onRollPassengerPilotingSkill(event));
        html.find('.passenger-action .pilotPilotingSkill').click(event => this._onRollPilotPilotingSkill(event));
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

    /** @override */
    async _onDrop(event) {
        event.preventDefault();

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (!data) {
                return false;
            }
        } catch (err) {
            return false;
        }

        // Case - Dropped Actor
        if (data.type === "Actor") {

            const actorId = data.id;
            const actor = game.actors.get(actorId);

            // Other vehicles are only acceptable if this vehicle has 1 or more hangar bays
            if (actor.data.type === "vehicle") {
                return this._onVehicleDrop(event, data);
            }
            // The only other actors allowed are crew
            else {
                return this._onCrewDrop(event, data);
            }
        }
        else if (data.type === "Item") {
            const rawItemData = await this._getItemDropData(event, data);

            if (rawItemData.type === "weapon" || rawItemData.type === "vehicleAttack") {
                return this.processDroppedData(event, data);
            }
            else if (rawItemData.type === "starshipExpansionBay") {
                return this.actor.createEmbeddedEntity("OwnedItem", rawItemData);
            }
        }

        return false;
    }

    /**
     * Get an items data.
     *
     * @param {Event} event The originating drag event
     * @param {object} data The data transfer object
     */
    async _getItemDropData(event, data) {
        let itemData = null;

        const actor = this.actor;
        if (data.pack) {
            const pack = game.packs.get(data.pack);
            if (pack.metadata.entity !== "Item") return;
            itemData = await pack.getEntity(data.id);
        } else if (data.data) {
            let sameActor = data.actorId === actor._id;
            if (sameActor && actor.isToken) sameActor = data.tokenId === actor.token.id;
            if (sameActor) {
                await this._onSortItem(event, data.data);
            }
            itemData = data.data;
        } else {
            let item = game.items.get(data.id);
            if (!item) return;
            itemData = item.data;
        }

        return duplicate(itemData);
    }


    /**
     * Handles drop events for the Hangar Bay list
     *
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async _onVehicleDrop(event, data) {
        // event.preventDefault();

        $(event.target).css('background', '');

        if (!data.id) return false;

        const hangarBay = duplicate(this.actor.data.data.hangarBay);

        if (hangarBay.limit === -1 || hangarBay.actorIds.length < hangarBay.limit) {
            hangarBay.actorIds.push(data.id);

            await this.actor.update({
                "data.hangarBay": hangarBay
            }).then(this.render(false));
        } else {
            // TODO: Localize
            ui.notifications.error("Vehicle limit reached");
        }

        return true;
    }

        /**
     * Handles drop events for the Passenger list
     *
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async _onCrewDrop(event, data) {
        // event.preventDefault();

        $(event.target).css('background', '');

        const targetRole = event.target.dataset.role;
        if (!targetRole || !data.id) return false;

        const crew = duplicate(this.actor.data.data.crew);
        const crewRole = crew[targetRole];
        const oldRole = this.actor.getCrewRoleForActor(data.id);

        if (crewRole.limit === -1 || crewRole.actorIds.length < crewRole.limit) {
            crewRole.actorIds.push(data.id);

            if (oldRole) {
                const originalRole = crew[oldRole];
                originalRole.actorIds = originalRole.actorIds.filter(x => x != data.id);
            }

            await this.actor.update({
                "data.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.format("SFRPG.VehicleSheet.Passengers.PassengersLimitReached", {targetRole: targetRole}));
        }

        return true;
    }

    /**
     * Handles dragenter for the passengers tab
     * @param {Event} event The originating dragenter event
     */
    _onCrewDragEnter(event) {
        $(event.target).css('background', "rgba(0,0,0,0.3)");
    }

    /**
     * Handles dragleave for the passengers tab
     * @param {Event} event The originating dragleave event
     */
    _onCrewDragLeave(event) {
        $(event.target).css('background', '');
    }

    /**
     * Handle dragging crew members on the sheet.
     *
     * @param {Event} event Originating dragstart event
     */
    _onDragCrewStart(event) {
        const actorId = event.currentTarget.dataset.actorId;
        const actor = game.actors.get(actorId);

        const dragData = {
            type: "Actor",
            id: actor.id,
            data: actor.data
        };

        if (this.actor.isToken) dragData.tokenId = actorId;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /**
     * Handles ondragover for crew drag-n-drop
     *
     * @param {Event} event Orgininating ondragover event
     */
    _onCrewDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    /**
     * Remove an actor from the crew.
     *
     * @param {Event} event The originating click event
     */
    async _onRemoveFromCrew(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        const role = this.actor.getCrewRoleForActor(actorId);
        if (role) {
            const crewData = duplicate(this.actor.data.data.crew);
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
            await this.actor.update({
                "data.crew": crewData
            });
        }
    }

    /**
     * Rolls the Piloting skill check of a passenger.
     *
     * @param {Event} event The originating click event
     */
    async _onRollPassengerPilotingSkill(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        const role = this.actor.getCrewRoleForActor(actorId);

        await this.actor.rollVehiclePilotingSkill(role,actorId);
    }

    /**
     * Rolls the Piloting skill check of the pilot.
     *
     * @param {Event} event The originating click event
     */
    async _onRollPilotPilotingSkill(event) {
        event.preventDefault();

        this.actor.rollVehiclePilotingSkill();
    }

}