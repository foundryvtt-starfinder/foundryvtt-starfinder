import { ActorSheetSFRPG } from "./base.js";

/**
 * An Actor sheet for a starship in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGStarship extends ActorSheetSFRPG {
    static AcceptedEquipment = "augmentation,consumable,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon";

    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "starship"],
            width: 700,
            height: 800
        });

        return options;
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

        const captainActors = crewData.captain.actorIds.map(crewId => game.actors.get(crewId));
        const chiefMateActors = crewData.chiefMate.actorIds.map(crewId => game.actors.get(crewId));
        const engineerActors = crewData.engineer.actorIds.map(crewId => game.actors.get(crewId));
        const gunnerActors = crewData.gunner.actorIds.map(crewId => game.actors.get(crewId));
        const magicOfficerActors = crewData.magicOfficer.actorIds.map(crewId => game.actors.get(crewId));
        const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const scienceOfficerActors = crewData.scienceOfficer.actorIds.map(crewId => game.actors.get(crewId));

        const localizedNoLimit = game.i18n.format("SFRPG.StarshipSheet.Crew.UnlimitedMax");
        
        const crew = {
            captain: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": captainActors.length, "max": crewData.captain.limit > -1 ? crewData.captain.limit : localizedNoLimit}), actors: captainActors, dataset: { type: "shipsCrew", role: "captain" }},
            pilot: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit}), actors: pilotActors, dataset: { type: "shipsCrew", role: "pilot" }},
            gunners: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunners") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": gunnerActors.length, "max": crewData.gunner.limit > -1 ? crewData.gunner.limit : localizedNoLimit}), actors: gunnerActors, dataset: { type: "shipsCrew", role: "gunner" }},
            engineers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": engineerActors.length, "max": crewData.engineer.limit > -1 ? crewData.engineer.limit : localizedNoLimit}), actors: engineerActors, dataset: { type: "shipsCrew", role: "engineer" }},
            scienceOfficers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.ScienceOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": scienceOfficerActors.length, "max": crewData.scienceOfficer.limit > -1 ? crewData.scienceOfficer.limit : localizedNoLimit}), actors: scienceOfficerActors, dataset: { type: "shipsCrew", role: "scienceOfficer" }},
            chiefMates: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.ChiefMates") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": chiefMateActors.length, "max": crewData.chiefMate.limit > -1 ? crewData.chiefMate.limit : localizedNoLimit}), actors: chiefMateActors, dataset: { type: "shipsCrew", role: "chiefMate" }},
            magicOfficers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.MagicOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": magicOfficerActors.length, "max": crewData.magicOfficer.limit > -1 ? crewData.magicOfficer.limit : localizedNoLimit}), actors: magicOfficerActors, dataset: { type: "shipsCrew", role: "magicOfficer" }},
            passengers: { label: game.i18n.format("SFRPG.StarshipSheet.Crew.Passengers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : localizedNoLimit}), actors: passengerActors, dataset: { type: "shipsCrew", role: "passenger" }}
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
                actorIds: []
            },
            chiefMate: {
                limit: -1,
                actorIds: []
            },
            engineer: {
                limit: -1,
                actorIds: []
            },
            gunner: {
                limit: 0,
                actorIds: []
            },
            magicOfficer: {
                limit: -1,
                actorIds: []
            },
            passenger: {
                limit: -1,
                actorIds: []
            },
            pilot: {
                limit: 1,
                actorIds: []
            },
            scienceOfficer: {
                limit: -1,
                actorIds: []
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

            if (crewMember.role === "captain") newCrew.captain.actorIds.push(actorId);
            else if (crewMember.role === "engineers") newCrew.engineer.actorIds.push(actorId);
            else if (crewMember.role === "gunners") newCrew.gunner.actorIds.push(actorId);
            else if (crewMember.role === "pilot") newCrew.pilot.actorIds.push(actorId);
            else if (crewMember.role === "scienceOfficers") newCrew.scienceOfficer.actorIds.push(actorId);
            else if (crewMember.role === "passengers") newCrew.passenger.actorIds.push(actorId);
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

    _createLabel(localizationKey, items, mounts) {
        const localizedLightSlots = ((mounts?.lightSlots || 0) > 0) ? game.i18n.format("SFRPG.StarshipSheet.Weapons.LightSlots", {current: items.filter(x => x.data.class === "light").length, max: mounts.lightSlots}) : null;
        const localizedHeavySlots = ((mounts?.heavySlots || 0) > 0) ? game.i18n.format("SFRPG.StarshipSheet.Weapons.HeavySlots", {current: items.filter(x => x.data.class === "heavy").length, max: mounts.heavySlots}) : null;
        const localizedCapitalSlots = ((mounts?.capitalSlots || 0) > 0) ? game.i18n.format("SFRPG.StarshipSheet.Weapons.CapitalSlots", {current: items.filter(x => x.data.class === "capital").length, max: mounts.capitalSlots}) : null;

        let slots = "";
        if (localizedLightSlots) {
            slots += localizedLightSlots;
        }
        if (localizedHeavySlots) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += localizedHeavySlots;
        }
        if (localizedCapitalSlots) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += localizedCapitalSlots;
        }
        if (slots === "") {
            slots = game.i18n.format("SFRPG.StarshipSheet.Weapons.NotAvailable");
        }

        return game.i18n.format(localizationKey, {slots: slots});
    }

    /**
     * Organize and classify items for starship sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const inventory = {
            inventory: { label: "Inventory", items: [], dataset: { type: ActorSheetSFRPGStarship.AcceptedEquipment }, allowAdd: true }
        };

        let [forward, starboard, aft, port, turret, unmounted, frame, equipment] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.type === "starshipFrame") arr[6].push(item);
            else {
                const weaponArc = item?.data?.mount?.arc;
                if (weaponArc === "forward") arr[0].push(item);
                else if (weaponArc === "starboard") arr[1].push(item);
                else if (weaponArc === "aft") arr[2].push(item);
                else if (weaponArc === "port") arr[3].push(item);
                else if (weaponArc === "turret") arr[4].push(item);
                else if (ActorSheetSFRPGStarship.AcceptedEquipment.includes(item.type)) arr[7].push(item);
                else arr[5].push(item);
            }

            return arr;
        }, [[], [], [], [], [], [], [], []]);

        this.processItemContainment(equipment, function (itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory;

        const weaponMounts = this.actor.data.data.frame?.data?.weaponMounts;
        const hasForward = weaponMounts?.forward?.lightSlots || weaponMounts?.forward?.heavySlots || weaponMounts?.forward?.capitalSlots;
        const hasStarboard = weaponMounts?.starboard?.lightSlots || weaponMounts?.starboard?.heavySlots || weaponMounts?.starboard?.capitalSlots;
        const hasPort = weaponMounts?.port?.lightSlots || weaponMounts?.port?.heavySlots || weaponMounts?.port?.capitalSlots;
        const hasAft = weaponMounts?.aft?.lightSlots || weaponMounts?.aft?.heavySlots || weaponMounts?.aft?.capitalSlots;
        const hasTurret = weaponMounts?.turret?.lightSlots || weaponMounts?.turret?.heavySlots || weaponMounts?.turret?.capitalSlots;

        const forwardLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.ForwardArc", forward, weaponMounts?.forward);
        const starboardLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.StarboardArc", starboard, weaponMounts?.starboard);
        const portLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.PortArc", port, weaponMounts?.port);
        const aftLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.AftArc", aft, weaponMounts?.aft);
        const turretLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.Turret", turret, weaponMounts?.turret);

        const arcs = {
            forward: { label: forwardLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasForward }},
            starboard: { label: starboardLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasStarboard }},
            port: { label: portLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasPort }},
            aft: { label: aftLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasAft }},
            turret: { label: turretLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasTurret }},
            unmounted: { label: game.i18n.format("SFRPG.StarshipSheet.Weapons.NotMounted"), items: [], dataset: { type: "starshipWeapon", allowAdd: true }}
        };

        arcs.forward.items = forward;
        arcs.starboard.items = starboard;
        arcs.port.items = port;
        arcs.aft.items = aft;
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
            if (!data) {
                return false;
            }
        } catch (err) {
            return false;
        }

        // Case - Dropped Actor
        if (data.type === "Actor") {
            return this._onCrewDrop(event, data);
        } else if (data.type === "Item") {
            if (ActorSheetSFRPGStarship.AcceptedEquipment.includes(data.data.type)) {
                return super._onDrop(event);
            } else {
                ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: data.data.name }));
                return false;
            }
        }
    
        return false;
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
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
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