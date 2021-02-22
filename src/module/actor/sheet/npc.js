import { ActorSheetSFRPG } from "./base.js";
import { SFRPG } from "../../config.js";

/**
 * An Actor sheet for NPC type characters in the SFRPG system.
 * 
 * Extends the base ActorSheetSFRPG class.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGNPC extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['sfrpg', 'actor', 'sheet', 'npc']),
            width: 720,
            height: 765
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "npc-sheet.html";
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        
        html.find('.reload').click(this._onReloadWeapon.bind(this));
        html.find('#add-skills').click(this._toggleSkills.bind(this));
    }

    getData() {
        const data = super.getData();

        let cr = parseFloat(data.data.details.cr || 0);
        let crs = { 0: "0", 0.125: "1/8", [1/6]: "1/6", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["cr"] = cr >= 1 ? String(cr) : crs[cr] || 1;

        return data;
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
     * Toggle the visibility of skills on the NPC sheet.
     * 
     * @param {Event} event The originating click event
     */
    _toggleSkills(event) {
        event.preventDefault();
        
        this.actor.toggleNpcSkills();
    }

    _prepareItems(data) {
        const droneItemTypes = ["chassis", "mod"];

        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.NPCSheet.Inventory.Inventory"), items: [], dataset: { type: "augmentation,consumable,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon,weaponAccessory" }, allowAdd: true }
        };
        const features = {
            weapons: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Attacks"), items: [], hasActions: true, dataset: { type: "weapon,shield", "weapon-type": "natural" }, allowAdd: true },
            actions: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Actions"), items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" }, allowAdd: true },
            passive: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Features"), items: [], dataset: { type: "feat" }, allowAdd: true },
            activeItems: { label: game.i18n.localize("SFRPG.NPCSheet.Features.ActiveItems"), items: [], dataset: { }, allowAdd: false }
        };

        let [spells, other, conditionItems, droneItems] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasCapacity = item.data.capacity && (item.data.capacity.max > 0);
            item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
            item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.data.actionType) && (!["weapon", "shield"].includes(item.type) || item.data.equipped);
            item.hasDamage = item.data.damage?.parts && item.data.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.data.equipped);
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            item.isCharged = !item.hasUses || item.data.uses?.value <= 0 || !item.isOnCooldown;
            if (droneItemTypes.includes(item.type)) {
                arr[3].push(item);
            } else if (item.type === "spell") {
                let container = data.items.find(x => x.data.container?.contents?.find(x => x.id === item.id) || false);
                if (!container) {
                    arr[0].push(item);
                } else {
                    arr[1].push(item);
                }
            } else if (item.type === "feat") {
                if ((item.data.requirements?.toLowerCase() || "") === "condition") {
                    arr[2].push(item);
                } else {
                    arr[1].push(item);
                }
                item.isFeat = true;
            }
            else arr[1].push(item);
            return arr;
        }, [[], [], [], []]);

        // Apply item filters
        spells = this._filterItems(spells, this._filters.spellbook);
        other = this._filterItems(other, this._filters.features);

        // Organize Spellbook
        const spellbook = this._prepareSpellbook(data, spells);

        // Organize Features
        const itemsToProcess = [];
        for (const item of other) {
            if (["weapon", "shield"].includes(item.type)) {
                item.isOpen = item.data.container?.isOpen === undefined ? true : item.data.container.isOpen;
                if (!item.data.containerId) {
                    features.weapons.items.push(item);
                }
                itemsToProcess.push(item);
            }
            else if (item.type === "feat") {
                if (item.data.activation.type) features.actions.items.push(item);
                else features.passive.items.push(item);
            }
            else if (["consumable", "technological"].includes(item.type)) {
                item.isOpen = item.data.container?.isOpen === undefined ? true : item.data.container.isOpen;
                if (!item.data.containerId) {
                    features.activeItems.items.push(item);
                }
                itemsToProcess.push(item);
            } else if (["archetypes", "class", "race", "theme"].includes(item.type)) {
                if (!(item.type in features)) {
                    let label = "SFRPG.Items.Categories.MiscellaneousItems";
                    if (item.type in SFRPG.itemTypes) {
                        label = SFRPG.itemTypes[item.type];
                    }
                    features[item.type] = { label: game.i18n.format(label), items: [], dataset: { }, allowAdd: false };
                }
                features[item.type].items.push(item);
            } else if (item.type in SFRPG.itemTypes) {
                item.isOpen = item.data.container?.isOpen === undefined ? true : item.data.container.isOpen;
                itemsToProcess.push(item);
            }
        }

        this.processItemContainment(itemsToProcess, function (itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });

        if (droneItems.length > 0) {
            features.drone = { label: game.i18n.localize("SFRPG.NPCSheet.Features.Drone"), items: droneItems, dataset: { type: droneItemTypes.join(',') }, allowAdd: true };
        }

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions" }, isConditions: true }
        };
        modifiers.conditions.items = conditionItems;

        // Assign and return
        data.inventory = inventory;
        data.features = Object.values(features);
        data.spellbook = spellbook;
        data.modifiers = Object.values(modifiers);
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const crs = { "1/8": 0.125, "1/6": 1/6, "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let crv = "data.details.cr";
        let cr = formData[crv];
        cr = crs[cr] || parseFloat(cr);
        if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

        // Parent ActorSheet update steps
        return super._updateObject(event, formData);
    }
}
