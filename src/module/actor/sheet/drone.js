import { SFRPG } from "../../config.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGDrone extends ActorSheetSFRPG {
    constructor(...args) {
        super(...args);

        this.acceptedItemTypes.push(...SFRPG.droneDefinitionItemTypes);
        this.acceptedItemTypes.push(...SFRPG.physicalItemTypes);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        foundry.utils.mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "drone"],
            width: 715
            // height: 830
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.hbs";
        return path + "drone-sheet.hbs";
    }

    async getData() {
        const sheetData = await super.getData();

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     *
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const actorData = data.system;

        let weaponLabel = "";
        if (data.system.attributes.weaponMounts.melee.max > 0 && data.system.attributes.weaponMounts.ranged.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.Both", {
                meleeCurrent: data.system.attributes.weaponMounts.melee.current,
                meleeMax: data.system.attributes.weaponMounts.melee.max,
                rangedCurrent: data.system.attributes.weaponMounts.ranged.current,
                rangedMax: data.system.attributes.weaponMounts.ranged.max
            });
        } else if (data.system.attributes.weaponMounts.melee.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.MeleeOnly", {
                meleeCurrent: data.system.attributes.weaponMounts.melee.current,
                meleeMax: data.system.attributes.weaponMounts.melee.max
            });
        } else if (data.system.attributes.weaponMounts.ranged.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.RangedOnly", {
                rangedCurrent: data.system.attributes.weaponMounts.ranged.current,
                rangedMax: data.system.attributes.weaponMounts.ranged.max
            });
        } else {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.None");
        }

        const armorUpgradesLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.ArmorUpgrades", {
            current: data.system.attributes.armorSlots.current,
            max: data.system.attributes.armorSlots.max
        });

        const cargoLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.CarriedItems");

        const inventory = {
            weapon: {
                label: weaponLabel,
                items: [],
                dataset: { type: "weapon" },
                allowAdd: true
            },
            ammunition: {
                label: game.i18n.format(SFRPG.itemTypes["ammunition"]),
                items: [],
                dataset: { type: "ammunition" },
                allowAdd: true
            },
            upgrade: {
                label: armorUpgradesLabel,
                items: [],
                dataset: { type: "upgrade" },
                allowAdd: true
            },
            cargo: { label: cargoLabel, items: [], dataset: { type: "goods" } }
        };

        const [
            items, // 0
            feats, // 1
            chassis, // 2
            mods, // 3
            conditionItems, // 4
            actorResources // 5
        ] = data.items.reduce(
            (arr, item) => {
                item.img = item.img || DEFAULT_TOKEN;

                item.config = {
                    isStack: item.system.quantity ? item.system.quantity > 1 : false,
                    isOpen: item.type === "container" ? item.system.container.isOpen : true,
                    isOnCooldown: item.system.recharge
                        && !!item.system.recharge.value
                        && item.system.recharge.charged === false,
                    hasAttack: ["mwak", "rwak", "msak", "rsak"].includes(item.system.actionType)
                        && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasDamage: item.system.damage?.parts
                        && item.system.damage.parts.length > 0
                        && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasUses: item.canBeUsed(),
                    isCharged: !item.hasUses || item.getRemainingUses() <= 0 || !item.isOnCooldown,
                    hasCapacity: item.hasCapacity()
                };

                if (item.config.hasCapacity) {
                    item.config.capacityCurrent = item.getCurrentCapacity();
                    item.config.capacityMaximum = item.getMaxCapacity();
                }

                if (item.type === "actorResource") {
                    this._prepareActorResource(item, actorData);
                }

                if (item.config.hasAttack) {
                    this._prepareAttackString(item);
                }

                if (item.config.hasDamage) {
                    this._prepareDamageString(item);
                }

                if (item.type === "effect") {
                    arr[4].push(item); // conditionItems
                } else  if (item.type === "feat") {
                    arr[1].push(item); // feats
                    item.isFeat = true;
                } else if (item.type === "chassis") arr[2].push(item); // chassis
                else if (item.type === "mod") arr[3].push(item); // mods
                else if (item.type === "actorResource") arr[5].push(item); // actorResources
                else arr[0].push(item); // items
                return arr;
            },
            [[], [], [], [], [], []]
        );

        this.processItemContainment(items, function(itemType, itemData) {
            if (itemType === "weapon") {
                if (itemData.item.system.equipped) {
                    inventory[itemType].items.push(itemData);
                } else {
                    inventory["cargo"].items.push(itemData);
                }
            } else if (itemType === "upgrade") {
                inventory[itemType].items.push(itemData);
            } else {
                inventory["cargo"].items.push(itemData);
            }
        });

        const droneLevelIndex = data.system.details.level.value - 1;
        const maxMods = SFRPG.droneModsPerLevel[droneLevelIndex];

        const activeFeats = [];
        const passiveFeats = [];
        const classFeatures = [];
        const universalCreatureRule = [];
        const otherFeatures = [];
        for (const f of feats) {
            if (f.system.activation.type) activeFeats.push(f);
            else if (f.system.details.category === "feat") passiveFeats.push(f);
            else if (f.system.details.category === "classFeature") classFeatures.push(f);
            else if (f.system.details.category === "universalCreatureRule") universalCreatureRule.push(f);
            else otherFeatures.push(f);
        }

        const maxFeats = SFRPG.droneFeatsPerLevel[droneLevelIndex];

        const chassisLabel = game.i18n.format("SFRPG.DroneSheet.Features.Chassis");
        const modsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Mods", {
            current: mods.filter((x) => !x.system.isFree).length,
            max: maxMods
        });
        const featsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Feats.Header", {
            current: activeFeats.length + passiveFeats.length,
            max: maxFeats
        });
        const activeFeatsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Feats.Active");

        const features = {
            chassis: {
                category: chassisLabel,
                items: chassis,
                hasActions: false,
                dataset: { type: "chassis" },
                isChassis: true
            },
            mods: {
                category: modsLabel,
                items: mods,
                hasActions: false,
                dataset: { type: "mod" }
            },
            _featsHeader: {
                category: featsLabel,
                items: [],
                hasActions: false,
                dataset: {}
            },
            active: {
                category: activeFeatsLabel,
                items: activeFeats,
                hasActions: true,
                dataset: { type: "feat", "activation.type": "action" }
            },
            feat: {
                category: game.i18n.localize("SFRPG.ActorSheet.Features.Categories.Feats"),
                items: passiveFeats,
                hasActions: false,
                dataset: { type: "feat" }
            },
            classFeature: foundry.utils.deepClone(CONFIG.SFRPG.featureCategories.classFeature),
            universalCreatureRule: foundry.utils.deepClone(CONFIG.SFRPG.featureCategories.universalCreatureRule),
            resources: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"),
                items: actorResources,
                hasActions: false,
                dataset: { type: "actorResource" }
            }
        };

        features.classFeature.items = classFeatures;
        features.universalCreatureRule.items = universalCreatureRule;

        if (otherFeatures.length > 0) {
            features.otherFeatures = {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.OtherFeatures"),
                items: otherFeatures,
                hasActions: false,
                allowAdd: false
            };
        }

        data.inventory = Object.values(inventory);
        data.features = Object.values(features);

        const modifiers = {
            conditions: {
                label: "SFRPG.ModifiersConditionsTabLabel",
                modifiers: [],
                dataset: { subtab: "conditions" },
                isConditions: true
            },
            permanent: {
                label: "SFRPG.ModifiersPermanentTabLabel",
                modifiers: [],
                dataset: { subtab: "permanent" }
            },
            temporary: {
                label: "SFRPG.ModifiersTemporaryTabLabel",
                modifiers: [],
                dataset: { subtab: "temporary" }
            }
        };

        const [permanent, temporary, conditions] = data.system.modifiers.reduce(
            (arr, modifier) => {
                if (modifier.subtab === "permanent") arr[0].push(modifier);
                else if (modifier.subtab === "conditions") arr[2].push(modifier);
                else arr[1].push(modifier);

                return arr;
            },
            [[], [], []]
        );

        modifiers.conditions.items = conditionItems;
        modifiers.permanent.modifiers = permanent;
        modifiers.temporary.modifiers = temporary.concat(conditions);

        data.modifiers = Object.values(modifiers);

        data.activeChassis = null;
        if (chassis && chassis.length > 0) {
            data.activeChassis = chassis[0];
        }
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        html.find(".reload").click(this._onReloadWeapon.bind(this));

        html.find(".repair").click(this._onRepair.bind(this));
        html.find(".modifier-create").click(this._onModifierCreate.bind(this));
        html.find(".modifier-edit").click(this._onModifierEdit.bind(this));
        html.find(".modifier-delete").click(this._onModifierDelete.bind(this));
        html.find(".modifier-toggle").click(this._onToggleModifierEnabled.bind(this));
    }

    /**
     * Add a modifer to this actor.
     *
     * @param {Event} event The originating click event
     */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        this.actor.addModifier({
            name: "New Modifier",
            subtab: target.data("subtab")
        });
    }

    /**
     * Delete a modifier from the actor.
     *
     * @param {Event} event The originating click event
     */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest(".item.modifier").data("modifierId");

        await this.actor.deleteModifier(modifierId);
    }

    /**
     * Edit a modifier for an actor.
     *
     * @param {Event} event The orginating click event
     */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest(".item.modifier").data("modifierId");

        this.actor.editModifier(modifierId);
    }

    /**
     * Repair the drone, calling the relevant repair method on the actor.
     * @param {Event} event The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onRepair(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.repairDrone();
    }
}
