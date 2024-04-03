import { SFRPG } from "../../config.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGMech extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        foundry.utils.mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "mech"],
            width: 715
        });

        return options;
    }

    get template() {
        return 'systems/sfrpg/templates/actors/mech-sheet-full.hbs';
    }

    async getData() {
        const data = await super.getData();

        const tier = parseFloat(data.system.details.tier || 0);
        data.labels["tier"] = tier >= 1 ? String(tier) : "0";

        return data;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HMTL object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

    }

    /**
     * Organize and classify items for starship sheets.
     *
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        /*
        const actorData = data.system;
        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.StarshipSheet.Inventory.Inventory"), items: [], dataset: { type: this.acceptedItemTypes }, allowAdd: true }
        };

        const starshipSystems = [
            "mechFrame",
            "mechLimb",
            "mechPowerCore",
            "mechPowerCoreTemplate",
            "mechWeapon",
            "mechAuxiliarySystem",
            "mechUpgrade"
        ];

        const [
            frame, // 0
            limb, // 1
            powerCore, // 2
            powerCoreTemplate, // 3,
            weapons, // 4
            auxiliarySystem, // 5
            upgrade, // 6
            cargo // 7
        ] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            if (!item.config) item.config = {
                isStack: item.system.quantity ? item.system.quantity > 1 : false,
                isOpen: item.type === "container" ? item.system.container.isOpen : true,
                isOnCooldown: item.system.recharge && !!item.system.recharge.value && (item.system.recharge.charged === false),
                hasAttack: item.type === "starshipWeapon",
                hasDamage: item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                hasUses: item.canBeUsed(),
                isCharged: !item.hasUses || item.getRemainingUses() <= 0 || !item.isOnCooldown,
                hasCapacity: item.hasCapacity()
            };

            if (item.config.hasCapacity) {
                item.config.capacityCurrent = item.getCurrentCapacity();
                item.config.capacityMaximum = item.getMaxCapacity();
            }

            if (item.config.hasAttack) {
                this._prepareAttackString(item);
            }

            if (item.config.hasDamage) {
                this._prepareDamageString(item);
            }

            if (item.type === "mechFrame") arr[0].push(item);
            else if (item.type === "mechLimb") arr[1].push(item);
            else if (item.type === "mechPowerCore") arr[2].push(item);
            else if (item.type === "mechpowerCoreTemplate") arr[3].push(item);
            else if (item.type === "mechWeapon") {
                arr[4].push(item);
            }
            else if (item.type === "mechauxiliarySystem") arr[5].push(item);
            else if (item.type === "mechUpgrade") arr[6].push(item);
            else if (this.acceptedItemTypes.includes(item.type)) arr[7].push(item);

            return arr;
        }, [[], [], [], [], [], [], [], []]);

        this.processItemContainment(cargo, function(itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory;

        for (const item of cargo) {
            item.config.isStack = item.system.quantity ? item.system.quantity > 1 : false;
            item.config.isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;
        }

        for (const weapon of weapons) {
            weapon.config.hasCapacity = (
                weapon.system.weaponType === "tracking"
                || weapon.system.special["mine"]
                || weapon.system.special["transposition"]
                || weapon.system.special["orbital"]
                || weapon.system.special["rail"]
                || weapon.system.special["forcefield"]
                || weapon.system.special["limited"]
            );

            if (weapon.config.hasCapacity) {
                weapon.config.capacityCurrent = weapon.getCurrentCapacity();
                weapon.config.capacityMaximum = weapon.getMaxCapacity();
            }
        }

        const weaponMounts = this.actor.system.frame?.system?.weaponMounts;
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

        const features = {
            frame: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.Frame", { current: frame.length }),
                items: frame,
                hasActions: false,
                dataset: { type: "starshipFrame" }
            },
            powerCores: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.PowerCores"),
                items: powerCores,
                hasActions: false,
                dataset: { type: "starshipPowerCore" }
            },
            thrusters: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.Thrusters"),
                items: thrusters,
                hasActions: false,
                dataset: { type: "starshipThruster" }
            },
            primarySystems: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.PrimarySystems"),
                items: primarySystems,
                hasActions: false,
                dataset: { type: starshipSystems.join(",") }
            },
            otherSystems: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.OtherSystems"),
                items: otherSystems,
                hasActions: false,
                dataset: { type: "starshipOtherSystem" }
            },
            securitySystems: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.SecuritySystems"),
                items: securitySystems,
                hasActions: false,
                dataset: { type: "starshipSecuritySystem" }
            },
            expansionBays: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.ExpansionBays", {
                    current: expansionBays.length,
                    max: actorData.attributes.expansionBays.value
                }),
                items: expansionBays,
                hasActions: false,
                dataset: { type: "starshipExpansionBay" }
            },
            specialAbilities: {
                category: game.i18n.format("SFRPG.StarshipSheet.Features.SpecialAbilities"),
                items: specialAbilities,
                hasActions: false,
                dataset: { type: "starshipSpecialAbility" }
            },
            resources: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"),
                items: actorResources,
                hasActions: false,
                dataset: { type: "actorResource" }
            }
        };

        data.features = Object.values(features);

        data.activeFrame = frame.length > 0 ? frame[0] : null;
        data.hasPower = powerCores.length > 0;
        data.hasThrusters = thrusters.filter(x => !x.system.isBooster).length > 0;

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

        if (!this.actor.system.crew.useNPCCrew) {
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
        } */
    }
}
