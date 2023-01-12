import { SFRPG } from "../config.js";

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

        this._tooltips = null;
    }

    /* -------------------------------------------- */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 715,
            height: 600,
            classes: ["sfrpg", "sheet", "item"],
            resizable: true,
            scrollY: [".tab.details"],
            tabs: [
                {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"},
                {navSelector: ".descTabs", contentSelector: ".desc-body", initial: "description"}
            ]
        });
    }

    /* -------------------------------------------- */

    /**
     * Return a dynamic reference to the HTML template path used to render this Item Sheet
     * @return {string}
     */
    get template() {
        const path = "systems/sfrpg/templates/items";
        return `${path}/${this.item.type}.hbs`;
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

    async onPlaceholderUpdated(item, newSavingThrowScore) {
        const placeholders = item.flags.placeholders;
        if (placeholders.savingThrow.value !== newSavingThrowScore.total) {
            placeholders.savingThrow.value = newSavingThrowScore.total;
            await new Promise(resolve => setTimeout(resolve, 500));
            this.render(false, {editable: this.options.editable});
        }
    }

    /**
     * Prepare item sheet data
     * Start with the base item data and extending with additional properties for rendering.
     */
    async getData() {
        const data = super.getData();

        data.itemData = this.document.system;
        data.actor = this.document.parent;
        data.labels = this.item.labels;

        // Include CONFIG values
        data.config = CONFIG.SFRPG;

        // Item Type, Status, and Details
        data.itemType = game.i18n.format(`ITEM.Type${data.item.type.titleCase()}`);
        data.itemStatus = this._getItemStatus();
        data.itemProperties = this._getItemProperties();
        data.isPhysical = data.itemData.hasOwnProperty("quantity");
        data.hasLevel = data.itemData.hasOwnProperty("level") && data.item.type !== "spell";
        data.hasHands = data.itemData.hasOwnProperty("hands");
        data.hasProficiency = data.itemData.proficient === true || data.itemData.proficient === false;
        data.isFeat = this.type === "feat";
        data.isVehicleAttack = data.item.type === "vehicleAttack";
        data.isVehicleSystem = data.item.type === "vehicleSystem";
        data.isGM = game.user.isGM;
        data.isOwner = data.owner;

        // Physical items
        const physicalItems = ["weapon", "equipment", "consumable", "goods", "container", "technological", "magic", "hybrid", "upgrade", "augmentation", "shield", "weaponAccessory"];
        data.isPhysicalItem = physicalItems.includes(data.item.type);

        // Item attributes
        const itemData = this.item.system;
        data.placeholders = this.item.flags.placeholders || {};

        // Only physical items have hardness, hp, and their own saving throw when attacked.
        if (data.isPhysicalItem) {
            if (itemData.attributes) {
                const itemLevel = this.parseNumber(itemData.level, 1) + (itemData.attributes.customBuilt ? 2 : 0);
                const sizeModifier = itemSizeArmorClassModifier[itemData.attributes.size];
                const dexterityModifier = this.parseNumber(itemData.attributes.dex?.mod, -5);

                data.placeholders.hardness = this.parseNumber(itemData.attributes.hardness, 5 + itemData.attributes.sturdy ? 2 * itemLevel : itemLevel);
                data.placeholders.maxHitpoints = this.parseNumber(itemData.attributes.hp?.max, (itemData.attributes.sturdy ? 15 + 3 * itemLevel : 5 + itemLevel) + (itemLevel >= 15 ? 30 : 0));
                data.placeholders.armorClass = this.parseNumber(itemData.attributes.ac, 10 + sizeModifier + dexterityModifier);
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                data.placeholders.savingThrow.value = data.placeholders.savingThrow.value ?? 10;

                this.item.flags.placeholders = data.placeholders;
                this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                    .then((total) => this.onPlaceholderUpdated(this.item, total))
                    .catch((reason) => console.log(reason));
            } else {
                const itemLevel = this.parseNumber(itemData.level, 1);
                const sizeModifier = 0;
                const dexterityModifier = -5;

                data.placeholders.hardness = 5 + itemLevel;
                data.placeholders.maxHitpoints = (5 + itemLevel) + (itemLevel >= 15 ? 30 : 0);
                data.placeholders.armorClass = 10 + sizeModifier + dexterityModifier;
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                data.placeholders.savingThrow.value = data.placeholders.savingThrow.value ?? 10;

                this.item.flags.placeholders = data.placeholders;
                this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                    .then((total) => this.onPlaceholderUpdated(this.item, total))
                    .catch((reason) => console.log(reason));
            }
        }

        data.selectedSize = (itemData.attributes && itemData.attributes.size) ? itemData.attributes.size : "medium";

        // Category
        data.category = this._getItemCategory();

        // Armor specific details
        data.isPowerArmor = data.item.system.hasOwnProperty("armor") && data.item.system.armor.type === 'power';

        // Action Details
        data.hasAttackRoll = this.item.hasAttack;
        data.isHealing = data.item.actionType === "heal";

        // Vehicle Attacks
        if (data.isVehicleAttack) {
            data.placeholders.savingThrow = {};
            data.placeholders.savingThrow.value = data.item.system.save.dc;
        }

        data.modifiers = this.item.system.modifiers;

        data.hasSpeed = this.item.system.weaponType === "tracking" || (this.item.system.special && this.item.system.special["limited"]);
        data.hasCapacity = this.item.hasCapacity();

        // Enrich text editors
        data.enrichedDescription = await TextEditor.enrichHTML(this.object.system?.description?.value, {async: true});
        data.enrichedShortDescription = await TextEditor.enrichHTML(this.object.system?.description?.short, {async: true});
        data.enrichedGMNotes = await TextEditor.enrichHTML(this.object.system?.description?.gmNotes, {async: true});

        return data;
    }

    /* -------------------------------------------- */

    async _computeSavingThrowValue(itemLevel, formula) {
        try {
            const rollData = {
                owner: this.item.actor ? duplicate(this.item.actor.system) : {abilities: {dex: {mod: 0}}},
                item: duplicate(this.item.system),
                itemLevel: itemLevel
            };
            if (!rollData.owner.abilities?.dex?.mod) {
                rollData.owner.abilities = {dex: {mod: 0}};
            }
            const saveRoll = Roll.create(formula, rollData);
            return saveRoll.evaluate({async: true});
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
    _getItemStatus() {
        const item = this.document;
        const itemData = item.system;

        if (["weapon", "equipment", "shield"].includes(item.type)) return itemData.equipped ? "Equipped" : "Unequipped";
        else if (item.type === "starshipWeapon") return itemData.mount.mounted ? "Mounted" : "Not Mounted";
        else if (item.type === "augmentation") {
            return `${itemData.type.capitalize()} (${
                itemData.system.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => {
                        return str.toUpperCase();
                    })
            })
        `;
        } else if (item.type === "vehicleSystem") {
            // Only systems which can be activated have an activation status
            if (this.document.canBeActivated() === false) {
                return "";
            }

            return this.document.isActive() ? "Activated" : "Not Activated";
        }
    }

    /* -------------------------------------------- */

    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab
     * @return {Array}
     * @private
     */
    _getItemProperties() {
        const props = [];
        const labels = this.item.labels;

        const item = this.document;
        const itemData = item.system;

        if (item.type === "weapon") {
            props.push(...Object.entries(itemData.properties)
                .filter(e => e[1] === true)
                .map(e => ({
                    name: CONFIG.SFRPG.weaponProperties[e[0]],
                    tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[e[0]]
                })
                )
            );
        } else if (item.type === "spell") {
            const desc = (Object.entries(itemData.descriptors)).filter(e => e[1] === true)
                .map(e => ({
                    name: CONFIG.SFRPG.descriptors[e[0]],
                    tooltip: (CONFIG.SFRPG.descriptorsTooltips[e[0]]) ? CONFIG.SFRPG.descriptorsTooltips[e[0]] : null
                })
                );

            props.push(
                {name: labels.components, tooltip: null},
                {name: labels.materials, tooltip: null},
                itemData.concentration ? {name: "Concentration", tooltip: null} : null,
                itemData.sr ? {name: "Spell Resistence", tooltip: null} : null,
                itemData.dismissible ? {name: "Dismissible", tooltip: null} : null,
                ...desc
            );
        } else if (item.type === "equipment") {
            props.push({
                name: CONFIG.SFRPG.armorTypes[itemData.armor.type],
                tooltip: null
            });
            props.push({
                name: labels.armor,
                tooltip: null
            });
        } else if (item.type === "feat") {
            const desc = (Object.entries(itemData.descriptors)).filter(e => e[1] === true)
                .map(e => ({
                    name: CONFIG.SFRPG.descriptors[e[0]],
                    tooltip: (CONFIG.SFRPG.descriptorsTooltips[e[0]]) ? CONFIG.SFRPG.descriptorsTooltips[e[0]] : null
                })
                );

            props.push(
                {name: labels.featType, tooltip: null},
                ...desc
            );
        } else if (item.type === "starshipWeapon") {
            props.push({
                name: CONFIG.SFRPG.starshipWeaponTypes[itemData.weaponType],
                tooltip: null
            });
            props.push({
                name: CONFIG.SFRPG.starshipWeaponClass[itemData.class],
                tooltip: null
            });
        } else if (item.type === "shield") {
            // Add max dexterity modifier
            if (itemData.dex) props.push({
                name: game.i18n.format("SFRPG.Items.Shield.Dex", { dex: itemData.dex.signedString() }),
                tooltip: null
            });
            // Add armor check penalty
            if (item.acp) props.push({
                name: game.i18n.format("SFRPG.Items.Shield.ACP", { acp: item.acp.signedString() }),
                tooltip: null
            });

            const wieldedBonus = itemData.proficient ? (itemData.bonus.wielded || 0) : 0;
            const alignedBonus = itemData.proficient ? (itemData.bonus.aligned || 0) : 0;
            props.push({
                name: game.i18n.format("SFRPG.Items.Shield.ShieldBonus", { wielded: wieldedBonus.signedString(), aligned: alignedBonus.signedString() }),
                tooltip: null
            });
        } else if (item.type === "vehicleAttack") {
            if (item.ignoresHardness && item.ignoresHardness > 0) {
                props.push(game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + item.ignoresHardness);
            }
        } else if (item.type === "vehicleSystem") {
            if (item.senses &&  item.senses.usedForSenses == true) {
                // We deliminate the senses by `,` and present each sense as a separate property
                let sensesDeliminated = item.senses.senses.split(",");
                for (let index = 0; index < sensesDeliminated.length; index++) {
                    let sense = sensesDeliminated[index];
                    props.push(sense);
                }
            }
        }

        // Action type
        if (itemData.actionType) {
            props.push({
                name: CONFIG.SFRPG.itemActionTypes[itemData.actionType],
                tooltip: null
            });
        }

        // Action usage
        if ((item.type !== "weapon") && itemData.activation && !foundry.utils.isEmpty(itemData.activation)) {
            props.push(
                {name: labels.activation, tooltip: null},
                {name: labels.range, tooltip: null},
                {name: labels.target, tooltip: null},
                {name: labels.duration, tooltip: null}
            );
        }
        return props.filter(p => !!p && !!p.name);
    }

    _getItemCategory() {
        let category = {
            enabled: false,
            value: "",
            tooltip: ""
        };

        const item = this.document;
        const itemData = item.system;

        if (item.type === "weapon") {
            category.enabled = true;
            category.value = SFRPG.weaponTypes[itemData.weaponType];
            category.tooltip = "SFRPG.ItemSheet.Weapons.Category";
        } else if (item.type === "equipment") {
            category.enabled = true;
            category.value = SFRPG.equipmentTypes[itemData.armor.type];
            category.tooltip = "SFRPG.Items.Equipment.Category";
        } else if (item.type === "consumable") {
            category.enabled = true;
            category.value = SFRPG.consumableTypes[itemData.consumableType];
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
        let damage = Object.entries(formData).filter(e => e[0].startsWith("system.damage.parts"));
        formData["system.damage.parts"] = damage.reduce((arr, entry) => {
            let [i, key, type] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = { name: "", formula: "", types: {}, group: null };

            switch (key) {
            case 'name':
                arr[i].name = entry[1];
                break;
            case 'formula':
                arr[i].formula = entry[1];
                break;
            case 'types':
                if (type) arr[i].types[type] = entry[1];
                break;
            case 'group':
                arr[i].group = entry[1];
                break;
            }

            return arr;
        }, []);

        // Handle Critical Damage Array
        let criticalDamage = Object.entries(formData).filter(e => e[0].startsWith("system.critical.parts"));
        formData["system.critical.parts"] = criticalDamage.reduce((arr, entry) => {
            let [i, key, type] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = { formula: "", types: {}, operator: "" };

            switch (key) {
            case 'formula':
                arr[i].formula = entry[1];
                break;
            case 'types':
                if (type) arr[i].types[type] = entry[1];
                break;
            }

            return arr;
        }, []);

        // Handle Ability Adjustments array
        let abilityMods = Object.entries(formData).filter(e => e[0].startsWith("system.abilityMods.parts"));
        formData["system.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Update the Item
        return super._updateObject(event, formData);
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
        html.find(".visualization-control").click(this._onActorResourceVisualizationControl.bind(this));
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

        html.find('input[class="data.supportedSizes"]').change(this._onChangeSupportedStarshipSizes.bind(this));

        html.find('img[name="resource-image"]').click(this._onClickResourceVisualizationImage.bind(this));
        html.find('select[name="resource-mode"]').change(this._onChangeResourceVisualizationMode.bind(this));
        html.find('input[name="resource-value"]').change(this._onChangeResourceVisualizationValue.bind(this));
        html.find('input[name="resource-title"]').change(this._onChangeResourceVisualizationTitle.bind(this));
    }

    /* -------------------------------------------- */

    async _onAbilityAdjustmentsControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new ability adjustment component
        if (a.classList.contains("add-ability-adjustment")) {
            await this._onSubmit(event);
            const abilityMods = this.item.system.abilityMods;
            return this.item.update({
                "system.abilityMods.parts": abilityMods.parts.concat([
                    [0, ""]
                ])
            });
        }

        // Remove an ability adjustment component
        if (a.classList.contains("delete-ability-adjustment")) {
            await this._onSubmit(event);
            const li = a.closest(".ability-adjustment-part");
            const abilityMods = duplicate(this.item.system.abilityMods);
            abilityMods.parts.splice(Number(li.dataset.abilityAdjustment), 1);
            return this.item.update({
                "system.abilityMods.parts": abilityMods.parts
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
            const damage = this.item.system.damage;
            return this.item.update({
                "system.damage.parts": damage.parts.concat([
                    { name: "", formula: "", types: {}, group: null }
                ])
            });
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = duplicate(this.item.system.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({
                "system.damage.parts": damage.parts
            });
        }

        // Add new critical damage component
        if (a.classList.contains("add-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const criticalDamage = this.item.system.critical;
            return this.item.update({
                "system.critical.parts": criticalDamage.parts.concat([
                    ["", ""]
                ])
            });
        }

        // Remove a critical damage component
        if (a.classList.contains("delete-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const criticalDamage = duplicate(this.item.system.critical);
            criticalDamage.parts.splice(Number(li.dataset.criticalPart), 1);
            return this.item.update({
                "system.critical.parts": criticalDamage.parts
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

        const modifiers = duplicate(this.item.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;

        await this.item.update({
            'system.modifiers': modifiers
        });
    }

    async _onAddStorage(event) {
        event.preventDefault();

        let storage = duplicate(this.item.system.container.storage);
        storage.push({
            type: "bulk",
            subtype: "",
            amount: 0,
            acceptsType: [],
            weightMultiplier: 1,
            weightProperty: ""
        });
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onRemoveStorage(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.system.container.storage);
        storage.splice(slotIndex, 1);
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageType(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.system.container.storage);
        storage[slotIndex].type = event.currentTarget.value;
        if (storage[slotIndex].type === "bulk") {
            storage[slotIndex].subtype = "";
            storage[slotIndex].weightProperty = "bulk";
        } else {
            storage[slotIndex].weightProperty = "";
        }
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageSubtype(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.system.container.storage);
        storage[slotIndex].subtype = event.currentTarget.value;
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageAmount(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const inputNumber = Number(event.currentTarget.value);
        if (!Number.isNaN(inputNumber)) {
            let storage = duplicate(this.item.system.container.storage);
            storage[slotIndex].amount = inputNumber;
            await this.item.update({
                "system.container.storage": storage
            });
        }
    }

    async _onChangeStorageWeightProperty(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.system.container.storage);
        storage[slotIndex].weightProperty = event.currentTarget.value;
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageAcceptsItem(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const itemType = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        let storage = duplicate(this.item.system.container.storage);
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
            "system.container.storage": storage
        });
    }

    async _onChangeSupportedStarshipSizes(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const toggleSize = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        let supportedSizes = duplicate(this.item.system.supportedSizes);
        if (enabled && !supportedSizes.includes(toggleSize)) {
            supportedSizes.push(toggleSize);
        } else if (!enabled && supportedSizes.includes(toggleSize)) {
            supportedSizes = supportedSizes.filter(x => x !== toggleSize);
        }

        await this.item.update({
            "system.supportedSizes": supportedSizes
        });
    }

    async _onChangeStorageAffectsEncumbrance(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = duplicate(this.item.system.container.storage);
        storage[slotIndex].affectsEncumbrance = event.currentTarget.checked;
        await this.item.update({
            "system.container.storage": storage
        });
    }

    /** Actor resource visualization */
    async _onActorResourceVisualizationControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new visualization rule
        if (a.classList.contains("add-visualization")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const visualization = duplicate(this.item.system.combatTracker.visualization);
            return this.item.update({
                "system.combatTracker.visualization": visualization.concat([
                    { mode: "eq", value: 0, title: this.item.name, image: this.item.img }
                ])
            });
        }

        // Remove a visualization rule
        if (a.classList.contains("delete-visualization")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".visualization-part");
            const visualization = duplicate(this.item.system.combatTracker.visualization);
            visualization.splice(Number(li.dataset.index), 1);
            return this.item.update({
                "system.combatTracker.visualization": visualization
            });
        }
    }

    async _onClickResourceVisualizationImage(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = duplicate(this.item.system.combatTracker.visualization);
        const currentImage = visualization[visualizationIndex].image || this.item.img;

        const attr = event.currentTarget.dataset.edit;
        const fp = new FilePicker({
            type: "image",
            current: currentImage,
            callback: path => {
                visualization[visualizationIndex].image = path;
                this.item.update({
                    "system.combatTracker.visualization": visualization
                });
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async _onChangeResourceVisualizationMode(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].mode = event.currentTarget.value;

        return this.item.update({
            "system.combatTracker.visualization": visualization
        });
    }

    async _onChangeResourceVisualizationValue(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].value = Number(event.currentTarget.value);
        if (Number.isNaN(visualization[visualizationIndex].value)) {
            visualization[visualizationIndex].value = 0;
        }

        return this.item.update({
            "system.combatTracker.visualization": visualization
        });
    }

    async _onChangeResourceVisualizationTitle(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].title = event.currentTarget.value;

        return this.item.update({
            "system.combatTracker.visualization": visualization
        });
    }

    /** @override */
    async _render(...args) {
        await super._render(...args);

        if (this._tooltips === null) {
            this._tooltips = tippy.delegate(`#${this.id}`, {
                target: '[data-tippy-content]',
                allowHTML: true,
                arrow: false,
                placement: 'top-start',
                duration: [500, null],
                delay: [800, null]
            });
        }
    }

    async close(...args) {
        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

        return super.close(...args);
    }
}
