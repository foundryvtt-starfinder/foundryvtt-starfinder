import { ActorSheetSFRPG } from "./base.js"

export class ActorSheetSFRPGCharacter extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ['sfrpg', 'sheet', 'actor', 'character'],
            width: 715,
            //height: 830
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        let hp = sheetData.data.attributes.hp;
        if (hp.temp === 0) delete hp.temp;
        if (hp.tempmax === 0) delete hp.tempmax;

        sheetData["disableExperience"] = game.settings.get("sfrpg", "disableExperienceTracking");

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

        const inventory = {
            weapon: { label: "Weapons", items: [], dataset: { type: "weapon" } },
            equipment: { label: "Equipment", items: [], dataset: { type: "equipment" } },
            consumable: { label: "Consumables", items: [], dataset: { type: "consumable" } },
            goods: { label: "Goods", items: [], dataset: { type: "goods" } },
            container: { label: "Containers", items: [], dataset: { type: "container" } },
            technological: { label: "Technological", items: [], dataset: { type: "technological" } },
            fusion: { label: "Weapon Fusions", items: [], dataset: { type: "fusion" } },
            upgrade: { label: "Armor Upgrades", items: [], dataset: { type: "upgrade" } },
            augmentation: { label: "Augmentations", items: [], dataset: { type: "augmentation" } }
        };

        let [items, spells, feats, classes, races, themes, archetypes] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            item.hasCapacity = item.data.capacity && (item.data.capacity.max > 0);
            item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
            item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.data.actionType);
            const unusalbe = item.isOnCooldown && (item.data.uses.per && (item.data.uses.value > 0));
            item.isCharged = !unusalbe;
            if (item.type === "spell") arr[1].push(item);
            else if (item.type === "feat") arr[2].push(item);
            else if (item.type === "class") arr[3].push(item);
            else if (item.type === "race") arr[4].push(item);
            else if (item.type === "theme") arr[5].push(item);
            else if (item.type === "archetypes") arr[6].push(item);
            else if (item.type === "container") arr[0].push(item);
            else if (Object.keys(inventory).includes(item.type)) arr[0].push(item);
            return arr;
        }, [[], [], [], [], [], [], []]);
        
        const spellbook = this._prepareSpellbook(data, spells);

        let totalValue = 0;
        let preprocessedItems = [];
        let containedItems = [];
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
            i.totalWeight = i.totalWeight < 1 && i.totalWeight > 0 ? "L" : 
                            i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);

            totalValue += (i.data.price * i.data.quantity);

            let itemData = {item: i, contents: []};
            preprocessedItems.push(itemData);
            
            if (!i.data.containerId) {
                inventory[i.type].items.push(itemData);
            } else {
                containedItems.push(itemData);
            }
        }

        function findById(data, id) {
            let arrayToSearch = data;
            for (let i = 0; i<arrayToSearch.length; i++) {
                let element = arrayToSearch[i];
                if (element.item._id === id) {
                    return element;
                } else if (element.contents && element.contents.length > 0) {
                    arrayToSearch = arrayToSearch.concat(element.contents);
                }
            }
            return null;
        }

        for (let item of containedItems) {
            let parent = null;
            const containerId = item.item.data.containerId;
            for (let section of Object.entries(inventory)) {
                parent = findById(section[1].items, containerId);
                if (parent) {
                    parent.contents.push(item);
                    break;
                }
            }

            if (!parent) {
                parent = containedItems.find(x => x.item._id === containerId);
                if (parent) {
                    parent.contents.push(item);
                    continue;
                }
            }

            if (!parent) {
                console.log(`Could not find parent ${item.item.data.containerId} for ${item.item.name}`);
            }
        }

        let totalWeight = 0;
        for (let section of Object.entries(inventory)) {
            for (let i of section[1].items) {
                let itemBulk = this._computeCompoundBulkForItem(i.item, i.contents);
                totalWeight += itemBulk;
            }
        }
        totalWeight = Math.floor(totalWeight / 10); // Divide bulk by 10 to correct for integer-space bulk calculation.
        data.data.attributes.encumbrance = this._computeEncumbrance(totalWeight, data);
        data.inventoryValue = Math.floor(totalValue);

        const features = {
            classes: { label: "Class Levels", items: [], hasActions: false, dataset: { type: "class" }, isClass: true },
            race: { label: "Race", items: [], hasActions: false, dataset: { type: "race" }, isRace: true },
            theme: { label: "Theme", items: [], hasActions: false, dataset: { type: "theme" }, isTheme: true },
            archetypes: { label: "Archetypes", items: [], dataset: { type: "archetypes" }, isArchetype: true },
            active: { label: "Active", items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            passive: { label: "Passive", items: [], hasActions: false, dataset: { type: "feat" } }
        };

        for (let f of feats) {
            if (f.data.activation.type) features.active.items.push(f);
            else features.passive.items.push(f);
        }

        classes.sort((a, b) => b.levels - a.levels);
        features.classes.items = classes;
        features.race.items = races;
        features.theme.items = themes;
        features.archetypes.items = archetypes;

        data.inventory = Object.values(inventory);
        data.spellbook = spellbook;
        data.features = Object.values(features);

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions" }, isConditions: true },
            permanent: { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: [], dataset: { subtab: "permanent" } },
            temporary: { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: [], dataset: { subtab: "temporary" } }
        };

        let [permanent, temporary, itemModifiers, conditions, misc] = data.data.modifiers.reduce((arr, modifier) => {
            if (modifier.subtab === "permanent") arr[0].push(modifier);
            else if (modifier.subtab === "conditions") arr[3].push(modifier);
            else arr[1].push(modifier); // Any unspecific categories go into temporary.

            return arr;
        }, [[], [], [], [], []]);

        modifiers.conditions.modifiers = conditions;
        modifiers.permanent.modifiers = permanent;
        modifiers.temporary.modifiers = temporary;

        data.modifiers = Object.values(modifiers);
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
     * @param {Object} actorData The data object for the Actor being rendered
     * @returns {Object} An object describing the character's encumbrance level
     * @private
     */
    _computeEncumbrance(totalWeight, actorData) {
        const enc = {
            max: actorData.data.abilities.str.value,
            value: totalWeight
        };

        enc.pct = Math.min(enc.value * 100 / enc.max, 99);
        enc.encumbered = enc.pct > 50;
        return enc;
    }

    /**
     * Returns the bulk of the item, along with its contents.
     * To prevent rounding errors, all calculations are done in integer space by multiplying bulk by 10.
     * A bulk of L is considered as 1, while a bulk of 1 would be 10. Any other non-number bulk is considered 0 bulk.
     * 
     * Item container properties such as equipped bulk and content bulk multipliers are taken into account here.
     * 
     * @param {Object} item The item whose bulk is to be calculated.
     * @param {Array} contents An array of items who are considered children of the item.
     * @returns {Number} A multiplied-by-10 value of the total bulk.
     */
    _computeCompoundBulkForItem(item, contents) {
        let contentBulk = 0;
        if (contents && contents.length > 0) {
            for (let child of contents) {
                let childBulk = this._computeCompoundBulkForItem(child.item, child.contents);
                contentBulk += childBulk;
            }

            if (item.data.contentBulkMultiplier !== undefined) {
                contentBulk *= item.data.contentBulkMultiplier;
            }
        }

        let personalBulk = 0;
        if (item.data.bulk.toUpperCase() === "L") {
            personalBulk = 1;
        } else if (!Number.isNaN(item.data.bulk)) {
            personalBulk = item.data.bulk * 10;
        }

        if (item.data.quantity && !Number.isNaN(item.data.quantity)) {
            personalBulk *= item.data.quantity;
        }

        if (item.data.equipped) {
            if (item.data.equippedBulkMultiplier !== undefined) {
                personalBulk *= item.data.equippedBulkMultiplier;
            }
        }

        //console.log(`${item.name} has a content bulk of ${contentBulk}, and personal bulk of ${personalBulk}`);
        return personalBulk + contentBulk;
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

        html.find('.short-rest').click(this._onShortRest.bind(this));
        html.find('.long-rest').click(this._onLongRest.bind(this));
        html.find('.modifier-create').click(this._onModifierCreate.bind(this));
        html.find('.modifier-edit').click(this._onModifierEdit.bind(this));
        html.find('.modifier-delete').click(this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').click(this._onToggleModifierEnabled.bind(this));
        html.find('.conditions input[type="checkbox"]').change(this._onToggleConditions.bind(this));
    }

    /**
     * Toggles condition modifiers on or off.
     * 
     * @param {Event} event The triggering event.
     */
    async _onToggleConditions(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const condition = target.data('condition');

        if (["blinded", "cowering", "offkilter", "pinned", "stunned"].includes(condition)) {
            const flatfooted = $('.condition.flatfooted');
            const ffIsChecked = flatfooted.is(':checked');
            flatfooted.prop("checked", !ffIsChecked).change();
        }
        
        const tokens = this.actor.getActiveTokens(true);
        for (const token of tokens) {
            await token.toggleEffect(CONFIG.SFRPG.statusEffectIconMapping[condition]);
        }
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
     * Handles reloading / replacing ammo or batteries in a weapon.
     * 
     * @param {Event} event The originating click event
     */
    _onReloadWeapon(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.update({'data.capacity.value': item.data.data.capacity.max});
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
     * Take a short 10 minute rest, calling the relevant function on the Actor instance
     * @param {Event} event The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /**
     * Take a long rest, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }
}
