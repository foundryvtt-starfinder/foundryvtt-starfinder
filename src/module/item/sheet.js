import { SFRPG } from "../config.js"

const itemSizeArmorClassModifier = {
    "fine": 8,
    "diminutive": 4,
    "tiny": 2,
    "small": 1,
    "medium": 0,
    "large": 1,
    "huge": 2,
    "gargantuan": 4,
    "colossal": 8
};

/**
 * Override and extend the core ItemSheet implementation to handle SFRPG specific item types
 * @type {ItemSheet}
 */
export class ItemSheetSFRPG extends ItemSheet {
    constructor(...args) {
        super(...args);

        /**
         * The tab being browsed
         * @type {string}
         */
        this._sheetTab = null;

        /**
         * The scroll position on the active tab
         * @type {number}
         */
        this._scrollTab = 100;
    }

    /* -------------------------------------------- */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 715,
            height: 600,
            classes: ["sfrpg", "sheet", "item"],
            resizable: true,
            scrollY: [".tab.details"],
            tabs: [{
                navSelector: ".tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    /* -------------------------------------------- */

    /**
     * Return a dynamic reference to the HTML template path used to render this Item Sheet
     * @return {string}
     */
    get template() {
        const path = "systems/sfrpg/templates/items";
        return `${path}/${this.item.data.type}.html`;
    }

    /* -------------------------------------------- */
    parseNumber(value, defaultValue) {
        if (value === 0 || value instanceof Number) return value;
        else if (!value) return defaultValue;

        let numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return defaultValue;
        }
        return numericValue;
    }

    /**
     * Prepare item sheet data
     * Start with the base item data and extending with additional properties for rendering.
     */
    getData() {
        const data = super.getData();
        data.labels = this.item.labels;

        // Include CONFIG values
        data.config = CONFIG.SFRPG;

        // Item Type, Status, and Details
        data.itemType = data.item.type.titleCase();
        data.itemStatus = this._getItemStatus(data.item);
        data.itemProperties = this._getItemProperties(data.item);
        data.isPhysical = data.item.data.hasOwnProperty("quantity");
        data.hasLevel = data.item.data.hasOwnProperty("level") && data.item.type !== "spell";
        data.hasHands = data.item.data.hasOwnProperty("hands");
        data.hasCapacity = data.item.data.hasOwnProperty("capacity");

        // Physical items
        const physicalItems = ["weapon", "equipment", "consumable", "goods", "container", "technological", "upgrade", "augmentation", "shield"];
        data.isPhysicalItem = physicalItems.includes(data.item.type);

        // Item attributes
        let itemData = this.item.data.data;
        data.placeholders = {};

        if (data.isPhysicalItem) {
            if (itemData.attributes) {
                let itemLevel = this.parseNumber(itemData.level, 1) + (itemData.attributes.customBuilt ? 2 : 0);
                let sizeModifier = itemSizeArmorClassModifier[itemData.attributes.size];
                let dexterityModifier = this.parseNumber(itemData.attributes.dex?.mod, -5);

                data.placeholders.hardness = this.parseNumber(itemData.attributes.hardness, 5 + itemData.attributes.sturdy ? 2 * itemLevel : itemLevel);
                data.placeholders.maxHitpoints = this.parseNumber(itemData.attributes.hp?.max, (itemData.attributes.sturdy ? 15 + 3 * itemLevel : 5 + itemLevel) + (itemLevel >= 15 ? 30 : 0));
                data.placeholders.armorClass = this.parseNumber(itemData.attributes.ac, 10 + sizeModifier + dexterityModifier);
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = {};
                data.placeholders.savingThrow.formula = `@itemLevel + @abilities.dex.mod`;
                data.placeholders.savingThrow.value = this._computeSavingThrowValue(Math.floor(itemLevel / 2), data.placeholders.savingThrow.formula);
            } else {
                let itemLevel = this.parseNumber(itemData.level, 1);
                let sizeModifier = 0;
                let dexterityModifier = -5;

                data.placeholders.hardness = 5 + itemLevel;
                data.placeholders.maxHitpoints = (5 + itemLevel) + (itemLevel >= 15 ? 30 : 0);
                data.placeholders.armorClass = 10 + sizeModifier + dexterityModifier;
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = {};
                data.placeholders.savingThrow.formula = `@itemLevel + @abilities.dex.mod`;
                data.placeholders.savingThrow.value = this._computeSavingThrowValue(Math.floor(itemLevel / 2), data.placeholders.savingThrow.formula);
            }
        }

        data.selectedSize = (itemData.attributes && itemData.attributes.size) ? itemData.attributes.size : "medium";

        // Category
        data.category = this._getItemCategory(data.item);

        // Armor specific details
        data.isPowerArmor = data.item.data.hasOwnProperty("armor") && data.item.data.armor.type === 'power';

        // Action Details
        data.hasAttackRoll = this.item.hasAttack;
        data.isHealing = data.item.data.actionType === "heal";

        // Spell-specific data
        if (data.item.type === "spell") {
            let save = data.item.data.save;
            if (this.item.isOwned && (save.type && !save.dc)) {
                let actor = this.item.actor;
                let abl = actor.data.data.attributes.keyability || "int";
                save.dc = 10 + data.item.data.level + actor.data.data.abilities[abl].mod;
            }
        }

        data.modifiers = this.item.data.data.modifiers;

        return data;
    }

    /* -------------------------------------------- */

    _computeSavingThrowValue(itemLevel, formula) {
        try {
            let rollData = {
                item: this.item.data.data,
                itemLevel: itemLevel
            };
            if (this.item.actor) {
                rollData = duplicate(this.item.actor.data.data);
                rollData.item = this.item.data.data;
                rollData.itemLevel = itemLevel;
            } else {
                rollData.abilities = { dex: { mod: 0 }};
            }
            let saveRoll = new Roll(formula, rollData).roll();
            return saveRoll.total;
        } catch (err) {
            return 10;
        }
    }

    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
    _getItemStatus(item) {
        if (["weapon", "equipment"].includes(item.type)) return item.data.equipped ? "Equipped" : "Unequipped";
        else if (item.type === "starshipWeapon") return item.data.mount.mounted ? "Mounted" : "Not Mounted";
        else if (item.type === "augmentation") return `${item.data.type} (${item.data.system})`;
    }

    /* -------------------------------------------- */

    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab
     * @return {Array}
     * @private
     */
    _getItemProperties(item) {
        const props = [];
        const labels = this.item.labels;

        if (item.type === "weapon") {
            props.push(...Object.entries(item.data.properties)
                .filter(e => e[1] === true)
                .map(e => CONFIG.SFRPG.weaponProperties[e[0]]));
        } else if (item.type === "spell") {
            props.push(
                labels.components,
                labels.materials,
                item.data.concentration ? "Concentration" : null,
                item.data.sr ? "Spell Resistence" : null,
                item.data.dismissible ? "Dismissible" : null
            )
        } else if (item.type === "equipment") {
            props.push(CONFIG.SFRPG.armorTypes[item.data.armor.type]);
            props.push(labels.armor);
        } else if (item.type === "feat") {
            props.push(labels.featType);
        } else if (item.type === "starshipWeapon") {
            props.push(CONFIG.SFRPG.starshipWeaponTypes[item.data.weaponType]);
            props.push(CONFIG.SFRPG.starshipWeaponClass[item.data.class]);
        } else if (item.type === "shield") {
            if (item.data.dex) props.push(`Dex: ${item.data.dex}`);
            if (item.data.acp) props.push(`ACP: ${item.data.acp}`);
            props.push(`Shield: ${item.data.bonus.wielded}/${item.data.bonus.aligned}`);
        }

        // Action type
        if (item.data.actionType) {
            props.push(CONFIG.SFRPG.itemActionTypes[item.data.actionType]);
        }

        // Action usage
        if ((item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation)) {
            props.push(
                labels.activation,
                labels.range,
                labels.target,
                labels.duration
            )
        }
        return props.filter(p => !!p);
    }

    _getItemCategory(item) {
        let category = {
            enabled: false,
            value: "",
            tooltip: ""
        };

        if (item.type === "weapon") {
            category.enabled = true;
            category.value = SFRPG.weaponTypes[item.data.weaponType];
            category.tooltip = "SFRPG.ItemSheet.Weapons.Category";
        } else if (item.type === "equipment") {
            category.enabled = true;
            category.value = SFRPG.equipmentTypes[item.data.armor.type];
            category.tooltip = "SFRPG.Items.Equipment.Category";
        } else if (item.type === "consumable") {
            category.enabled = true;
            category.value = SFRPG.consumableTypes[item.data.consumableType];
            category.tooltip = "SFRPG.ItemSheet.Consumables.Category";
        }

        return category;
    }

    /* -------------------------------------------- */

    setPosition(position = {}) {
        if (this._sheetTab === "details") position.height = "auto";
        return super.setPosition(position);
    }

    /* -------------------------------------------- */
    /*  Form Submission                             */
    /* -------------------------------------------- */

    /**
     * Extend the parent class _updateObject method to ensure that damage ends up in an Array
     * @private
     */
    _updateObject(event, formData) {
        // Handle Damage Array
        let damage = Object.entries(formData).filter(e => e[0].startsWith("data.damage.parts"));
        formData["data.damage.parts"] = damage.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Handle Critical Damage Array
        let criticalDamage = Object.entries(formData).filter(e => e[0].startsWith("data.critical.parts"));
        formData["data.critical.parts"] = criticalDamage.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Handle Ability Adjustments array
        let abilityMods = Object.entries(formData).filter(e => e[0].startsWith("data.abilityMods.parts"));
        formData["data.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Update the Item
        super._updateObject(event, formData);
    }

    /* -------------------------------------------- */

    /**
     * Activate listeners for interactive item sheet events
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Save scroll position
        html.find(".tab.active")[0].scrollTop = this._scrollTab;
        html.find(".tab").scroll(ev => this._scrollTab = ev.currentTarget.scrollTop);

        // Modify damage formula
        html.find(".damage-control").click(this._onDamageControl.bind(this));
        html.find(".ability-adjustments-control").click(this._onAbilityAdjustmentsControl.bind(this));

        html.find('.modifier-create').click(this._onModifierCreate.bind(this));
        html.find('.modifier-edit').click(this._onModifierEdit.bind(this));
        html.find('.modifier-delete').click(this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').click(this._onToggleModifierEnabled.bind(this));

        html.find('.add-storage').click(this._onAddStorage.bind(this));
        html.find('.remove-storage').click(this._onRemoveStorage.bind(this));
        html.find('select[name="storage.type"]').change(this._onChangeStorageType.bind(this));
        html.find('select[name="storage.subtype"]').change(this._onChangeStorageSubtype.bind(this));
        html.find('input[name="storage.amount"]').change(this._onChangeStorageAmount.bind(this));
        html.find('select[name="storage.weightProperty"]').change(this._onChangeStorageWeightProperty.bind(this));
        html.find('input[class="storage.acceptsType"]').change(this._onChangeStorageAcceptsItem.bind(this));
        html.find('input[name="storage.affectsEncumbrance"]').change(this._onChangeStorageAffectsEncumbrance.bind(this));
    }

    /* -------------------------------------------- */

    async _onAbilityAdjustmentsControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new ability adjustment component
        if (a.classList.contains("add-ability-adjustment")) {
            await this._onSubmit(event);
            const abilityMods = this.item.data.data.abilityMods;
            return this.item.update({
                "data.abilityMods.parts": abilityMods.parts.concat([
                    [0, ""]
                ])
            });
        }

        // Remove an ability adjustment component
        if (a.classList.contains("delete-ability-adjustment")) {
            await this._onSubmit(event);
            const li = a.closest(".ability-adjustment-part");
            const abilityMods = duplicate(this.item.data.data.abilityMods);
            abilityMods.parts.splice(Number(li.dataset.abilityAdjustment), 1);
            return this.item.update({
                "data.abilityMods.parts": abilityMods.parts
            });
        }
    }

    /**
     * Add or remove a damage part from the damage formula
     * @param {Event} event     The original click event
     * @return {Promise}
     * @private
     */
    async _onDamageControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new damage component
        if (a.classList.contains("add-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const damage = this.item.data.data.damage;
            return this.item.update({
                "data.damage.parts": damage.parts.concat([
                    ["", ""]
                ])
            });
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = duplicate(this.item.data.data.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({
                "data.damage.parts": damage.parts
            });
        }

        // Add new critical damage component
        if (a.classList.contains("add-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const criticalDamage = this.item.data.data.critical;
            return this.item.update({
                "data.critical.parts": criticalDamage.parts.concat([
                    ["", ""]
                ])
            });
        }

        // Remove a critical damage component
        if (a.classList.contains("delete-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const criticalDamage = duplicate(this.item.data.data.critical);
            criticalDamage.parts.splice(Number(li.dataset.criticalPart), 1);
            return this.item.update({
                "data.critical.parts": criticalDamage.parts
            });
        }
    }

    /**
     * Add a modifer to this item.
     * 
     * @param {Event} event The originating click event
     */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        this.item.addModifier({
            name: "New Modifier"
        });
    }

    /**
     * Delete a modifier from the item.
     * 
     * @param {Event} event The originating click event
     */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        await this.item.deleteModifier(modifierId);
    }

    /**
     * Edit a modifier for an item.
     * 
     * @param {Event} event The orginating click event
     */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.item.editModifier(modifierId);
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

        const modifiers = duplicate(this.item.data.data.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;

        await this.item.update({
            'data.modifiers': modifiers
        });
    }

    async _onAddStorage(event) {
        event.preventDefault();

        let storage = duplicate(this.item.data.data.container.storage);
        storage.push({
            type: "bulk",
            subtype: "",
            amount: 0,
            acceptsType: [],
            weightMultiplier: 1,
            weightProperty: ""
        });
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onRemoveStorage(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.data.data.container.storage);
        storage.splice(slotIndex, 1);
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageType(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.data.data.container.storage);
        storage[slotIndex].type = event.currentTarget.value;
        if (storage[slotIndex].type === "bulk") {
            storage[slotIndex].subtype = "";
            storage[slotIndex].weightProperty = "bulk";
        } else {
            storage[slotIndex].weightProperty = "";
        }
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageSubtype(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.data.data.container.storage);
        storage[slotIndex].subtype = event.currentTarget.value;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageAmount(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const inputNumber = Number(event.currentTarget.value);
        if (!Number.isNaN(inputNumber)) {
            let storage = duplicate(this.item.data.data.container.storage);
            storage[slotIndex].amount = inputNumber;
            await this.item.update({
                "data.container.storage": storage
            });
        }
    }

    async _onChangeStorageWeightProperty(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.data.data.container.storage);
        storage[slotIndex].weightProperty = event.currentTarget.value;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageAcceptsItem(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const itemType = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        let storage = duplicate(this.item.data.data.container.storage);
        if (enabled) {
            if (!storage[slotIndex].acceptsType.includes(itemType)) {
                storage[slotIndex].acceptsType.push(itemType);
            }
        } else {
            if (storage[slotIndex].acceptsType.includes(itemType)) {
                storage[slotIndex].acceptsType = storage[slotIndex].acceptsType.filter(x => x !== itemType);
            }
        }
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageAffectsEncumbrance(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.data.data.container.storage);
        storage[slotIndex].affectsEncumbrance = event.currentTarget.checked;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    /** @override */
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
}