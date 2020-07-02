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
        this._processFlags(data, data.actor.flags);

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
     * @param {Obejct} data The data object to update with any flag data.
     * @param {Object} flags The set of flags for the Actor
     */
    _processFlags(data, flags) {
        let sfrpg = flags["sfrpg"];

        if (!sfrpg) sfrpg = {};
        if (!sfrpg.shipsCrew) sfrpg.shipsCrew = {};
        if (!sfrpg.shipsCrew.members) sfrpg.shipsCrew.members = [];
        
        // TODO: There are two more roles added in the Character Operations Manual that need to be added.
        const crew = {
            pilot: { label: "Pilot", actors: [], dataset: { type: "shipsCrew", role: "pilot" }},
            captain: { label: "Captain", actors: [], dataset: { type: "shipsCrew", role: "captain" }},
            gunners: { label: "Gunners", actors: [], dataset: { type: "shipsCrew", role: "gunners" }},
            engineers: { label: "Engineers", actors: [], dataset: { type: "shipsCrew", role: "engineers" }},
            scienceOfficers: { label: "Science Officers", actors: [], dataset: { type: "shipsCrew", role: "scienceOfficers" }},
            passengers: { label: "Passengers", actors: [], dataset: { type: "shipsCrew", role: "passengers" }}
        }

        let [captian, engineers, gunners, pilot, scienceOfficers, passengers] = sfrpg.shipsCrew.members.reduce((arr, id) => {
            let actor = game.actors.get(id);
            
            if (!actor) return arr;

            let crewMember = actor.getFlag("sfrpg", "crewMember") || null;
            if (!crewMember) return arr;

            actor.data.img = actor.data.img || DEFAULT_TOKEN;

            if (crewMember.role === "captain") arr[0].push(actor);
            else if (crewMember.role === "engineers") arr[1].push(actor);
            else if (crewMember.role === "gunners") arr[2].push(actor);
            else if (crewMember.role === "pilot") arr[3].push(actor);
            else if (crewMember.role === "scienceOfficers") arr[4].push(actor);
            else if (crewMember.role === "passengers") arr[5].push(actor);

            return arr;

        }, [[],[],[],[],[],[]]);

        crew.captain.actors = captian;
        crew.engineers.actors = engineers;
        crew.gunners.actors = gunners;
        crew.pilot.actors = pilot;
        crew.scienceOfficers.actors = scienceOfficers;
        crew.passengers.actors = passengers;

        data.crew = Object.values(crew);
    }

    /**
     * Organize and classify items for starship sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const arcs = {
            foward: { label: "Forward", items: [], dataset: { type: "starshipWeapon" }},
            starboard: { label: "Starboard", items: [], dataset: { type: "starshipWeapon" }},
            aft: { label: "Aft", items: [], dataset: { type: "starshipWeapon" }},
            port: { label: "Port", items: [], dataset: { type: "starshipWeapon" }},
            turret: { label: "Turret", items: [], dataset: { type: "starshipWeapon" }},
            unmounted: { label: "Not Mounted", items: [], dataset: { type: "starshipWeapon" }}
        };

        let [forward, starboard, aft, port, turret, unmounted] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.data.mount.arc === "forward") arr[0].push(item);
            else if (item.data.mount.arc === "starboard") arr[1].push(item);
            else if (item.data.mount.arc === "aft") arr[2].push(item);
            else if (item.data.mount.arc === "port") arr[3].push(item);
            else if (item.data.mount.arc === "turret") arr[4].push(item);
            else arr[5].push(item);

            return arr;
        }, [[], [], [], [], [], []]);

        arcs.foward.items = forward;
        arcs.starboard.items = starboard;
        arcs.aft.items = aft;
        arcs.port.items = port;
        arcs.turret.items = turret;
        arcs.unmounted.items = unmounted;

        data.arcs = Object.values(arcs);
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        //html.find('.crew-name').click(this._onChangeCrewRole.bind(this));
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

        if (itemData.type !== "starshipWeapon") {
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

        // let data;
        // try {
        //     data = JSON.parse(event.dataTransfer.getData('text/plain'));
        //     // Item's should have already been handled by the base class. 
        //     // We only want to continue if there is an Actor being dropped
        //     // on the sheet.
            
        //     if (data.type !== "Actor") return;
        // } catch (err) {
        //     return false;
        // }

        if (!data.id) return false;

        let c = this.actor.getFlag("sfrpg","shipsCrew");
        let crew;

        if (c) crew = duplicate(c);
        else crew = {
            members: []
        };

        if (!crew.members) {
            crew.members = [data.id];
        } else if (!crew.members.includes(data.id)) {
            crew.members.push(data.id);
        }
        
        let actor = game.actors.get(data.id);

        if (!actor) return false;

        let role = event.target.dataset.role;

        await actor.setCrewMemberRole(this.actor.id, role);
        this.actor.update({
            "flags.sfrpg.shipsCrew": crew
        }).then(this.render(false));

        return false;
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
     * Handles updating this crew's role on the ship.
     * 
     * @param {Event} event The originating click event
     */
    async _onChangeCrewRole(event) {
        event.preventDefault();
        
        const actorId = event.currentTarget.parentElement.dataset.actorId;
        const actor = game.actors.get(actorId);

        await actor.setCrewMemberRole(this.actor.id);        
    }

    /**
     * Remove an actor from the crew.
     * 
     * @param {Event} event The originating click event
     */
    async _onRemoveFromCrew(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        const actor = game.actors.get(actorId);

        await actor.removeFromCrew();
        
        let shipsCrew = this.actor.getFlag('sfrpg', 'shipsCrew');

        if (!shipsCrew) return;
        
        let updateData = shipsCrew.members.filter((val) => val !== actor.id);

        await this.actor.update({'flags.sfrpg.shipsCrew.members': updateData});
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