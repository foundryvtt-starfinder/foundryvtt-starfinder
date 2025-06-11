import { getItemContainer } from "../actor/actor-inventory-utils.js";
import AbilityTemplate from "../canvas/ability-template.js";
import { SFRPG } from "../config.js";
import { DiceSFRPG } from "../dice.js";
import SFRPGModifier from "../modifiers/modifier.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../modifiers/types.js";
import RollContext from "../rolls/rollcontext.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";
import { Mix } from "../utils/custom-mixer.js";
import { ItemActivationMixin } from "./mixins/item-activation.js";
import { ItemCapacityMixin } from "./mixins/item-capacity.js";

/** @extends {foundry.documents.Item} */
export class ItemSFRPG extends Mix(foundry.documents.Item).with(ItemActivationMixin, ItemCapacityMixin) {

    constructor(data, context = {}) {
        // Set module art if available. This applies art to items viewed or created from compendiums.
        if (context.pack && data._id) {
            const art = game.sfrpg.compendiumArt.map.get(`Compendium.${context.pack}.${data._id}`);
            if (art) {
                data.img = art.item;
            }
        }
        super(data, context);
    }

    /* -------------------------------------------- */
    /*  Item Properties                             */
    /* -------------------------------------------- */

    /**
     * Does the Item implement an attack roll as part of its usage
     * @type {boolean}
     */
    get hasAttack() {
        if (this.type === "starshipWeapon") return true;
        return ["mwak", "rwak", "msak", "rsak"].includes(this.system.actionType);
    }

    get hasOtherFormula() {
        return ("formula" in this.system) && this.system.formula?.trim().length > 0;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a damage roll as part of its usage
     * @type {boolean}
     */
    get hasDamage() {
        return !!(this.system.damage && this.system.damage.parts.length);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSave() {
        const saveData = this.system?.save;
        if (!saveData) {
            return false;
        }

        const hasType = !!saveData.type;
        return hasType;
    }

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSkill() {
        const skillData = this.system?.skillCheck;
        if (!skillData) return false;

        return !!skillData.type;
    }

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasArea() {
        const areaData = this.system?.area;
        if (!areaData) return false;

        return !!(areaData?.value || areaData?.total);
    }

    /**
     * The timedEffect object of this item, if any.
     * @returns {SFRPGTimedEffect|undefined}
     */
    get timedEffect() {
        return game.sfrpg.timedEffects.get(this.uuid);
    }

    get origin() {
        return fromUuidSync(this.system?.context?.origin?.actorUuid) || null;
    }

    get originItem() {
        return fromUuidSync(this.system?.context?.origin?.itemUuid) || null;
    }

    /* -------------------------------------------- */
    /*	Data Preparation                             */
    /* -------------------------------------------- */

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();
        const C = CONFIG.SFRPG;
        const labels = {};
        const itemData = this;
        const actorData = this.parent ? this.parent.system : {};
        const data = this.system;

        // Spell Level,  School, and Components
        if (itemData.type === "spell") {
            labels.level = C.spellLevels[data.level];
            labels.school = C.spellSchools[data.school];
        }

        // Feat Items
        else if (itemData.type === "feat") {
            const act = data.activation;
            labels.featType = data?.damage?.parts?.length && ["mwak", "rwak", "msak", "rsak"].includes(data.actionType)
                ? game.i18n.localize("SFRPG.Attack")
                : CONFIG.SFRPG.abilityActivationTypes[act.type] ? game.i18n.localize("SFRPG.Items.Action.TitleAction") : game.i18n.localize("SFRPG.Passive");
        }

        // Equipment Items
        else if (itemData.type === "equipment") {
            labels.eac = data.armor.eac ? `${data.armor.eac} ${game.i18n.localize("SFRPG.EnergyArmorClassShort")}` : "";
            labels.kac = data.armor.kac ? `${data.armor.kac} ${game.i18n.localize("SFRPG.KineticArmorClassShort")}` : "";
        }

        // Apply a tag if the item is a weapon that's not equipment (unarmed strike, natural attack, etc.)
        if (itemData.type === "weapon") {
            itemData.system.transferrable = itemData.system.isEquipment;
        } else {
            itemData.system.transferrable = true;
        }

        // Activated Items
        if (data.hasOwnProperty("activation")) {

            // Ability Activation Label
            const act = data.activation || {};
            if (act) {
                if (act.type === "none") {
                    labels.activation = game.i18n.localize("SFRPG.AbilityActivationTypesNoneButton");
                } else {
                    labels.activation = [
                        act.cost,
                        C.abilityActivationTypes[act.type]
                    ].filterJoin(" ");
                }
            }

            const tgt = data.target || {};
            if (tgt.value && tgt.value === "") tgt.value = null;

            labels.target = [tgt.value].filterJoin(" ");

            /* let area = data.area || {};
            if (typeof area.value === 'number' && area.value === 0) area.value = null;

            if (area.units === "text") labels.area = String(area.value || "")?.trim();
            else labels.area = [area.total || area.value, C.distanceUnits[area.units] || null, C.spellAreaShapes[area.shape], C.spellAreaEffects[area.effect]].filterJoin(" "); */
            // Now prepared in the calculate-activation-details closure!

            // Range Label
            /* let rng = data.range || {};
            labels.range = [rng.value || "", C.distanceUnits[rng.units]].filterJoin(" "); */
            // Now prepared in the calculate-activation-details closure!

            // Duration Label
            /* let dur = data.duration || {};
            labels.duration = [dur.value].filterJoin(" "); */
            // Now prepared in the calculate-activation-details closure!
        }

        // Item Actions
        if (data.hasOwnProperty("actionType")) {
            // Damage
            const damage = data.damage || {};
            const itemParts = damage.parts;
            if (itemParts.length > 0) {
                labels.damage = damage.parts
                    .map(d => d[0])
                    .join(" + ")
                    .replace(/\+ -/g, "- ");

                // There must always be one primary damage group or section.
                // If the primary damage group is set, mark all of the members of that group as primary.
                const allGroups = itemParts.reduce((arr, part) => {
                    if (!!part.group || part.group === 0) arr.push(part.group);
                    return arr;
                }, []);
                if (Number.isInteger(data.damage.primaryGroup) && allGroups.length > 0) {
                    // Set primary group to first group if no parts on the item are in the group
                    if (!(allGroups.includes(data.damage.primaryGroup)))
                        data.damage.primaryGroup = allGroups.sort()[0];

                    for (const part of itemParts) {
                        if (part.group === data.damage.primaryGroup) part.isPrimarySection = true;
                        else part.isPrimarySection = false;
                    }

                // If the primary group is blank, set the 1st damage section, and any parts in the same group, as primary.
                } else if (!(itemParts.some(part => part.isPrimarySection))) {
                    itemParts[0].isPrimarySection = true;
                    const primaryGroup = itemParts[0].group ?? null;

                    if (primaryGroup !== null) {
                        for (const part of itemParts) {
                            if (part.group === primaryGroup) part.isPrimarySection = true;
                            else part.isPrimarySection = false;
                        }
                    }
                }

            }

        }

        // Assign labels and return the Item
        this.labels = labels;
    }

    async processData() {
        return game.sfrpg.engine.process("process-items", {
            item: this,
            itemData: this.system,
            owner: {
                actor: this.actor,
                actorData: this.actor?.system,
                token: this.actor?.token,
                scene: this.actor?.token?.parent
            }
        });
    }

    /**
     * Check to ensure that this item has a modifiers data object set, if not then set it.
     * These will always be needed from hence forth, so we'll just make sure that they always exist.
     *
     * @param {Object}      data The item data to check against.
     * @param {String|Null} prop A specific property name to check.
     *
     * @returns {Object}         The modified data object with the modifiers data object added.
     */
    _ensureHasModifiers(data, prop = null) {
        if (!foundry.utils.hasProperty(data, "modifiers")) {
            console.log(`Starfinder | ${this.name} does not have the modifiers data object, attempting to create them...`);
            data.modifiers = [];
        }

        return data;
    }

    /**
     * Extend preCreate to create class name slugs.
     * See the base Actor class for API documentation of this method
     *
     * @param {object} data           The initial data object provided to the document creation request
     * @param {object} options        Additional options which modify the creation request
     * @param {string} userId         The ID of the requesting user, always game.user.id
     * @returns {boolean|void}        Explicitly return false to prevent creation of this Document
     */
    async _preCreate(data, options, user) {
        const updates = {};
        const t = this.type;
        const itemData = this.system;

        if (t === "class" && !itemData?.slug) {
            updates["system.slug"] = this.name.slugify({replacement: "_", strict: true});
        }

        // Events for when an item is created on an actor since pre/_onCreateDescendantDocuments lie >:(
        if (this.actor) {
            if (["npc", "npc2"].includes(this.actor.type)) {
                if (["weapon", "shield"].includes(t)) updates['system.proficient'] = true;
                if (["weapon", "equipment"].includes(t)) updates['system.equipped'] = true;
                if (t === "spell") updates['system.prepared'] = true;
            }
            else {
                if (t === "weapon") {
                    const proficiencyKey = SFRPG.weaponTypeProficiency[itemData.weaponType];
                    const proficient = itemData.proficient || this.actor?.system?.traits?.weaponProf?.value?.includes(proficiencyKey);
                    if (proficient) updates["system.proficient"] = true;
                } else if (t === "shield") {
                    const proficiencyKey = "shl";
                    const proficient = itemData.proficient || this.actor?.system?.traits?.armorProf?.value?.includes(proficiencyKey);
                    if (proficient) updates["system.proficient"] = true;
                }
            }

            if (this.effects instanceof Array) this.effects = null;
            else if (this.effects instanceof Map) this.effects.clear();

            // Record current world time and initiative on effects
            if (t === "effect" && itemData.enabled) {
                updates['system.activeDuration.activationTime'] = game.time.worldTime;
                if (game.combat) updates['system.activeDuration.expiryInit'] = game.combat.initiative;
            }

            if (t === "asi") {
                const numASI = this.actor.items.filter(x => x.type === "asi").length;
                const level = 5 + numASI * 5;
                updates["name"] = game.i18n.format("SFRPG.ItemSheet.AbilityScoreIncrease.ItemName", {level: level});
            }

        } else {
            // Clear origin data if an effect is dragged from an actor to the sidebar.
            if (t === "effect") {
                updates["system.context.origin.actorUuid"] = "";
                updates["system.context.origin.itemUuid"] = "";
            }
        }

        // Apply a default icon to the item based on its type if it doesn't already have an icon selected
        if (Object.values(SFRPG.foundryDefaultIcons).includes(this.img)) {
            if (Object.keys(SFRPG.defaultItemIcons).includes(this.type)) {
                updates.img = ["systems/sfrpg/icons/default/", SFRPG.defaultItemIcons[this.type]].join("");
            }
        }

        this.updateSource(updates);

        return super._preCreate(data, options, user);
    }

    /* -------------------------------------------- */

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * @return {Promise}
     */
    async roll() {

        // Basic template rendering data
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.parent.id}.${token.id}` : null,
            item: this,
            system: await this.getChatData(),
            labels: this.labels,
            hasAttack: this.hasAttack,
            hasDamage: this.hasDamage,
            hasSave: this.hasSave,
            hasSkill: this.hasSkill,
            hasArea: this.hasArea && ["ft", "meter"].includes(this.system.area.units) && !["", "other"].includes(this.system.area.shape),
            hasOtherFormula: this.hasOtherFormula
        };

        if (this.type === "spell") {
            let descriptionText = foundry.utils.deepClone(templateData.system.description.short || templateData.system.description.value);
            if (descriptionText?.length > 0) {
                // Alter description by removing non-eligble level tags.
                const levelTags = [
                    {level: 0, tag: "level_0"},
                    {level: 1, tag: "level_1"},
                    {level: 2, tag: "level_2"},
                    {level: 3, tag: "level_3"},
                    {level: 4, tag: "level_4"},
                    {level: 5, tag: "level_5"},
                    {level: 6, tag: "level_6"}
                ];

                for (const {level, tag} of levelTags) {
                    const shouldShowEx = level === this.system.level;
                    const startTagEx = `[${tag}_only]`;
                    const endTagEx = `[/${tag}_only]`;

                    const shouldShowInc = level <= this.system.level;
                    const startTagInc = `[${tag}]`;
                    const endTagInc = `[/${tag}]`;

                    if (shouldShowEx) {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        while (tagStartIndex !== -1) {
                            descriptionText = descriptionText.replace(startTagEx, "");
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagEndIndex !== -1) {
                            descriptionText = descriptionText.replace(endTagEx, "");
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagStartIndex !== -1 && tagEndIndex !== -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagEx.length);
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    }

                    if (shouldShowInc) {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        while (tagStartIndex !== -1) {
                            descriptionText = descriptionText.replace(startTagInc, "");
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagEndIndex !== -1) {
                            descriptionText = descriptionText.replace(endTagInc, "");
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagStartIndex !== -1 && tagEndIndex !== -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagInc.length);
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    }
                }

                if (templateData.system.description.short) {
                    templateData.system.description.short = descriptionText;
                } else {
                    templateData.system.description.value = descriptionText;
                }
            }
        }

        // Render the chat card template
        const templateType = ["tool", "consumable"].includes(this.type) ? this.type : "item";
        const template = `systems/sfrpg/templates/chat/${templateType}-card.hbs`;
        const html = await renderTemplate(template, templateData);

        // Basic chat message data
        const chatData = {
            author: game.user.id,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            content: html,
            flags: {
                core: {
                    canPopout: true
                },
                sfrpg: {
                    item: this.uuid,
                    actor: this.actor.uuid,
                    level: this.system.level
                }
            },
            speaker: token ? ChatMessage.getSpeaker({token: token}) : ChatMessage.getSpeaker({actor: this.actor})
        };

        const rollMode = game.settings.get("core", "rollMode");
        ChatMessage.applyRollMode(chatData, rollMode);

        // Create the chat message
        return ChatMessage.create(chatData, { displaySheet: false });
    }

    /* -------------------------------------------- */
    /*  Chat Cards                                  */
    /* -------------------------------------------- */

    /**
     * Prepare this item's description, and chat message properties.
     * @returns {Object} An object containing the item's rollData (including its owners), and chat message properties.
     */
    async getChatData() {
        const data = foundry.utils.deepClone(this.system);
        const labels = this.labels;

        const async = true;
        const secrets = this.isOwner;
        const rollData = RollContext.createItemRollContext(this, this.actor).getRollData();

        // Rich text description
        if (data.description.short) data.description.short = await TextEditor.enrichHTML(data.description.short, {
            async,
            secrets,
            rollData
        });
        data.description.value = await TextEditor.enrichHTML(data.description.value, {
            async,
            secrets,
            rollData
        });

        // Item type specific properties
        const props = [];
        const fn = this[`_${this.type}ChatData`];
        if (fn) fn.bind(this)(data, labels, props);

        // General equipment properties
        const equippableTypes = ["weapon", "equipment", "shield"];
        if (data.hasOwnProperty("equipped") && equippableTypes.includes(this.type)) {
            props.push(
                {
                    name: data.equipped
                        ? game.i18n.localize("SFRPG.InventoryEquipped")
                        : game.i18n.localize("SFRPG.InventoryNotEquipped"),
                    tooltip: null
                },
                {
                    name: data.proficient
                        ? game.i18n.localize("SFRPG.Items.Proficient")
                        : game.i18n.localize("SFRPG.Items.NotProficient"),
                    tooltip: null
                }
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            if (data.activation.type && data.activation.type !== "none") props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Activation"), name: labels.activation, tooltip: null }
            );
            if (data.target.value) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Target"), name: labels.target, tooltip: null }
            );
            if ((data.range.value || data.range.total) && data.range.units !== "none") {
                const rangeTooltip = ["close", "medium", "long"].includes(data.range.units)
                    ? game.i18n.format(`SFRPG.Range${data.range.units.capitalize()}`)
                    : null;
                props.push(
                    { title: game.i18n.localize(`SFRPG.Items.Activation.Range${this.type === "weapon" ? "Increment" : ""}`), name: labels.range, tooltip: rangeTooltip }
                );
            }
            if (data.area.value || data.area.total) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Area"), name: labels.area, tooltip: null }
            );
            if (data.duration.value || data.duration.total) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Duration"), name: labels.duration, tooltip: null }
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push({
                name: labels.capacity,
                tooltip: null
            });
        }

        if (this.type === "container") {
            if (this.actor) {
                const wealthString = new Intl.NumberFormat(game.i18n.lang).format(Math.floor(this.contentWealth));
                const wealthProperty = game.i18n.format("SFRPG.CharacterSheet.Inventory.ContainedWealth", {wealth: wealthString});
                props.push({
                    name: wealthProperty,
                    tooltip: null
                });
            }
        }

        // Filter properties and return
        data.properties = props.filter(p => !!p && !!p.name);
        return data;
    }

    _getContainedItems() {
        const contents = this.system.container?.contents;
        if (!contents || !this.actor) {
            return [];
        }

        const itemsToTest = [this];
        const containedItems = [];
        while (itemsToTest.length > 0) {
            const itemToTest = itemsToTest.shift();

            const contents = itemToTest?.system?.container?.contents;
            if (contents) {
                for (const content of contents) {
                    const containedItem = this.actor.items.get(content.id);
                    if (containedItem) {
                        containedItems.push(containedItem);
                        itemsToTest.push(containedItem);
                    }
                }
            }
        }

        return containedItems;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for equipment type items
     * @private
     */
    _equipmentChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.armorTypes[data.armor.type], tooltip: null},
            {name: labels.eac || null, tooltip: null},
            {name: labels.kac || null, tooltip: null}
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for weapon type items
     * @private
     */
    _weaponChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.weaponTypes[data.weaponType], tooltip: null},
            ...Object.entries(data.properties).filter(e => e[1] === true)
                .map(e => ({name: CONFIG.SFRPG.weaponProperties[e[0]], tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[e[0]]})
                )
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for consumable type items
     * @private
     */
    _consumableChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.consumableTypes[data.consumableType], tooltip: null},
            {name: this.getRemainingUses() + "/" + this.getMaxUses() + ` ${game.i18n.localize("SFRPG.FeaturesCharges")}`, tooltip: null}
        );
        data.hasCharges = this.getRemainingUses() >= 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for goods type items
     * @private
     */
    _goodsChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.itemTypes["goods"], tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for technological type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _technologicalChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.technological"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for hybrid type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _hybridChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.hybrid"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for magic type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _magicChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.magic"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for armor upgrades
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _upgradeChatData(data, labels, props) {
        let allowedArmorType = "";

        if (data.allowedArmorType === 'any') {
            allowedArmorType = game.i18n.localize("SFRPG.Any");
        } else {
            allowedArmorType = CONFIG.SFRPG.allowedArmorTypes[data.allowedArmorType];
        }

        props.push(
            {name: game.i18n.localize("TYPES.Item.upgrade"), tooltip: null},
            data.slots ? {name: `${game.i18n.localize("SFRPG.Items.Upgrade.Slots")} ${data.slots}`, tooltip: null} : null,
            {name: `${game.i18n.localize("SFRPG.Items.Upgrade.AllowedArmorType")}: ${allowedArmorType}`, tooltip: null}
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            {name:game.i18n.localize("TYPES.Item.augmentation"), tooltip: null},
            data.type ? {name: CONFIG.SFRPG.augmentationTypes[data.type], tooltip: null} : null,
            data.system ? {name: CONFIG.SFRPG.augmentationSystems[data.system], tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for weapon fusions
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _fusionChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.fusion"), tooltip: null},
            data.level ? {name: `${game.i18n.localize("SFRPG.LevelLabelText")} ${data.level}`, tooltip: null} : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.starshipWeapon"), tooltip: null},
            data.weaponType ? {name: CONFIG.SFRPG.starshipWeaponTypes[data.weaponType], tooltip: null} : null,
            data.class ? {name: CONFIG.SFRPG.starshipWeaponClass[data.class], tooltip: null} : null,
            data.range ? {name: CONFIG.SFRPG.starshipWeaponRanges[data.range], tooltip: null} : null,
            data.mount.mounted ? {name: game.i18n.localize("SFRPG.Items.ShipWeapon.Mounted"), tooltip: null} : {name: game.i18n.localize("SFRPG.Items.ShipWeapon.NotMounted"), tooltip: null},
            data.speed > 0 ? {name: game.i18n.format("SFRPG.Items.ShipWeapon.Speed", {speed: data.speed}), tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for shield type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _shieldChatData(data, labels, props) {
        const wieldedBonus = (data.proficient ? data.bonus.wielded : 0) || 0;
        const alignedBonus = (data.proficient ? data.bonus.aligned : 0) || 0;

        props.push(
            { name: game.i18n.localize("SFRPG.Items.Shield.Shield"), tooltip: null },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.AcMaxDexLabel"),
                name: (data.dex || 0).signedString(),
                tooltip: null
            },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.ArmorCheckLabel"),
                name: (data.acp || 0).signedString(),
                tooltip: null
            },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.Bonus"),
                name: game.i18n.format("SFRPG.Items.Shield.Bonuses", {
                    wielded: wieldedBonus.signedString(),
                    aligned: alignedBonus.signedString()
                }),
                tooltip: null
            },
            data.proficient
                ? { name: game.i18n.localize("SFRPG.Items.Proficient"), tooltip: null }
                : { name: game.i18n.localize("SFRPG.Items.NotProficient"), tooltip: null }
        );
    }

    /* -------------------------------------------- */

    /**
     * Render a chat card for Spell type data
     * @return {Object}
     * @private
     */
    _spellChatData(data, labels, props) {

        // Spell properties
        props.push(
            {name: labels.level, tooltip: null}
        );

        // Spell school
        if (CONFIG.SFRPG.spellSchools[data.school]) {
            props.push(
                {name: game.i18n.localize(SFRPG.spellSchools[data.school]), tooltip: null}
            );
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for items of the "Feat" type
     */
    _featChatData(data, labels, props) {
        // Feat properties
        props.push(
            {name: data.requirements, tooltip: null}
        );
    }

    _themeChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.theme"), tooltip: null},
            data.abilityMod.ability ? {name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null} : null,
            data.skill ? {name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null} : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.race"), tooltip: null},
            data.type ? {name: data.type, tooltip: null} : null,
            data.subtype ? {name: data.subtype, tooltip: null} : null
        );
    }

    _vehicleAttackChatData(data, label, props) {
        props.push(
            data.ignoresHardness ? game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + data.ignoresHardness : null
        );
    }

    _vehicleSystemChatData(data, label, props) {

        if (data.senses &&  data.senses.usedForSenses) {
            // We deliminate the senses by `,` and present each sense as a separate property
            const sensesDeliminated = data.senses.senses.split(",");
            for (let index = 0; index < sensesDeliminated.length; index++) {
                const sense = sensesDeliminated[index];
                props.push(sense);
            }
        }
    }

    /* -------------------------------------------- */
    /*  Item Rolls - Attack, Damage, Saves, Checks  */
    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.d20Roll logic for the core implementation
     *
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    async rollAttack(options = {}) {
        const itemData = this.system;
        const isWeapon = ["weapon", "shield"].includes(this.type);

        const actorData = this.actor.system;
        if (!this.hasAttack) {
            ui.notifications.error("You may not make an Attack Roll with this Item.");
            return;
        }

        if (this.type === "starshipWeapon") return this._rollStarshipAttack(options);
        if (this.type === "vehicleAttack") return this._rollVehicleAttack(options);

        // Determine ability score modifier
        let abl = itemData.ability;
        if (!abl && (this.actor.type === "npc" || this.actor.type === "npc2")) abl = "";
        else if (!abl && (this.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        else if (itemData.properties?.operative && actorData.abilities.dex.value > actorData.abilities.str.value) abl = "dex";
        else if (!abl) abl = "str";

        // Define Roll parts
        const parts = [];

        if (Number.isNumeric(itemData.attackBonus) && itemData.attackBonus !== 0) parts.push("@item.attackBonus");
        if (abl) parts.push(`@abilities.${abl}.mod`);
        if (["character", "drone"].includes(this.actor.type)) parts.push("@attributes.baseAttackBonus.value");
        if (isWeapon) {
            const proficiencyKey = SFRPG.weaponTypeProficiency[this.system.weaponType];
            const proficient = itemData.proficient || this.actor?.system?.traits?.weaponProf?.value?.includes(proficiencyKey);
            if (!proficient) {
                parts.push(`-4[${game.i18n.localize("SFRPG.Items.NotProficient")}]`);
            }
        }

        let modifiers = this.getAppropriateAttackModifiers(isWeapon);

        const stackModifiers = new StackModifiers();
        modifiers = await stackModifiers.processAsync(modifiers, null, {actor: this.actor});

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                rolledMods.push(bonus);
                return;
            }
            const computedBonus = bonus.modifier;
            parts.push({score: computedBonus, explanation: bonus.name});
            return computedBonus;
        };

        Object.entries(modifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return 0;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    addModifier(bonus, parts);
                }
            } else {
                addModifier(mod[1], parts);
            }

            return 0;
        }, 0);

        // Define Critical threshold
        const critThreshold = 20;
        // if ( this.type === "weapon" ) critThreshold = this.actor.getFlag("sfrpg", "weaponCriticalThreshold") || 20;

        const rollOptions = {};

        if (this.system.actionTarget) {
            rollOptions.actionTarget = this.system.actionTarget;
            rollOptions.actionTargetSource = SFRPG.actionTargets;
        }

        // Define Roll Data
        const rollData = foundry.utils.deepClone(actorData);
        // Add hasSave to roll
        itemData.hasSave = this.hasSave;
        itemData.hasSkill = this.hasSkill;
        itemData.hasArea = this.hasSkill;
        itemData.hasDamage = this.hasDamage;
        itemData.hasCapacity = this.hasCapacity();

        rollData.item = itemData;
        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        // Warn the user if there is no ammo left
        const usage = itemData.usage?.value || 0;
        const availableCapacity = this.getCurrentCapacity();
        if (availableCapacity < usage) {
            ui.notifications.warn(game.i18n.format("SFRPG.ItemNoAmmo", {name: this.name}));
        }

        const rollContext = RollContext.createItemRollContext(this, this.actor, {itemData: itemData});

        /** Create global attack modifiers. */
        const additionalModifiers = foundry.utils.deepClone(SFRPG.globalAttackRollModifiers).map(mod => {
            const modInstance = {bonus: new SFRPGModifier(mod.bonus, {parent: this, globalModifier: true})};
            return modInstance;
        });

        /** Apply bonus rolled mods from relevant attack roll formula modifiers. */
        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");

        // Call the roll helper utility
        await DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
            actorContextKey: "owner",
            rollContext: rollContext,
            title: title,
            flavor: await TextEditor.enrichHTML(this.system?.chatFlavor, {
                async: true,
                rollData: this.actor.getRollData() ?? {},
                secrets: this.isOwner
            }),
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: critThreshold,
            chatMessage: options.chatMessage,
            rollOptions: rollOptions,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            onClose: this._onAttackRollClose.bind(this, options)
        });
    }

    getAppropriateAttackModifiers(isWeapon) {
        const acceptedModifiers = [SFRPGEffectType.ALL_ATTACKS];
        if (["msak", "rsak"].includes(this.system.actionType)) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_ATTACKS);
        } else if (this.system.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_ATTACKS);
        } else if (this.system.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_ATTACKS);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_ATTACKS);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_ATTACKS);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_CATEGORY_ATTACKS);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            // Remove inactive constant and damage section mods. Keep all situational mods, regardless of status.
            if (!mod.enabled && mod.modifierType !== SFRPGModifierType.FORMULA) return false;

            if (mod.limitTo === "parent" && mod.item !== this) return false;
            if (mod.limitTo === "container") {
                const parentItem = getItemContainer(this.actor.items, mod.item);
                if (parentItem?.id !== this.id) return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_ATTACKS) {
                if (mod.valueAffected !== this.system?.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_ATTACKS) {
                if (!this.system?.properties?.[mod.valueAffected]) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_ATTACKS) {
                if (this.system?.weaponCategory !== mod.valueAffected) {
                    return false;
                }
            }

            return acceptedModifiers.includes(mod.effectType);
        });

        return modifiers;
    }

    /**
     * Handle updating item capacity when the attack dialog closes.
     *
     * @param {Html} html The html from the dailog
     * @param {Array} parts The parts of the roll
     * @param {Object} data The data
     *
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    _onAttackRollClose(options, roll, formula, finalFormula) {
        if (!roll) {
            return;
        }

        const itemData = foundry.utils.deepClone(this.system);
        if (itemData.hasOwnProperty("usage") && !options.disableDeductAmmo) {
            const usage = itemData.usage;

            if (usage.per && ["round", "shot"].includes(usage.per)) {
                this.consumeCapacity(usage.value);
            } else if (usage.per && ['minute'].includes(usage.per)) {
                if (game.combat) {
                    const round = game.combat.current.round || 0;
                    if (round % 10 === 1) {
                        this.consumeCapacity(usage.value);
                    }
                } else {
                    ui.notifications.info("You currently cannot deduct ammunition from weapons with a usage per minute outside of combat.");
                }
            }
        }

        Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});

        const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
        if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
            this.rollDamage({});
        }
    }

    /**
     * Place an attack roll for a starship using an item.
     * @param {Object} options Options to pass to the attack roll
     *
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    async _rollStarshipAttack(options = {}) {
        let parts = [];
        if (this.actor.system.crew.useNPCCrew) { // If NPC, use the gunnery skill bonus
            parts = ["@gunner.skills.gun.mod"];
        } else if (this.system.weaponType === "ecm") { // If the weapon is an ECM weapon and not an NPC, use Computers ranks + Int (NPC ECM weapons still use gunnery)
            parts = ["@scienceOfficer.skills.com.ranks", "@scienceOfficer.abilities.int.mod"];
        } else { // If not an ECM weapon and not an NPC, use BAB/Piloting + Dex
            parts = ["max(@gunner.attributes.baseAttackBonus.value, @gunner.skills.pil.ranks)", "@gunner.abilities.dex.mod"];
        }
        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        // If max capacity is 0, assume the item doesn't have limited fire property
        if (this.hasCapacity() && this.getCurrentCapacity() <= 0 && this.getMaxCapacity() > 0) {
            ui.notifications.warn(game.i18n.format("SFRPG.StarshipSheet.Weapons.NoCapacity"));
            return false;
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.system);
        rollContext.addContext("weapon", this, this.system);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner", "scienceOfficer"]);

        /** Create additional modifiers. */
        const additionalModifiers = [
            {bonus: {_id: "ComputerBonus", name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: `${this.actor.system?.attributes?.computer?.value ?? 0}`, enabled: false} },
            {bonus: {_id: "CaptainDemand", name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "4", enabled: false} },
            {bonus: {_id: "CaptainEncouragement", name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "2", enabled: false} },
            {bonus: {_id: "ScienceOfficerLockOn", name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "2", enabled: false} },
            {bonus: {_id: "SnapShot", name: game.i18n.format("SFRPG.Rolls.Starship.SnapShot"), modifier: "-2", enabled: false} },
            {bonus: {_id: "FireAtWill", name: game.i18n.format("SFRPG.Rolls.Starship.FireAtWill"), modifier: "-4", enabled: false} },
            {bonus: {_id: "Broadside", name: game.i18n.format("SFRPG.Rolls.Starship.Broadside"), modifier: "-2", enabled: false} }
        ];

        const attackBonus = parseInt(this.system.attackBonus);
        if (attackBonus) parts.push("@item.attackBonus");

        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");

        const rollOptions = {};

        if (this.system.actionTarget) {
            rollOptions.actionTarget = this.system.actionTarget;
            rollOptions.actionTargetSource = SFRPG.actionTargetsStarship;
        }

        const quadrant = this.system.mount.arc.charAt(0).toUpperCase() + this.system.mount.arc.slice(1);
        if (this.actor.system?.attributes?.systems[`weaponsArray${quadrant}`]?.mod < 0) {
            parts.push(`@ship.attributes.systems.weaponsArray${quadrant}.mod`);
        }
        if (this.actor.system?.attributes?.systems?.powerCore?.modOther < 0) {
            parts.push(`@ship.attributes.systems.powerCore.modOther`);
        }

        await DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
            chatMessage: options.chatMessage,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            rollOptions: rollOptions,
            actorContextKey: "gunner",
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity() && !options.disableDeductAmmo && this.getMaxCapacity() > 0) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    /**
     * Place an attack roll for a vehicle using an item.
     * @param {Object} options Options to pass to the attack roll
     */
    async _rollVehicleAttack(options = {}) {

        // TODO: Take vehicle's negative attack modifiers
        const parts = [];

        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.setMainContext("");

        await DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
            chatMessage: options.chatMessage,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity() && !options.disableDeductAmmo) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * Place a damage roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.damageRoll logic for the core implementation
     * @returns {Promise<bool>}  `true` if roll was performed, `false` if it was canceled
     */
    async rollDamage({ event } = {}, options = {}) {
        const itemData  = this.system;
        const actorData = this.actor.getRollData(); // this.actor.system;
        const isWeapon  = ["weapon", "shield"].includes(this.type);
        const isHealing = this.system.actionType === "heal";

        if (!this.hasDamage) {
            ui.notifications.error("You may not make a Damage Roll with this Item.");
            return;
        }

        if (this.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });
        if (this.type === "vehicleAttack") return this._rollVehicleDamage({ event: event});

        // Determine ability score modifier
        let abl = itemData.ability;
        if (!abl && (this.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        else if (!abl) abl = "str";

        // Define Roll parts
        /** @type {DamageParts[]} */
        const parts = foundry.utils.deepClone(itemData.damage.parts);
        for (const part of parts) {
            part.isDamageSection = true;
        }

        let modifiers = this.getAppropriateDamageModifiers(isWeapon);

        const stackModifiers = new StackModifiers();
        modifiers = await stackModifiers.processAsync(modifiers, null, {actor: this.actor});

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === "damageSection") {
                parts.push({
                    isDamageSection: true,
                    enabled: bonus.enabled,
                    name: bonus.name,
                    explanation: bonus.name,
                    formula: bonus.modifier,
                    types: bonus?.damage?.damageTypes,
                    group: bonus?.damage?.damageGroup
                });
                return;
            }
            else if (bonus.modifierType === "formula") {
                rolledMods.push(bonus);
                return;
            }

            // console.log(`Adding ${bonus.name} with ${bonus.modifier}`);
            const computedBonus = bonus.modifier;
            parts.push({ formula: computedBonus, explanation: bonus.name });
            return computedBonus;
        };

        Object.entries(modifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return 0;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    addModifier(bonus, parts);
                }
            } else {
                addModifier(mod[1], parts);
            }

            return 0;
        }, 0);

        // Define Roll Data
        const rollData = foundry.utils.mergeObject(foundry.utils.deepClone(actorData), {
            item: itemData,
            mod: actorData.abilities[abl].mod
        });

        let title = '';
        if (game.settings.get('sfrpg', 'useCustomChatCards')) {
            if (isHealing) {
                title = game.i18n.localize("SFRPG.Rolls.HealingRoll");
            } else {
                title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
            }
        } else {
            if (isHealing) {
                title = game.i18n.format("SFRPG.Rolls.HealingRollFull", {name: this.name});
            } else {
                title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});
            }
        }

        const rollContext = RollContext.createItemRollContext(this, this.actor, {itemData: itemData, ownerData: rollData});

        /** Create additional modifiers. */
        const additionalModifiers = [];

        if (itemData.properties?.archaic && isWeapon) {
            additionalModifiers.push({bonus: { name: game.i18n.format("SFRPG.WeaponPropertiesArchaic"), modifier: "-5", enabled: true, notes: game.i18n.format("SFRPG.WeaponPropertiesArchaicTooltip") } });
        }

        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        if (additionalModifiers.length > 0) {
            rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
            parts.push({ formula: "@additional.modifiers.bonus" });
        }

        // Call the roll helper utility
        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            criticalData: itemData.critical,
            rollContext: rollContext,
            title: title,
            flavor: await TextEditor.enrichHTML(options?.flavorOverride || itemData.chatFlavor, {
                async: true,
                rollData: this.actor.getRollData() ?? {},
                secrets: this.isOwner
            }) || null,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    getAppropriateDamageModifiers(isWeapon) {
        const acceptedModifiers = [SFRPGEffectType.ALL_DAMAGE];

        if (["msak", "rsak"].includes(this.system.actionType) || (this.type === "spell"  && this.system.actionType === "save")) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_DAMAGE);
        } else if (this.system.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_DAMAGE);
        } else if (this.system.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_DAMAGE);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_DAMAGE);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_DAMAGE);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_CATEGORY_DAMAGE);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            if (!acceptedModifiers.includes(mod.effectType)) {
                return false;
            }

            if (mod.limitTo === "parent" && mod.item !== this) return false;
            if (mod.limitTo === "container") {
                const parentItem = getItemContainer(this.actor.items, mod.item);
                if (parentItem?.id !== this.id) return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_DAMAGE) {
                if (mod.valueAffected !== this.system.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_DAMAGE) {
                if (!this.system.properties[mod.valueAffected]) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_DAMAGE) {
                if (this.system.weaponCategory !== mod.valueAffected) {
                    return false;
                }
            }
            return (mod.enabled || ["formula", "damageSection"].includes(mod.modifierType));
        });

        return modifiers;
    }

    async _rollVehicleDamage({ event } = {}, options = {}) {
        const itemData = this.system;

        if (!this.hasDamage) {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleAttackSheet.Errors.NoDamage"));
        }

        const parts = foundry.utils.deepClone(itemData.damage.parts);
        for (const part of parts) {
            part.isDamageSection = true;
        }

        let title = '';
        if (game.settings.get('sfrpg', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("vehicle", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.setMainContext("");

        return DiceSFRPG.damageRoll({
            event,
            parts,
            rollContext,
            title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                skipUI: true,
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    async _rollStarshipDamage({ event } = {}, options = {}) {
        const itemData = this.system;

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = foundry.utils.deepClone(itemData.damage.parts);
        for (const part of parts) {
            part.isDamageSection = true;
        }

        let title = '';
        if (game.settings.get('sfrpg', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            criticalData: {preventDoubling: true},
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * A helper method to call the useSpell method on the item's actor
     */
    async useSpell({ configureDialog = true } = {}) {
        if (this.type !== "spell") throw new Error("Item#UseSpell must be used on a spell item!");
        if (!this.actor) throw new Error("The item must be on an actor to cast it!");
        return this.actor.useSpell(this, { configureDialog });
    }

    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.d20Roll logic for the core implementation
     */
    async rollFormula(options = {}) {
        const itemData = this.system;
        const actorData = this.actor.getRollData();
        if (!itemData.formula) {
            throw new Error("This Item does not have a formula to roll!");
        }

        // Define Roll Data
        const rollContext = RollContext.createItemRollContext(this, this.actor, {itemData: itemData});

        const title = game.i18n.localize(`SFRPG.Items.Action.OtherFormula`);
        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            rollFormula: itemData.formula,
            title: title,
            mainDie: null
        });

        if (!rollResult) return;

        const preparedRollExplanation = DiceSFRPG.formatFormula(rollResult.formula.formula);
        const content = await rollResult.roll.render({ breakdown: preparedRollExplanation });

        ChatMessage.create({
            flavor: `${title}${(itemData.chatFlavor ? " - " + itemData.chatFlavor : "")}`,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            content: content,
            rolls: [rollResult.roll],
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            sound: CONFIG.sounds.dice
        });
    }

    /* -------------------------------------------- */

    /**
     * Use a consumable item
     */
    async rollConsumable(options = {}) {
        const itemData = this.system;
        const overrideUsage = !!options?.event?.shiftKey;

        if (itemData.uses.value === 0 && itemData.quantity === 0 && !overrideUsage) {
            ui.notifications.error(game.i18n.format("SFRPG.Items.Consumable.ErrorNoUses", {name: this.name}));
            return;
        }

        if (itemData.actionType && itemData.actionType !== "save") {
            options.flavorOverride = game.i18n.format("SFRPG.Items.Consumable.UseChatMessage", {consumableName: this.name});

            if (!await this.rollDamage({}, options)) {
                // Roll was cancelled, don't consume.
                return;
            }
        } else {
            const htmlOptions = { secrets: this.actor?.isOwner || true, rollData: this };
            htmlOptions.rollData.owner = this.actor?.system;

            // Basic template rendering data
            const token = this.actor.token;
            const templateData = {
                actor: this.actor,
                tokenId: token ? `${token.parent.id}.${token.id}` : null,
                item: this,
                data: await this.getChatData(htmlOptions),
                labels: this.labels,
                hasAttack: this.hasAttack,
                hasDamage: this.hasDamage,
                hasSave: this.hasSave,
                hasArea: this.hasArea,
                hasOtherFormula: this.hasOtherFormula
            };

            const template = `systems/sfrpg/templates/chat/consumed-item-card.hbs`;
            const html = await renderTemplate(template, templateData);

            const flavor = game.i18n.format("SFRPG.Items.Consumable.UseChatMessage", {consumableName: this.name});

            // Basic chat message data
            const chatData = {
                author: game.user.id,
                flavor: flavor,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER,
                content: html,
                flags: { level: this.system.level },
                speaker: token ? ChatMessage.getSpeaker({token: token}) : ChatMessage.getSpeaker({actor: this.actor})
            };

            const rollMode = game.settings.get("core", "rollMode");
            ChatMessage.applyRollMode(chatData, rollMode);

            // Create the chat message
            ChatMessage.create(chatData, { displaySheet: false });
        }

        // Deduct consumed charges from the item
        if (itemData.uses.autoUse && !overrideUsage) {
            let quantity = itemData.quantity;
            let remainingUses = Math.max(this.getRemainingUses() - 1, 0);

            if (remainingUses < 1) {
                // Deduct an item quantity
                quantity = Math.max(quantity - 1, 0);
                if (quantity < 1 && itemData.uses.autoDestroy) {
                    // Destroy the item
                    this.actor.deleteEmbeddedDocuments("Item", [this.id]);
                } else {
                    if (quantity > 0) {
                        // Reset the remaining charges
                        remainingUses = this.getMaxUses();
                    }
                    this.update({
                        'system.quantity': quantity,
                        'system.uses.value': remainingUses
                    });
                }
            } else {
                // Deduct the remaining charges
                this.update({'system.uses.value': remainingUses});
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform an ability recharge test for an item which uses the d6 recharge mechanic
     * @prarm {Object} options
     */
    async rollRecharge(options = {}) {
        const data = this.system;
        if (!data.recharge.value) return;

        // Roll the check
        const rollObject = Roll.create("1d6");
        const roll = await rollObject.evaluate();
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const rollMode = game.settings.get("core", "rollMode");
        const chatData = {
            author: game.user.id,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
            whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessage.getWhisperRecipients("GM") : null,
            blind: rollMode === "blindroll",
            rolls: [roll],
            speaker: ChatMessage.getSpeaker({
                actor: this.actor,
                alias: this.actor.name
            })
        };

        // Update the Item data
        const promises = [ChatMessage.create(chatData)];
        if (success) promises.push(this.update({ "system.recharge.charged": true }));
        return Promise.all(promises);
    }

    async placeAbilityTemplate(event) {
        const itemData = this.system;

        const type = {
            "sphere": "circle",
            "cone": "cone",
            "cube": "rect",
            "cylinder": "circle",
            "line": "ray"
        }[itemData?.area?.shape] || null;

        if (!type) return;

        const template = AbilityTemplate.fromData({
            type: type || "circle",
            distance: this.system?.area?.total || this.system?.area?.value || 0
        });

        if (!template) return;

        const placed = await template.drawPreview();
        if (placed) template.place(); // If placement is confirmed

    }

    /* -------------------------------------------- */

    static chatListeners(html) {
        html.on('click', '.chat-card .card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.chat-card .item-name', this._onChatCardToggleContent.bind(this));
    }

    /* -------------------------------------------- */

    static async _onChatCardAction(event) {
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        // Validate permission to proceed with the roll
        const isTargetted = ["save", "skill"].includes(action);
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const chatCardActor = this._getChatCardActor(card);
        if (!chatCardActor) {
            ui.notifications.error("SFRPG.ChatCard.ItemAction.NoActor");
            return;
        }

        // Get the Item
        let item = chatCardActor.items.get(card.dataset.itemId);

        // Adjust item to level, if required
        if (Object.keys(message.flags?.sfrpg ?? {}).length !== 0 && message.flags?.sfrpg?.level !== item.system.level) {
            const newItemData = item.toObject();
            newItemData.system.level = message.flags.sfrpg.level;

            item = new ItemSFRPG(newItemData, {parent: item.parent});

            // Run automation to ensure save DCs are correct.
            item.prepareData();
            const processContext = await item.processData();
            if (processContext.fact.promises) {
                await Promise.all(processContext.fact.promises);
            }
        }

        // Get the target
        const targetActor = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });
        else if (action === "template") await item.placeAbilityTemplate({ event });

        // Skill Check
        else if (action === "skill" && targetActor) await targetActor.rollSkill(button.dataset.type, { event });

        // Saving Throw
        else if (action === "save" && targetActor) await targetActor.rollSave(button.dataset.type, { event });

        // Consumable usage
        else if (action === "consume") await item.rollConsumable({ event });
    }

    /**
     * Handle toggling the visibility of chat card content when the name is clicked.
     * @param {Event} event The originating click event
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest('.chat-card');
        const content = card.querySelector('.card-content');
        // content.style.display = content.style.display === 'none' ? 'block' : 'none';
        $(content).slideToggle();
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    static _getChatCardActor(card) {

        const actorId = card.dataset.actorId;

        // Case 1 - a synthetic actor from a Token, legacy reasons the token Id can be a compound key of sceneId and tokenId
        let tokenId = card.dataset.tokenId;
        let sceneId = card.dataset.sceneId;
        if (!sceneId && tokenId?.includes('.')) {
            [sceneId, tokenId] = tokenId.split(".");
        }

        let chatCardActor = null;
        if (tokenId && sceneId) {
            const scene = game.scenes.get(sceneId);
            if (scene) {
                const tokenData = scene.getEmbeddedDocument("Token", tokenId);
                if (tokenData) {
                    const token = new Token(tokenData);
                    chatCardActor = token.actor;
                }
            }
        }

        // Case 2 - use Actor ID directory
        if (!chatCardActor) {
            chatCardActor = game.actors.get(actorId);
        }

        return chatCardActor;
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    static _getChatCardTarget(card) {
        const character = game.user.character;
        const controlled = canvas.tokens?.controlled;
        if (controlled.length === 0) return character || null;
        if (controlled.length === 1) return controlled[0].actor;
        else throw new Error(`You must designate a specific Token as the roll target`);
    }

    /**
     * Add a modifier to this actor.
     *
     * @param {Object}        data               The data needed to create the modifier
     * @param {String}        data.name          The name of this modifier. Used to identify the modfier.
     * @param {Number|String} data.modifier      The modifier value.
     * @param {String}        data.type          The modifiers type. Used to determine stacking.
     * @param {String}        data.modifierType  Used to determine if this modifier is a constant value (+2) or a Roll formula (1d4).
     * @param {String}        data.effectType    The category of things that might be effected by this modifier.
     * @param {String}        data.subtab        What subtab should this modifier show under on the character sheet.
     * @param {String}        data.valueAffected The specific value being modified.
     * @param {Boolean}       data.enabled       Is this modifier activated or not.
     * @param {String}        data.source        Where did this modifier come from? An item, ability or something else?
     * @param {String}        data.notes         Any notes or comments about the modifier.
     * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
     * @param {String|null}   data.id            Override the randomly generated id with this.
     */
    async addModifier({
        name = "",
        modifier = 0,
        type = SFRPGModifierTypes.UNTYPED,
        modifierType = SFRPGModifierType.CONSTANT,
        effectType = SFRPGEffectType.SKILL,
        subtab = "misc",
        valueAffected = "",
        enabled = this.system?.enabled ?? true, // New modifiers on effects should match enabled state.
        source = "",
        notes = "",
        condition = "",
        id = null,
        limitTo = "",
        damage = null
    } = {}) {
        const data = this._ensureHasModifiers(foundry.utils.deepClone(this.system));
        const modifiers = data.modifiers;

        modifiers.push(new SFRPGModifier({
            name,
            modifier,
            type,
            modifierType,
            effectType,
            valueAffected,
            enabled,
            source,
            notes,
            subtab,
            condition,
            id,
            limitTo,
            damage
        }));

        console.log("Adding a modifier to the item");

        await this.update({["system.modifiers"]: modifiers});
    }

    static async _onScalingCantripsSettingChanges(setting) {
        const d3scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const d6scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0))";
        const npcd3scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d((ternary(gte(@details.cr,7),4,3)))+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";
        const npcd6scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

        let count = 0;
        let actorCount = 0;

        const promises = [];

        for (const actor of game.actors.contents) {
            const isNPC = ['npc', 'npc2'].includes(actor.type);

            let updates = [];
            const params = actor.items.filter(i => i.system.scaling?.d3 || i.system.scaling?.d6);
            if (params.length > 0) {
                updates = params.map( (currentValue) => {
                    return {
                        _id: currentValue.id,
                        "system.damage.parts": currentValue.system.damage.parts,
                        scaling: currentValue.system.scaling
                    };
                });

                for (const currentValue of updates) {
                    if (currentValue.scaling.d3) {
                        const parts = currentValue['system.damage.parts'];
                        for (const i of parts) {
                            if (setting) {
                                if (isNPC) {
                                    i.formula = npcd3scaling;
                                } else {
                                    i.formula = d3scaling;
                                }
                            } else {
                                i.formula = "1d3";
                            }
                        }
                    } else if (currentValue.scaling.d6) {
                        const parts = currentValue['system.damage.parts'];
                        for (const i of parts) {
                            if (setting) {
                                if (isNPC) {
                                    i.formula = npcd6scaling;
                                } else {
                                    i.formula = d6scaling;
                                }
                            } else {
                                i.formula = "1d6";
                            }
                        }
                    }

                    delete currentValue.scaling;
                }

                promises.push(actor.updateEmbeddedDocuments("Item", updates));
                count += params.length;
                actorCount++;
            }
        }

        await Promise.allSettled(promises);
        const message = `Starfinder | Updated ${count} spells to use ${(setting) ? "scaling" : "default"} formulas on ${actorCount} actors.`;
        ui.notifications.info(message);
    }

    static _onScalingCantripDrop(item, targetActor) {
        const isNPC = ['npc', 'npc2'].includes(targetActor.actor.type);
        const { parts } = item.system.damage;

        if (item.system.scaling?.d3) {
            const d3scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
            const npcd3scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d((ternary(gte(@details.cr,7),4,3)))+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

            parts.forEach(i => i.formula = (isNPC) ? npcd3scaling : d3scaling);

            console.log(`Starfinder | Updated ${item.name} to use the ${ (isNPC) ? 'NPC ' : ""}d3 scaling formula.`);

        } else if (item.system.scaling?.d6) {
            const d6scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0))";
            const npcd6scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

            parts.forEach(i => i.formula = (isNPC) ? npcd6scaling : d6scaling);

            console.log(`Starfinder | Updated ${item.name} to use the ${ (isNPC) ? "NPC " : ""}d6 scaling formula.`);
        }
    }

    /**
     * Turn Events
     * The following functions are run when appropriate by the GM.
     */

    _onTurnStart() {
        if (this.type !== "effect" || !this.system.enabled) return;

        for (const turnEvent of this.system.turnEvents) {
            if (turnEvent.trigger !== "onTurnStart") continue;

            this._handleTurnEvent(turnEvent);

        }

    }

    _onTurnEnd() {
        if (this.type !== "effect" || !this.system.enabled) return;

        for (const turnEvent of this.system.turnEvents) {
            if (turnEvent.trigger !== "onTurnEnd") continue;

            this._handleTurnEvent(turnEvent);
        }

    }

    _handleTurnEvent(turnEvent) {
        switch (turnEvent.type) {
            case "note":
                this._handleEffectNoteEvent(turnEvent);
                break;
            case "roll":
                this._handleEffectRollEvent(turnEvent);
                break;
        }
    }

    _handleEffectNoteEvent(turnEvent) {
        ChatMessage.create({
            content: turnEvent.content,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        });
    }

    async _handleEffectRollEvent(turnEvent) {
        if (!turnEvent.formula) return;

        const parts = [{
            isDamageSection: true,
            enabled: true,
            formula: turnEvent.formula,
            types: turnEvent.damageTypes,
            group: null
        }];

        const rollContext = RollContext.createItemRollContext(this, this.actor);

        return DiceSFRPG.damageRoll({
            parts,
            rollContext,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                skipUI: true
            },
            title: turnEvent.name || this.name
        });
    }

    /**
     * Execute a macro with the context of this item
     * @param {Macro} macro The macro to execute
     * @param {Record<string, *>} scope Any additional arguments to pass to macro execution
     * @returns {Promise<*>} The return value of the macro
     */
    async executeMacroWithContext(macro, scope = {}) {
        if (!(macro instanceof Macro)) {
            ui.notifications.error("A macro was not provided!");
            return;
        }

        return macro.execute({
            speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.actor.token }),
            token: this.actor.token || null,
            actor: this.actor || null,
            item: this,
            ...scope
        });
    }
}
