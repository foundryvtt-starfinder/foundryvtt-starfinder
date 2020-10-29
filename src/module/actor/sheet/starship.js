import { ActorSheetSFRPG } from "./base.js";

/**
 * An Actor sheet for a starship in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGStarship extends ActorSheetSFRPG {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sfrpg", "sheet", "actor", "starship"],
            witdh: 600,
            height: 800
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/limited-starship-sheet.html";
        return "systems/sfrpg/templates/actors/starship-sheet.html";
    }

    getData() {
        const data = super.getData();

        let tier = parseFloat(data.data.details.tier || 0);
        let tiers = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["tier"] = tier >= 1 ? String(tier) : tiers[tier] || 1;

        this._prepareStarshipSystems(data.actor.data.details.systems);
        this._getCrewData(data);

        return data;
    }

    /**
     * Prepare the details for this starship.
     * @param {Object} detials The details about this ship
     */
    _prepareStarshipSystems(details) {
        

        const systemsMap = {
            "bays": CONFIG.SFRPG.expansionBaySystems,
            "security": CONFIG.SFRPG.securitySystems
        };

        for (let [t, choices] of Object.entries(systemsMap)) {
            const detail = details[t];
            if (!detail) continue;
            let values = [];
            if (detail.value) {
                values = detail.value instanceof Array ? detail.value : [detail.value];
            }
            detail.selected = values.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            if (detail.custom) {
                detail.custom.split(';').forEach((c, i) => detail.selected[`custom${i + 1}`] = c.trim());
            }
            detail.cssClass = !isObjectEmpty(detail.selected) ? "" : "inactive";
        }
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

        const captainActors = crewData.captain.actors.map(crewId => game.actors.get(crewId));
        const chiefMateActors = crewData.chiefMate.actors.map(crewId => game.actors.get(crewId));
        const engineerActors = crewData.engineer.actors.map(crewId => game.actors.get(crewId));
        const gunnerActors = crewData.gunner.actors.map(crewId => game.actors.get(crewId));
        const magicOfficerActors = crewData.magicOfficer.actors.map(crewId => game.actors.get(crewId));
        const passengerActors = crewData.passenger.actors.map(crewId => game.actors.get(crewId));
        const pilotActors = crewData.pilot.actors.map(crewId => game.actors.get(crewId));
        const scienceOfficerActors = crewData.scienceOfficer.actors.map(crewId => game.actors.get(crewId));
        
        const crew = {
            captain: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": captainActors.length, "max": crewData.captain.limit > -1 ? crewData.captain.limit : "No limit"}), actors: captainActors, dataset: { type: "shipsCrew", role: "captain" }},
            pilot: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : "No limit"}), actors: pilotActors, dataset: { type: "shipsCrew", role: "pilot" }},
            gunners: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunners") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": gunnerActors.length, "max": crewData.gunner.limit > -1 ? crewData.gunner.limit : "No limit"}), actors: gunnerActors, dataset: { type: "shipsCrew", role: "gunner" }},
            engineers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": engineerActors.length, "max": crewData.engineer.limit > -1 ? crewData.engineer.limit : "No limit"}), actors: engineerActors, dataset: { type: "shipsCrew", role: "engineer" }},
            scienceOfficers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.ScienceOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": scienceOfficerActors.length, "max": crewData.scienceOfficer.limit > -1 ? crewData.scienceOfficer.limit : "No limit"}), actors: scienceOfficerActors, dataset: { type: "shipsCrew", role: "scienceOfficer" }},
            chiefMates: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.ChiefMates") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": chiefMateActors.length, "max": crewData.chiefMate.limit > -1 ? crewData.chiefMate.limit : "No limit"}), actors: chiefMateActors, dataset: { type: "shipsCrew", role: "chiefMate" }},
            magicOfficers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.MagicOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": magicOfficerActors.length, "max": crewData.magicOfficer.limit > -1 ? crewData.magicOfficer.limit : "No limit"}), actors: magicOfficerActors, dataset: { type: "shipsCrew", role: "magicOfficer" }},
            passengers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Passengers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : "No limit"}), actors: passengerActors, dataset: { type: "shipsCrew", role: "passenger" }}
        };

        data.crew = Object.values(crew);
    }

    /**
     * Process any flags that the actor might have that would affect the sheet .
     * 
     * @param {Object} data The data object to update with any flag data.
     * @param {Object} flags The set of flags for the Actor
     */
    async _processFlags(data, flags) {
        let newCrew = {
            captain: {
                limit: 1,
                actors: []
            },
            chiefMate: {
                limit: -1,
                actors: []
            },
            engineer: {
                limit: -1,
                actors: []
            },
            gunner: {
                limit: 0,
                actors: []
            },
            magicOfficer: {
                limit: -1,
                actors: []
            },
            passenger: {
                limit: -1,
                actors: []
            },
            pilot: {
                limit: 1,
                actors: []
            },
            scienceOfficer: {
                limit: -1,
                actors: []
            }
        };

        if (!flags?.sfrpg?.shipsCrew?.members) {
            await this.actor.update({
                "data.crew": newCrew
            });
            return newCrew;
        }

        for (const actorId of flags.sfrpg.shipsCrew.members) {
            const actor = game.actors.get(actorId);
            if (!actor) continue;

            let crewMember = actor.getFlag("sfrpg", "crewMember") || null;
            if (!crewMember) continue;

            if (crewMember.role === "captain") newCrew.captain.actors.push(actorId);
            else if (crewMember.role === "engineers") newCrew.engineer.actors.push(actorId);
            else if (crewMember.role === "gunners") newCrew.gunner.actors.push(actorId);
            else if (crewMember.role === "pilot") newCrew.pilot.actors.push(actorId);
            else if (crewMember.role === "scienceOfficers") newCrew.scienceOfficer.actors.push(actorId);
            else if (crewMember.role === "passengers") newCrew.passenger.actors.push(actorId);
        }

        await this.actor.update({
            "data.crew": newCrew
        });

        let cleanflags = duplicate(this.actor.data.flags);
        delete cleanflags.sfrpg.shipsCrew;

        await this.actor.update({
            "flags.sfrpg": cleanflags
        }, {recursive: false});
        
        return this.actor.data.data.crew;
    }

    /**
     * Organize and classify items for starship sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const arcs = {
            forward: { label: "Forward", items: [], dataset: { type: "starshipWeapon" }},
            starboard: { label: "Starboard", items: [], dataset: { type: "starshipWeapon" }},
            aft: { label: "Aft", items: [], dataset: { type: "starshipWeapon" }},
            port: { label: "Port", items: [], dataset: { type: "starshipWeapon" }},
            turret: { label: "Turret", items: [], dataset: { type: "starshipWeapon" }},
            unmounted: { label: "Not Mounted", items: [], dataset: { type: "starshipWeapon" }}
        };

        let [forward, starboard, aft, port, turret, unmounted, frame] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.type === "starshipFrame") arr[6].push(item);
            else {
                if (item.data.mount.arc === "forward") arr[0].push(item);
                else if (item.data.mount.arc === "starboard") arr[1].push(item);
                else if (item.data.mount.arc === "aft") arr[2].push(item);
                else if (item.data.mount.arc === "port") arr[3].push(item);
                else if (item.data.mount.arc === "turret") arr[4].push(item);
                else arr[5].push(item);
            }

            return arr;
        }, [[], [], [], [], [], [], []]);

        arcs.forward.items = forward;
        arcs.starboard.items = starboard;
        arcs.aft.items = aft;
        arcs.port.items = port;
        arcs.turret.items = turret;
        arcs.unmounted.items = unmounted;

        data.arcs = Object.values(arcs);

        const features = {
            frame: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Frame", {"current": frame.length}), items: [], hasActions: false, dataset: { type: "starshipFrame" } }
        };
        features.frame.items = frame;

        data.features = Object.values(features);

        data.activeFrame = frame.length > 0 ? frame[0] : null;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

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
    }

    /** @override */
    async _onDrop(event) {
        event.preventDefault();

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        if (!data) return false;

        // Case 1 - Dropped Item
        if (data.type === "Item")
            return this._onDropItem(event, data);
        
        // Case 2 - Dropped Actor
        if (data.type === "Actor")
            return this._onCrewDrop(event, data);
    }

    /**
     * Handle drop events for Items. 
     * 
     * @param {Event} event The originating click event
     * @param {object} data The data transfer object
     */
    async _onDropItem(event, data) {
        if (!this.actor.owner) return false;
        let itemData = await this._getItemDropData(event, data);

        const acceptedItems = ["starshipFrame", "starshipWeapon"];
        if (!acceptedItems.includes(itemData.type)) {
            let name = itemData.name;
            ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name }));
            return false;
        }

        return this.actor.createEmbeddedEntity("OwnedItem", itemData);
    }

    async _render(...args) {
        await super._render(...args);

        tippy('[data-tippy-content]', {
            allowHTML: true,
            arrow: false,
            placement: 'top-start',
            duration: [500, null],
            delay: [800, null]
        });
    }

    // TODO: Remove this once https://gitlab.com/foundrynet/foundryvtt/-/issues/2866
    // has been implemented
    /**
     * Get an items data.
     * 
     * @param {Event} event The originating drag event
     * @param {object} data The data trasfer object
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
            if (sameActor) return this._onSortItem(event, data.data);
            itemData = data.data;
        } else {
            let item = game.items.get(data.id);
            if (!item) return;
            itemData = item.data;
        }

        return duplicate(itemData);
    }

    /**
     * Handles drop events for the Crew list
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

        if (crewRole.limit === -1 || crewRole.actors.length < crewRole.limit) {
            crewRole.actors.push(data.id);

            if (oldRole) {
                const originalRole = crew[oldRole];
                originalRole.actors = originalRole.actors.filter(x => x != data.id);
            }
    
            await this.actor.update({
                "data.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(`You have reached the maximum amount of characters allowed for the role of ${targetRole}.`);
        }

        return true;
    }

    /**
     * Handles dragenter for the crews tab
     * @param {Event} event The originating dragenter event
     */
    _onCrewDragEnter(event) {
        $(event.target).css('background', "rgba(0,0,0,0.3)");
    }

    /**
     * Handles dragleave for the crews tab
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
            crewData[role].actors = crewData[role].actors.filter(x => x !== actorId);
            await this.actor.update({
                "data.crew": crewData
            });
        }
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const tiers = { "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let v = "data.details.tier";
        let tier = formData[v];
        tier = tiers[tier] || parseFloat(tier);
        if (tier) formData[v] = tier < 1 ? tier : parseInt(tier);

        super._updateObject(event, formData);
    }
}