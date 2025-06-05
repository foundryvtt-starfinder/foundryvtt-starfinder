import { SFRPG } from "../config.js";
import SFRPGModifier from "../modifiers/modifier.js";
import RollContext from "../rolls/rollcontext.js";

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
 * @extends {foundry.appv1.sheets.ItemSheet}
 */
export class ItemSheetSFRPG extends foundry.appv1.sheets.ItemSheet {
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
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 770,
            height: 600,
            classes: ["sfrpg", "sheet", "item"],
            resizable: true,
            scrollY: [".tab.details"],
            tabs: [
                {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"},
                {navSelector: ".subtabs", contentSelector: ".sheet-details", initial: "properties"},
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

    async render(force, options) {
        if (game.combat && this.item.type === "effect") game.combat.apps[this.appId] = this;

        await super.render(force, options);
    }

    async close(options) {
        delete game.combat?.apps[this.appId];

        await super.close(options);
    }

    /* -------------------------------------------- */
    parseNumber(value, defaultValue) {
        if (value === 0 || value instanceof Number) return value;
        else if (!value) return defaultValue;

        const numericValue = Number(value);
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
        // Ensure derived data is included
        await this.item.processData();

        // Options for text enrichment, used later
        const rollData = RollContext.createItemRollContext(this.item, this.actor).getRollData() ?? {};
        const secrets = this.item.isOwner;

        data.itemData = data.data.system;
        data.actor = this.document.parent;
        data.labels = this.item.labels;

        // Item Type, Status, and Details
        data.itemType = game.i18n.format(`TYPES.Item.${data.item.type}`);
        data.itemStatus = this._getItemStatus();
        data.itemProperties = this._getItemProperties();
        data.isPhysical = data.itemData.hasOwnProperty("quantity");
        data.hasLevel = data.itemData.hasOwnProperty("level") && data.item.type !== "spell";
        data.hasHands = data.itemData.hasOwnProperty("hands");
        data.hasProficiency = data.itemData.proficient === true || data.itemData.proficient === false;
        data.isFeat = data.item.type === "feat";
        data.isActorResource = data.item.type === "actorResource";
        data.isWeapon = data.item.type === "weapon";
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

                data.placeholders.hardness = this.parseNumber(itemData.attributes.hardness, itemData.attributes.sturdy ? 5 + (2 * itemLevel) : 5 + itemLevel);
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

        // Determine whether to show calculated totals for fields with formulas
        if (itemData?.activation?.type || data.item.type === "weapon") {
            data.range = {};

            data.range.hasInput = (() => {
                // C/M/L on spells requires no input
                if (this.item.type === "spell") return !(["close", "medium", "long", "none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(itemData.range.units));
                // These ranges require no input
                else return !(["none", "personal", "touch", "planetary", "system", "plane", "unlimited"].includes(itemData.range.units));
            })();
            data.range.showTotal = !!itemData.range?.total && (String(itemData.range?.total) !== String(itemData.range?.value));

            data.area = {};
            data.area.showTotal = !!itemData.area?.total && (String(itemData.area?.total) !== String(itemData.area?.value));

            data.duration = {};
            data.duration.showTotal = !!itemData.duration?.total && (String(itemData.duration?.total) !== String(itemData.duration?.value));
            data.duration.hasInput = itemData.duration.units !== "instantaneous";

            data.uses = {};
            data.uses.showTotal = !!itemData.uses?.total && (String(itemData.uses?.total) !== String(itemData.uses?.max));

        }

        if (data.isActorResource && itemData.stage === "late") {
            data.range = {};

            data.range.showMinTotal = !!itemData.range.totalMin && (String(itemData.range.totalMin) !== String(itemData.range.min));
            data.range.showMaxTotal = !!itemData.range.totalMax && (String(itemData.range.totalMax) !== String(itemData.range.max));
        }

        // Vehicle Attacks
        if (data.isVehicleAttack) {
            data.placeholders.savingThrow = {};
            data.placeholders.savingThrow.value = data.item.system.save.dc;
        }

        if (data.item.type === "effect") {
            const duration = itemData.activeDuration;

            data.duration = {};
            data.duration.remaining = duration?.remaining?.string || (() => {
                if (duration.unit === "permanent") return CONFIG.SFRPG.effectDurationTypes[duration.unit];
                else return `${parseInt(duration.total || duration.value) || duration.value} ${CONFIG.SFRPG.effectDurationTypes[duration.unit]}`;
            })();
            data.duration.showTotal = !!duration.total && (String(duration.value) !== String(duration.total));

            data.expired = duration.remaining?.value <= 0 && !itemData.enabled;

            data.sourceActorChoices = {};
            if (game.combat?.started) {
                for (const combatant of game.combat.combatants) {
                    if (combatant.actorId === data.item?.actor?.id) continue;
                    data.sourceActorChoices[combatant.actorId] = combatant.name;
                }
            } else {
                const PCs = game.actors.filter(i => i.type === "character");
                for (const PC of PCs) {
                    data.sourceActorChoices[PC.id] = PC.name;
                }
            }

            // Turn Events
            for (const [i, turnEvent] of (data.itemData.turnEvents || []).entries()) {
                turnEvent.enrichedNote = await TextEditor.enrichHTML(turnEvent.content, {
                    rollData,
                    secrets
                });
                turnEvent.noteI = `system.turnEvents.${i}.content`;
            }
        }

        // Similar to actor-modifiers.getAllModifiers()
        // we need to enforce the type of the modifiers to be SFRPGModifier
        this.item.system.modifiers = this.item.system.modifiers?.map(mod => {
            return new SFRPGModifier(mod, {parent: this.item});
        });

        data.modifiers = this.item.system.modifiers;

        data.hasSpeed = this.item.system.weaponType === "tracking" || (this.item.system.special && this.item.system.special["limited"]);
        data.hasCapacity = this.item.hasCapacity();

        // Enrich text editors

        data.enrichedDescription = await TextEditor.enrichHTML(this.item.system?.description?.value, {
            rollData,
            secrets
        });
        data.enrichedShortDescription = await TextEditor.enrichHTML(this.item.system?.description?.short, {
            rollData,
            secrets
        });
        data.enrichedGMNotes = await TextEditor.enrichHTML(this.item.system?.description?.gmNotes, {
            rollData,
            secrets
        });

        if (data?.item?.type === "starshipAction") {
            data.enrichedEffectNormal = await TextEditor.enrichHTML(this.item.system?.effectNormal, {
                rollData,
                secrets
            });
            data.enrichedEffectCritical = await TextEditor.enrichHTML(this.item.system?.effectCritical, {
                rollData,
                secrets
            });

            // Manage Subactions
            if (data?.itemData?.formula?.length > 1) {
                data.subactionEditorInfo = [];
                let ct = 0;
                for (const value of data.itemData.formula) {
                    const effect = {};

                    effect.enrichedEffectNormal = await TextEditor.enrichHTML(value.effectNormal, {
                        rollData,
                        secrets
                    });
                    effect.targetNormal = `system.formula.${ct}.effectNormal`;

                    effect.enrichedEffectCritical = await TextEditor.enrichHTML(value.effectCritical, {
                        rollData,
                        secrets
                    });
                    effect.targetCritical = `system.formula.${ct}.effectCritical`;
                    ct += 1;
                    data.subactionEditorInfo.push(effect);
                }
            }
        }

        return data;
    }

    /* -------------------------------------------- */

    async _computeSavingThrowValue(itemLevel, formula) {
        try {
            const rollData = {
                owner: this.item.actor ? foundry.utils.deepClone(this.item.actor.system) : {abilities: {dex: {mod: 0}}},
                item: foundry.utils.deepClone(this.item.system),
                itemLevel: itemLevel
            };
            if (!rollData.owner.abilities?.dex?.mod) {
                rollData.owner.abilities = {dex: {mod: 0}};
            }
            const saveRoll = Roll.create(formula, rollData);
            return saveRoll.evaluate();
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

        if (["weapon", "equipment", "shield"].includes(item.type)) return itemData.equipped ? game.i18n.localize("SFRPG.InventoryEquipped") : game.i18n.localize("SFRPG.InventoryNotEquipped");
        else if (item.type === "feat") return CONFIG.SFRPG.featureCategories[itemData.details.category]?.label || "";
        else if (item.type === "starshipWeapon") return game.i18n.localize(`SFRPG.Items.ShipWeapon.${itemData.mount.mounted ? "Mounted" : "NotMounted"}`);
        else if (item.type === "effect") return game.i18n.localize(`SFRPG.${itemData.enabled ? "Enabled" : "Disabled"}`);
        else if (item.type === "augmentation") {
            return `${CONFIG.SFRPG.augmentationTypes[itemData.type]} (${CONFIG.SFRPG.augmentationSystems[itemData.system] || ""})`;
        } else if (item.type === "vehicleSystem") {
            // Only systems which can be activated have an activation status
            if (this.document.canBeActivated() === false) {
                return "";
            }

            return this.document.isActive() ? game.i18n.localize("SFRPG.VehicleSystemSheet.Activated") : game.i18n.localize("SFRPG.VehicleSystemSheet.NotActivated");
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
                })),
            {title: game.i18n.localize("SFRPG.Items.Activation.RangeIncrement"), name: labels.range, tooltip: null}
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
                itemData.concentration ? {name: game.i18n.localize("SFRPG.Items.Spell.Concentration"), tooltip: null} : null,
                itemData.sr ? {name: game.i18n.localize("SFRPG.SpellResistance"), tooltip: null} : null,
                itemData.dismissible ? {name: game.i18n.localize("SFRPG.Items.Spell.Dismissible"), tooltip: null} : null,
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
            const wieldedBonus = (itemData.proficient ? itemData.bonus.wielded : 0) || 0;
            const alignedBonus = (itemData.proficient ? itemData.bonus.aligned : 0) || 0;
            // Add max dexterity modifier
            props.push(
                itemData.dex
                    ? {
                        title: game.i18n.localize("SFRPG.Items.Shield.AcMaxDexLabel"),
                        name: (itemData.dex || 0).signedString(),
                        tooltip: null
                    }
                    : null,
                itemData.acp
                    ? {
                        title: game.i18n.localize("SFRPG.Items.Shield.ArmorCheckLabel"),
                        name: (itemData.acp || 0).signedString(),
                        tooltip: null
                    }
                    : null,
                {
                    title: game.i18n.localize("SFRPG.Items.Shield.Bonus"),
                    name: game.i18n.format("SFRPG.Items.Shield.Bonuses", {
                        wielded: wieldedBonus.signedString(),
                        aligned: alignedBonus.signedString()
                    }),
                    tooltip: null
                },
                itemData.proficient
                    ? { name: game.i18n.localize("SFRPG.Items.Proficient"), tooltip: null }
                    : { name: game.i18n.localize("SFRPG.Items.NotProficient"), tooltip: null }
            );
        } else if (item.type === "vehicleAttack") {
            if (item.ignoresHardness && item.ignoresHardness > 0) {
                props.push(game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + item.ignoresHardness);
            }
        } else if (item.type === "vehicleSystem") {
            if (item.senses && item.senses.usedForSenses) {
                // We deliminate the senses by `,` and present each sense as a separate property
                const sensesDeliminated = item.senses.senses.split(",");
                for (let index = 0; index < sensesDeliminated.length; index++) {
                    const sense = sensesDeliminated[index];
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
            const rangeTooltip = ["close", "medium", "long"].includes(itemData?.range?.units)
                ? game.i18n.format(`SFRPG.Range${itemData?.range?.units?.capitalize()}`)
                : null;
            props.push(
                {title: game.i18n.localize("SFRPG.Items.Activation.Activation"), name: labels.activation, tooltip: null},
                {title: game.i18n.localize("SFRPG.Items.Activation.Target"), name: labels.target, tooltip: null},
                itemData.range.units !== "none" ? {title: game.i18n.localize("SFRPG.Items.Activation.Range"), name: labels.range, tooltip: rangeTooltip} : null,
                (itemData.area.value || itemData.area.total)
                    ? {title: game.i18n.localize("SFRPG.Items.Activation.Area"), name: labels.area, tooltip: null}
                    : null,
                (itemData.duration.units !== "text" || itemData.duration.value || itemData.duration.total)
                    ? {title: game.i18n.localize("SFRPG.Items.Activation.Duration"), name: labels.duration, tooltip: null}
                    : null
            );
        }
        return props.filter(p => !!p && !!p.name);
    }

    _getItemCategory() {
        const category = {
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
        const damage = Object.entries(formData).filter(e => e[0].startsWith("system.damage.parts"));
        formData["system.damage.parts"] = damage.reduce((arr, entry) => {
            const [i, key, type] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = { name: "", formula: "", types: {}, group: null, isPrimarySection: false };

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
                case 'isPrimarySection':
                    arr[i].isPrimarySection = entry[1];
                    break;
            }

            return arr;
        }, []);

        // Handle Critical Damage Array
        const criticalDamage = Object.entries(formData).filter(e => e[0].startsWith("system.critical.parts"));
        formData["system.critical.parts"] = criticalDamage.reduce((arr, entry) => {
            const [i, key, type] = entry[0].split(".").slice(3);
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
        const abilityMods = Object.entries(formData).filter(e => e[0].startsWith("system.abilityMods.parts"));
        formData["system.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
            const [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Handle Starship Action/Subaction Formulas
        if (this.object.type === "starshipAction") {
            const currentFormula = {system: {formula: Object.assign({}, this.item.system.formula)}};
            const formula = Object.entries(formData).filter(e => e[0].startsWith("system.formula"));
            const newFormula = {};

            for (const [k, v] of formula) {
                newFormula[k] = v;
                delete formData[k];
            }

            const expanded = foundry.utils.expandObject(newFormula);
            const final = Object.values(foundry.utils.mergeObject(currentFormula, expanded, {overwrite:true}).system.formula);
            formData["system.formula"] = final;
        }

        // Handle turn events
        if (this.object.type === "effect") {
            const currentEvents = {system: {turnEvents: Object.assign({}, this.item.system.turnEvents)}};
            const formula = Object.entries(formData).filter(e => e[0].startsWith("system.turnEvents"));
            const newEvents = {};

            for (const [k, v] of formula) {
                newEvents[k] = v;
                delete formData[k];
            }

            const expanded = foundry.utils.expandObject(newEvents);
            const final = Object.values(foundry.utils.mergeObject(currentEvents, expanded, {overwrite:true}).system.turnEvents);
            formData["system.turnEvents"] = final;
        }

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
        html.find("input.primary-section-checkbox").click(this._onTogglePrimaryDamageSection.bind(this));
        html.find(".visualization-control").click(this._onActorResourceVisualizationControl.bind(this));
        html.find(".ability-adjustments-control").click(this._onAbilityAdjustmentsControl.bind(this));
        html.find(".subaction-control").click(this._onSubactionControl.bind(this));
        html.find(".turn-event-control").click(this._onTurnEventControl.bind(this));

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

        html.find('input[class="system.supportedSizes"]').change(this._onChangeSupportedStarshipSizes.bind(this));

        html.find('img[name="resource-image"]').click(this._onClickResourceVisualizationImage.bind(this));
        html.find('select[name="resource-mode"]').change(this._onChangeResourceVisualizationMode.bind(this));
        html.find('input[name="resource-value"]').change(this._onChangeResourceVisualizationValue.bind(this));
        html.find('input[name="resource-title"]').change(this._onChangeResourceVisualizationTitle.bind(this));

        // toggle timedEffect
        html.find('.effect-details-toggle').on('click', this._onToggleDetailsEffect.bind(this));
        html.find("div[data-origin-uuid]").on("click", this._onClickOrigin.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Add or remove a subaction from a starship action
     * @param {Event} event     The original click event
     * @return {Promise}
     * @private
     */
    async _onSubactionControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const formula = this.item.system.formula;
        await this._onSubmit(event); // Submit any unsaved changes

        // Add a new subaction
        if (a.classList.contains("add-subaction")) {
            return this.item.update({
                "system.formula": formula.concat([
                    { dc: {resolve:false, value:""}, formula: "", name:"", effectNormal:"", effectCritical:"" }
                ])
            });
        }

        // Remove a subaction
        else if (a.classList.contains("delete-subaction")) {
            const li = a.closest(".subaction-part");
            formula.splice(Number(li.dataset.subactionPart), 1);
            return this.item.update({
                "system.formula": formula
            });
        }
    }

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
            const abilityMods = foundry.utils.deepClone(this.item.system.abilityMods);
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
                    { name: "", formula: "", types: {}, group: null, isPrimarySection: false }
                ])
            });
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = foundry.utils.deepClone(this.item.system.damage);
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
            const criticalDamage = foundry.utils.deepClone(this.item.system.critical);
            criticalDamage.parts.splice(Number(li.dataset.criticalPart), 1);
            return this.item.update({
                "system.critical.parts": criticalDamage.parts
            });
        }
    }

    async _onTogglePrimaryDamageSection(event) {
        event.preventDefault();
        const checked = event.currentTarget.checked;
        const itemParts = this.item.system.damage.parts;
        const idx = event.currentTarget.closest("li.damage-part").dataset.damagePart;
        const part = itemParts[idx];

        for (const p of itemParts) {
            p.isPrimarySection = false;
        }

        part.isPrimarySection = checked;

        // There must always be one primary damage section, so if they're all disabled, set section 0 as primary.
        if (!(itemParts.some(part => part.isPrimarySection))) itemParts[0].isPrimarySection = true;

        return this.item.update({
            "system.damage.parts": itemParts
        });
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
    * Delete a modifier from the actor.
    *
    * @param {Event} event The originating click event
    */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');
        const modifier = this.item.system.modifiers.find(mod => mod._id === modifierId);

        return modifier.parentDelete();
    }
    /**
    * Edit a modifier for an item.
    * @param {Event} event The orginating click event
    */
    async _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');
        const modifier = this.item.system.modifiers.find(mod => mod._id === modifierId);

        return modifier.edit();
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

        const modifiers = this.item.system.modifiers;
        const modifier = modifiers.find(mod => mod._id === modifierId);

        return modifier.toggle();
    }

    async _onAddStorage(event) {
        event.preventDefault();

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
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

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
        storage.splice(slotIndex, 1);
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageType(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
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

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
        storage[slotIndex].subtype = event.currentTarget.value;
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageAmount(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const inputNumber = Number(event.currentTarget.value);
        if (!Number.isNaN(inputNumber)) {
            const storage = foundry.utils.deepClone(this.item.system.container.storage);
            storage[slotIndex].amount = inputNumber;
            await this.item.update({
                "system.container.storage": storage
            });
        }
    }

    async _onChangeStorageWeightProperty(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
        storage[slotIndex].weightProperty = event.currentTarget.value;
        await this.item.update({
            "system.container.storage": storage
        });
    }

    async _onChangeStorageAcceptsItem(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const itemType = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
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

        const toggleSize = event.currentTarget.dataset.size;
        const enabled = event.currentTarget.checked;

        let supportedSizes = this.item.system.supportedSizes;
        const previouslyEnabled = supportedSizes.includes(toggleSize);

        if (enabled && !previouslyEnabled) {
            supportedSizes.push(toggleSize);
        } else if (!enabled && previouslyEnabled) {
            supportedSizes = supportedSizes.filter(x => x !== toggleSize);
        }

        await this.item.update({
            "system.supportedSizes": supportedSizes
        });
    }

    async _onChangeStorageAffectsEncumbrance(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const storage = foundry.utils.deepClone(this.item.system.container.storage);
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
            const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
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
            const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
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

        const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
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

        const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
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

        const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
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

        const visualization = foundry.utils.deepClone(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].title = event.currentTarget.value;

        return this.item.update({
            "system.combatTracker.visualization": visualization
        });
    }

    /**
     * Toggle an effect and their modifiers to be enabled or disabled.
     * @param {Event} event The originating click event
     */
    async _onToggleDetailsEffect(event) {
        event.preventDefault();
        const checked = event.currentTarget.checked;

        if (!this.item.actor) {
            const updates = {
                system: {
                    enabled: checked,
                    modifiers: this.item.system.modifiers
                }
            };

            for (const modifier of updates.system.modifiers) {
                modifier.enabled = checked;
            }

            await this.item.update(updates);
        } else {
            this.item.timedEffect?.toggle();
        }
    }

    async _onClickOrigin(event) {
        event.preventDefault();
        const uuid = event.currentTarget.dataset.originUuid;
        const doc = await fromUuid(uuid);

        doc.sheet.render(true);
    }

    /**
     * Add or remove a turn event from an effect
     * @param {Event} event     The original click event
     * @return {Promise}        The update promise
     * @private
     */
    async _onTurnEventControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const turnEvents = this.item.system.turnEvents;
        await this._onSubmit(event); // Submit any unsaved changes

        // Add a new turn event
        if (a.classList.contains("add-turn-event")) {
            return this.item.update({
                "system.turnEvents": turnEvents.concat([
                    {
                        trigger: "onTurnEnd",
                        type: "roll",
                        formula: "",
                        damageTypes: {},
                        name: ""
                    }
                ])
            });
        }

        // Remove a turn event
        else if (a.classList.contains("delete-turn-event")) {
            const li = a.closest(".turn-event");
            turnEvents.splice(Number(li.dataset.turnEventIdx), 1);
            return this.item.update({
                "system.turnEvents": turnEvents
            });
        }
    }
}
