import { ActorSheetSFRPG } from "./base.js"
import { SFRPG } from "../../config.js";

export class ActorSheetSFRPGDrone extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ['sfrpg', 'sheet', 'actor', 'drone'],
            width: 715,
            //height: 830
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "drone-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {

        const actorData = data.actor;

        let weaponLabel = "";
        if (data.data.attributes.weaponMounts.melee.max > 0 && data.data.attributes.weaponMounts.ranged.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.Both", {
                meleeCurrent: data.data.attributes.weaponMounts.melee.current, meleeMax: data.data.attributes.weaponMounts.melee.max,
                rangedCurrent: data.data.attributes.weaponMounts.ranged.current, rangedMax: data.data.attributes.weaponMounts.ranged.max
            });
        } else if (data.data.attributes.weaponMounts.melee.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.MeleeOnly", {
                meleeCurrent: data.data.attributes.weaponMounts.melee.current, meleeMax: data.data.attributes.weaponMounts.melee.max
            });
        } else if (data.data.attributes.weaponMounts.ranged.max > 0) {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.RangedOnly", {
                rangedCurrent: data.data.attributes.weaponMounts.ranged.current, rangedMax: data.data.attributes.weaponMounts.ranged.max
            });
        } else {
            weaponLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.Weapons.None");
        }

        let armorUpgradesLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.ArmorUpgrades",
            { current: data.data.attributes.armorSlots.current, max: data.data.attributes.armorSlots.max }
        );

        let cargoLabel = game.i18n.format("SFRPG.DroneSheet.Inventory.CarriedItems");

        const inventory = {
            weapon: { label: weaponLabel, items: [], dataset: { type: "weapon" } },
            upgrade: { label: armorUpgradesLabel, items: [], dataset: { type: "upgrade" } },
            cargo: { label: cargoLabel, items: [], dataset: { type: "goods" } }
        };

        let [items, feats, chassis, mods, conditionItems] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasCapacity = item.data.capacity && (item.data.capacity.max > 0);
            item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
            item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.data.actionType) && (item.type !== "weapon" || item.data.equipped);
            item.hasDamage = item.data.damage?.parts && item.data.damage.parts.length > 0 && (item.type !== "weapon" || item.data.equipped);
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            item.isCharged = !item.hasUses || item.data.uses?.value <= 0 || !item.isOnCooldown;
            if (item.type === "feat") {
                if ((item.data.requirements?.toLowerCase() || "") === "condition") {
                    arr[4].push(item);
                } else {
                    arr[1].push(item);
                }
            }
            else if (item.type === "chassis") arr[2].push(item);
            else if (item.type === "mod") arr[3].push(item);
            else arr[0].push(item);
            return arr;
        }, [[], [], [], [], []]);
        
        let totalWeight = 0;
        let totalValue = 0;
        for (let i of items) {
            i.img = i.img || DEFAULT_TOKEN;

            i.data.quantity = i.data.quantity || 0;
            i.data.price = i.data.price || 0;
            i.data.bulk = i.data.bulk || "-";

            let weight = 0;
            if (i.data.bulk === "L") {
                weight = 0.1;
            } else if (i.data.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(i.data.bulk);
            }

            i.totalWeight = i.data.quantity * weight;

            totalWeight += i.totalWeight;
            i.totalWeight = i.totalWeight < 1 && i.totalWeight > 0 ? "L" : 
                            i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);

            totalValue += (i.data.price * i.data.quantity);
        }
        totalWeight = Math.floor(totalWeight);
        data.encumbrance = this._computeEncumbrance(totalWeight, data);
        data.inventoryValue = Math.floor(totalValue);

        this.processItemContainment(items, function (itemType, itemData) {
            if (itemType === "weapon") {
                if (itemData.item.data.equipped) {
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

        let droneLevelIndex = data.data.details.level.value - 1;
        let maxMods = SFRPG.droneModsPerLevel[droneLevelIndex];

        let activeFeats = [];
        let passiveFeats = [];
        for (let f of feats) {
            if (f.data.activation.type) activeFeats.push(f);
            else passiveFeats.push(f);
        }

        let maxFeats = SFRPG.droneFeatsPerLevel[droneLevelIndex];

        let chassisLabel = game.i18n.format("SFRPG.DroneSheet.Features.Chassis");
        let modsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Mods", {current: mods.filter(x => !x.data.isFree).length, max: maxMods});
        let featsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Feats.Header", {current: (activeFeats.length + passiveFeats.length), max: maxFeats});
        let activeFeatsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Feats.Active");
        let passiveFeatsLabel = game.i18n.format("SFRPG.DroneSheet.Features.Feats.Passive");

        const features = {
            chassis: { label: chassisLabel, items: chassis, hasActions: false, dataset: { type: "chassis" }, isChassis: true },
            mods: { label: modsLabel, items: mods, hasActions: false, dataset: { type: "mod" } },
            _featsHeader: { label: featsLabel, items: [], hasActions: false, dataset: { } },
            active: { label: activeFeatsLabel, items: activeFeats, hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            passive: { label: passiveFeatsLabel, items: passiveFeats, hasActions: false, dataset: { type: "feat" } }
        };

        data.inventory = Object.values(inventory);
        data.features = Object.values(features);

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions" }, isConditions: true },
            permanent: { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: [], dataset: { subtab: "permanent" } },
            temporary: { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: [], dataset: { subtab: "temporary" } }
        };

        let [permanent, temporary, conditions] = data.data.modifiers.reduce((arr, modifier) => {
            if (modifier.subtab === "permanent") arr[0].push(modifier);
            else if (modifier.subtab === "conditions") arr[2].push(modifier);
            else arr[1].push(modifier);

            return arr;
        }, [[], [], []]);

        modifiers.conditions.items = conditionItems;
        modifiers.permanent.modifiers = permanent;
        modifiers.temporary.modifiers = temporary.concat(conditions);

        data.modifiers = Object.values(modifiers);

        data.activeChassis = null;
        if (chassis && chassis.length > 0) {
            data.activeChassis = chassis[0];
        }
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
     * Compute the level and percentage of encumbrance for an Actor.
     * 
     * @param {Number} totalWeight The cumulative item weight from inventory items
     * @param {Ojbect} actorData The data object for the Actor being rendered
     * @returns {Object} An object describing the character's encumbrance level
     * @private
     */
    _computeEncumbrance(totalWeight, actorData) {
        const enc = {
            max: actorData.data.attributes.encumbrance.max,
            tooltip: actorData.data.attributes.encumbrance.tooltip,
            value: totalWeight
        };

        enc.pct = Math.min(enc.value * 100 / enc.max, 99);
        enc.encumbered = enc.pct > 50;
        return enc;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        //html.find('.toggle-prepared').click(this._onPrepareItem.bind(this));
        html.find('.reload').click(this._onReloadWeapon.bind(this));

        html.find('.repair').click(this._onRepair.bind(this));
        html.find('.modifier-create').click(this._onModifierCreate.bind(this));
        html.find('.modifier-edit').click(this._onModifierEdit.bind(this));
        html.find('.modifier-delete').click(this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').click(this._onToggleModifierEnabled.bind(this));
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
            subtab: target.data('subtab')
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
        const modifierId = target.closest('.item.modifier').data('modifierId');
        
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
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.actor.editModifier(modifierId);
    }

    /**
     * Toggle a modifier to be enabled or disabled.
     * 
     * @param {Event} event The originating click event
     */
    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        const modifiers = duplicate(this.actor.data.data.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;

        await this.actor.update({'data.modifiers': modifiers});
    }

    /**
     * Handle toggling the prepared status of an Owned Itme within the Actor
     * 
     * @param {Event} event The triggering click event
     */
    _onPrepareItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.update({'data.preparation.prepared': !item.data.data.preparation.prepared});
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
