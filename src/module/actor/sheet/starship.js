import { ActorSheetSFRPG } from "./base.js";
import { AddEditSkillDialog } from "../../apps/edit-skill-dialog.js";
import { ChoiceDialog } from "../../apps/choice-dialog.js";

/**
 * An Actor sheet for a starship in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGStarship extends ActorSheetSFRPG {
    static AcceptedEquipment = "augmentation,consumable,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon,weaponAccessory";

    static StarshipActionsCache = null;

    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "starship"],
            width: 700,
            height: 800
        });

        return options;
    }

    constructor(...args) {
        super(...args);
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/starship-sheet-limited.html";
        return "systems/sfrpg/templates/actors/starship-sheet-full.html";
    }

    getData() {
        const data = super.getData();

        let tier = parseFloat(data.data.details.tier || 0);
        let tiers = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["tier"] = tier >= 1 ? String(tier) : tiers[tier] || 1;

        this._getCrewData(data);

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
        const numLightWeapons = items.filter(x => x.data.class === "light").length;
        const numHeavyWeapons = items.filter(x => x.data.class === "heavy").length;
        const numCapitalWeapons = items.filter(x => x.data.class === "capital").length;
        const numSpinalWeapons = items.filter(x => x.data.class === "spinal").length;

        const maxLightWeapons = (mounts?.lightSlots || 0);
        const maxHeavyWeapons = (mounts?.heavySlots || 0);
        const maxCapitalWeapons = (mounts?.capitalSlots || 0);
        const maxSpinalWeapons = (mounts?.spinalSlots || 0);

        let slots = "";
        if (numLightWeapons + maxLightWeapons > 0) {
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.LightSlots", {current: numLightWeapons, max: maxLightWeapons});
        }
        if (numHeavyWeapons + maxHeavyWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.HeavySlots", {current: numHeavyWeapons, max: maxHeavyWeapons});
        }
        if (numCapitalWeapons + maxCapitalWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.CapitalSlots", {current: numCapitalWeapons, max: maxCapitalWeapons});
        }
        if (numSpinalWeapons + maxSpinalWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.SpinalSlots", {current: numSpinalWeapons, max: maxSpinalWeapons});
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
            inventory: { label: game.i18n.localize("SFRPG.StarshipSheet.Inventory.Inventory"), items: [], dataset: { type: ActorSheetSFRPGStarship.AcceptedEquipment }, allowAdd: true }
        };

        const starshipSystems = [
            "starshipAblativeArmor",
            "starshipArmor",
            "starshipComputer",
            "starshipCrewQuarter",
            "starshipDefensiveCountermeasure",
            "starshipDriftEngine",
            "starshipFortifiedHull",
            "starshipReinforcedBulkhead",
            "starshipSensor",
            "starshipShield"
        ];

        //   0        1          2    3     4       5          6      7           8          9               10            11               12             13
        let [forward, starboard, aft, port, turret, unmounted, frame, powerCores, thrusters, primarySystems, otherSystems, securitySystems, expansionBays, cargo] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.type === "starshipWeapon") {
                const weaponArc = item?.data?.mount?.arc;
                if (weaponArc === "forward") arr[0].push(item);
                else if (weaponArc === "starboard") arr[1].push(item);
                else if (weaponArc === "aft") arr[2].push(item);
                else if (weaponArc === "port") arr[3].push(item);
                else if (weaponArc === "turret") arr[4].push(item);
                else arr[5].push(item);
            }
            else if (item.type === "starshipFrame") arr[6].push(item);
            else if (item.type === "starshipPowerCore") arr[7].push(item);
            else if (item.type === "starshipThruster") arr[8].push(item);
            else if (starshipSystems.includes(item.type)) arr[9].push(item);
            else if (item.type === "starshipOtherSystem") arr[10].push(item);
            else if (item.type === "starshipSecuritySystem") arr[11].push(item);
            else if (item.type === "starshipExpansionBay") arr[12].push(item);
            else if (ActorSheetSFRPGStarship.AcceptedEquipment.includes(item.type)) arr[13].push(item);

            return arr;
        }, [[], [], [], [], [], [], [], [], [], [], [], [], [], []]);

        this.processItemContainment(cargo, function (itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory;

        let totalValue = 0;
        for (const item of cargo) {
            totalValue += (item?.data?.quantity || 0) * (item?.data?.price || 0);
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.isOpen = item.data.container?.isOpen === undefined ? true : item.data.container.isOpen;
        }
        data.inventoryValue = Math.floor(totalValue);

        const weapons = [].concat(forward, starboard, port, aft, turret);
        for (const weapon of weapons) {
            weapon.hasCapacity = (
                weapon.data.weaponType === "tracking"
                || weapon.data.special["mine"]
                || weapon.data.special["transposition"]
                || weapon.data.special["orbital"]
                || weapon.data.special["rail"]
                || weapon.data.special["forcefield"]
                || weapon.data.special["limited"]
            );
        }

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
            frame: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Frame", {"current": frame.length}), items: frame, hasActions: false, dataset: { type: "starshipFrame" } },
            powerCores: { label: game.i18n.format("SFRPG.StarshipSheet.Features.PowerCores"), items: powerCores, hasActions: false, dataset: { type: "starshipPowerCore" } },
            thrusters: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Thrusters"), items: thrusters, hasActions: false, dataset: { type: "starshipThruster" } },
            primarySystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.PrimarySystems"), items: primarySystems, hasActions: false, dataset: { type: starshipSystems.join(',') } },
            otherSystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.OtherSystems"), items: otherSystems, hasActions: false, dataset: { type: "starshipOtherSystem" } },
            securitySystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.SecuritySystems"), items: securitySystems, hasActions: false, dataset: { type: "starshipSecuritySystem" } },
            expansionBays: { label: game.i18n.format("SFRPG.StarshipSheet.Features.ExpansionBays", {current: expansionBays.length, max: data.data.attributes.expansionBays.value}), items: expansionBays, hasActions: false, dataset: { type: "starshipExpansionBay" } }
        };

        data.features = Object.values(features);

        data.activeFrame = frame.length > 0 ? frame[0] : null;
        data.hasPower = powerCores.length > 0;
        data.hasThrusters = thrusters.filter(x => !x.data.isBooster).length > 0;

        data.prefixTable = {
            starshipAblativeArmor:              game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipAblativeArmors"),
            starshipArmor:                      game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipArmors"),
            starshipComputer:                   game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipComputers"),
            starshipCrewQuarter:                game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipCrewQuarters"),
            starshipDefensiveCountermeasure:    game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipDefensiveCountermeasures"),
            starshipDriftEngine:                game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipDriftEngine"),
            starshipExpansionBay:               game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipExpansionBays"),
            starshipFortifiedHull:              game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipFortifiedHulls"),
            starshipFrame:                      game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipFrames"),
            starshipOtherSystem:                game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOtherSystems"),
            starshipPowerCore:                  game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipPowerCores"),
            starshipReinforcedBulkhead:         game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipReinforcedBulkheads"),
            starshipSecuritySystem:             game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipSecuritySystems"),
            starshipSensor:                     game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipSensors"),
            starshipShield:                     game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipShields"),
            starshipThruster:                   game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipThrusters"),
            starshipWeapon:                     game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipWeapons")
        };

        if (!this.actor.data.data.crew.useNPCCrew) {
            data.actions = ActorSheetSFRPGStarship.StarshipActionsCache;
        } else {
            data.actions = {
                captain: ActorSheetSFRPGStarship.StarshipActionsCache.captain,
                pilot: ActorSheetSFRPGStarship.StarshipActionsCache.pilot,
                gunner: ActorSheetSFRPGStarship.StarshipActionsCache.gunner,
                engineer: ActorSheetSFRPGStarship.StarshipActionsCache.engineer,
                scienceOfficer: ActorSheetSFRPGStarship.StarshipActionsCache.scienceOfficer,
                chiefMate: ActorSheetSFRPGStarship.StarshipActionsCache.chiefMate,
                magicOfficer: ActorSheetSFRPGStarship.StarshipActionsCache.magicOfficer
            };
        }
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
        html.find('.crew-view').click(event => this._onActorView(event));

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

        html.find('.action .action-name h4').click(event => this._onActionRoll(event));
        html.find('.action .action-image').click(event => this._onActionRoll(event));
        
        html.find('.skill-create').click(ev => this._onCrewSkillCreate(ev));
        html.find('.skill-delete').click(this._onCrewSkillDelete.bind(this));
        html.find('.crew-role-numberOfUses').change(this._onCrewNumberOfUsesChanged.bind(this));
        html.find('.crew-skill-mod').change(this._onCrewSkillModifierChanged.bind(this));
        html.find('.crew-skill-ranks').change(this._onCrewSkillRanksChanged.bind(this));

        html.find('.critical-edit').click(this._onEditAffectedCriticalRoles.bind(this));

        html.find('.reload').click(this._onWeaponReloadClicked.bind(this));
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
            const rawItemData = await this._getItemDropData(event, data);

            if (rawItemData.type.startsWith("starship")) {
                return this.actor.createEmbeddedEntity("Item", rawItemData);
            } else if (ActorSheetSFRPGStarship.AcceptedEquipment.includes(rawItemData.type)) {
                return this.processDroppedData(event, data);
            } else {
                ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rawItemData.name }));
                return false;
            }
        } else if (data.type === "ItemCollection") {
            const starshipItems = [];
            const acceptedItems = [];
            const rejectedItems = [];
            for (const item of data.items) {
                if (item.type.startsWith("starship")) {
                    starshipItems.push(item);
                } else if (ActorSheetSFRPGStarship.AcceptedEquipment.includes(item.type)) {
                    acceptedItems.push(item);
                } else {
                    rejectedItems.push(item);
                }
            }

            if (starshipItems.length > 0) {
                await this.actor.createEmbeddedEntity("Item", starshipItems);
            }

            if (acceptedItems.length > 0) {
                const acceptedItemData = duplicate(data);
                acceptedItemData.items = acceptedItems;
                await this.processDroppedData(event, data);
            }

            if (rejectedItems.length > 0) {
                const rejectedItemNames = rejectedItems.map(x => x.name).join(", ");
                ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rejectedItemNames }));
            }
            
            return true;
        }
    
        return false;
    }
    
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
           let sameActor = data.actorId === actor.id;
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

    async _render(...args) {
        await super._render(...args);

        if (this.rendered) {
            tippy('[data-tippy-content]', {
                allowHTML: true,
                arrow: false,
                placement: 'top-start',
                duration: [500, null],
                delay: [800, null],
                maxWidth: 600
            });
        }
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
            ui.notifications.error(game.i18n.format("SFRPG.StarshipSheet.Crew.CrewLimitReached", {targetRole: targetRole}));
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
        this.actor.removeFromCrew(actorId);
    }

    /**
     * Opens the sheet of a crew member.
     *
     * @param {Event} event The originating click event
     */
    async _onActorView(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        let actor = game.actors.get(actorId);
        actor.sheet.render(true);
    }

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    async _onActionRoll(event) {
        event.preventDefault();
        const actionId = event.currentTarget.closest('.action').dataset.actionId;
        return this.actor.useStarshipAction(actionId);
    }

    async _onCrewSkillCreate(event) {
        event.preventDefault();

        const roleId = $(event.currentTarget).closest('li').data('role');

        const results = await ChoiceDialog.show(
            "Add Skill",
            "Select the skill you wish to add to the role of " + roleId + "?",
            {
                skill: {
                    name: "Skill",
                    options: Object.values(CONFIG.SFRPG.skills),
                    default: Object.values(CONFIG.SFRPG.skills)[0]
                }
            }
        );

        if (results.resolution === 'cancel') {
            return;
        }

        let skillId = null;
        for(const [key, value] of Object.entries(CONFIG.SFRPG.skills)) {
            if (value === results.result.skill) {
                skillId = key;
                break;
            }
        }

        if (!skillId) {
            return;
        }

        const crewData = duplicate(this.actor.data.data.crew);
        crewData.npcData[roleId].skills[skillId] = {
            isTrainedOnly: false,
            hasArmorCheckPenalty: false,
            value: 0,
            misc: 0,
            ranks: 0,
            ability: "int",
            subname: "",
            mod: 0,
            enabled: true
        };
        
        await this.actor.update({"data.crew": crewData});
    }

    async _onCrewSkillDelete(event) {
        event.preventDefault();
        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        this.actor.update({ [`data.crew.npcData.${roleId}.skills.-=${skillId}`]: null });
    }

    async _onCrewNumberOfUsesChanged(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const roleId = $(event.currentTarget).closest('li').data('role');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }

        await this.actor.update({ [`data.crew.npcData.${roleId}.numberOfUses`]: parsedValue });
        this.render(false);
    }

    async _onCrewSkillModifierChanged(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }

        await this.actor.update({ [`data.crew.npcData.${roleId}.skills.${skillId}.mod`]: parsedValue });
        this.render(false);
    }

    async _onCrewSkillRanksChanged(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }

        await this.actor.update({ [`data.crew.npcData.${roleId}.skills.${skillId}.ranks`]: parsedValue });
        this.render(false);
    }

    /**
     * Edit critical roles.
     * 
     * @param {Event} event The originating click event
     */
    async _onEditAffectedCriticalRoles(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        const affectedSystem = $(event.currentTarget).data('system');

        const options = [game.i18n.localize("No"), game.i18n.localize("Yes")];

        const results = await ChoiceDialog.show(
            game.i18n.format("SFRPG.StarshipSheet.Critical.EditTitle"),
            game.i18n.format("SFRPG.StarshipSheet.Critical.EditMessage"),
            {
                captain: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Captain"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["captain"] ? options[1] : options[0]
                },
                pilot: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Pilot"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["pilot"] ? options[1] : options[0]
                },
                engineer: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Engineer"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["engineer"] ? options[1] : options[0]
                },
                gunner: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Gunner"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["gunner"] ? options[1] : options[0]
                },
                scienceOfficer: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.ScienceOfficer"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["scienceOfficer"] ? options[1] : options[0]
                },
                magicOfficer: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.MagicOfficer"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["magicOfficer"] ? options[1] : options[0]
                },
                chiefMate: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.ChiefMate"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["chiefMate"] ? options[1] : options[0]
                },
                openCrew: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.OpenCrew"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["openCrew"] ? options[1] : options[0]
                },
                minorCrew: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.MinorCrew"),
                    options: options,
                    default: this.actor.data.data.attributes.systems[affectedSystem].affectedRoles["minorCrew"] ? options[1] : options[0]
                }
            }
        );

        const currentSystem = duplicate(this.actor.data.data.attributes.systems[affectedSystem]);
        currentSystem.affectedRoles = {
            captain: results.result.captain === options[1],
            pilot: results.result.pilot === options[1],
            engineer: results.result.engineer === options[1],
            gunner: results.result.gunner === options[1],
            scienceOfficer: results.result.scienceOfficer === options[1],
            magicOfficer: results.result.magicOfficer === options[1],
            chiefMate: results.result.chiefMate === options[1],
            openCrew: results.result.openCrew === options[1],
            minorCrew: results.result.minorCrew === options[1]
        };

        await this.actor.update({[`data.attributes.systems.${affectedSystem}`]: currentSystem});
    }

    async _onWeaponReloadClicked(event) {
        event.preventDefault();
        
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        // Render the chat card template
        const templateData = {
            actor: this.actor,
            item: item,
            tokenId: this.actor.token?.id,
            action: "SFRPG.ChatCard.ItemActivation.Reloads",
            cost: game.i18n.localize("SFRPG.Items.ShipWeapon.ReloadCost")
        };

        const template = `systems/sfrpg/templates/chat/item-action-card.html`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
        
        return item.update({'data.capacity.value': item.data.data.capacity.max});
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

        return super._updateObject(event, formData);
    }

    static ensureStarshipActions() {
        /** Populate the starship actions cache. */
        ActorSheetSFRPGStarship.StarshipActionsCache = {};
        const tempCache = {};

        console.log("SFRPG | Initializing starship actions.");
        const starshipPackKey = game.settings.get("sfrpg", "starshipActionsSource");
        const starshipActions = game.packs.get(starshipPackKey);
        starshipActions.getIndex().then(async (indices) => {
            for (const index of indices) {
                const entry = await starshipActions.getDocument(index._id);
                const role = entry.data.data.role;

                if (!tempCache[role]) {
                    tempCache[role] = {label: CONFIG.SFRPG.starshipRoleNames[role], actions: []};
                }

                tempCache[role].actions.push(entry);
            }

            /** Sort them by order. */
            for (const [roleKey, roleData] of Object.entries(tempCache)) {
                roleData.actions.sort(function(a, b){return a.data.order - b.data.order});
            }

            const desiredOrder = ["captain", "pilot", "gunner", "engineer", "scienceOfficer", "chiefMate", "magicOfficer", "openCrew", "minorCrew"];
            /** Automatically append any missing elements to the list at the end, in case new roles are added in the future. */
            for (const key of Object.keys(tempCache)) {
                if (!desiredOrder.includes(key)) {
                    desiredOrder.push(key);
                }
            }

            for (const key of desiredOrder) {
                ActorSheetSFRPGStarship.StarshipActionsCache[key] = tempCache[key];
            }
        });
    }
}