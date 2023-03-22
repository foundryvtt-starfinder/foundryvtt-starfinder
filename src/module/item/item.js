import SFRPGModifierApplication from "../apps/modifier-app.js";
import { SFRPG } from "../config.js";
import { DiceSFRPG } from "../dice.js";
import SFRPGModifier from "../modifiers/modifier.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../modifiers/types.js";
import RollContext from "../rolls/rollcontext.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";
import { Mix } from "../utils/custom-mixer.js";
import { ItemActivationMixin } from "./mixins/item-activation.js";
import { ItemCapacityMixin } from "./mixins/item-capacity.js";

export class ItemSFRPG extends Mix(Item).with(ItemActivationMixin, ItemCapacityMixin) {

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

    /* -------------------------------------------- */
    /*	Data Preparation														*/
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
            if (act && ["mwak", "rwak", "msak", "rsak"].includes(act.type)) {
                labels.featType = data?.damage?.parts?.length
                    ? game.i18n.localize("SFRPG.Attack")
                    : game.i18n.localize("SFRPG.Items.Actions.TitleAction");
            } else {
                labels.featType = game.i18n.localize("SFRPG.Passive");
            }
        }

        // Equipment Items
        else if (itemData.type === "equipment") {
            labels.eac = data.armor.eac ? `${data.armor.eac} ${game.i18n.localize("SFRPG.EnergyArmorClassShort")}` : "";
            labels.kac = data.armor.kac ? `${data.armor.kac} ${game.i18n.localize("SFRPG.KineticArmorClassShort")}` : "";
        }

        // Activated Items
        if (data.hasOwnProperty("activation")) {

            // Ability Activation Label
            let act = data.activation || {};
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

            let tgt = data.target || {};
            if (tgt.value && tgt.value === "") tgt.value = null;

            labels.target = [tgt.value].filterJoin(" ");

            let area = data.area || {};
            if (["none", "touch", "personal"].includes(area.units)) area.value = null;
            if (typeof area.value === 'number' && area.value === 0) area.value = null;
            if (["none"].includes(area.units)) area.units = null;

            labels.area = [area.value, C.distanceUnits[area.units] || null, C.spellAreaShapes[area.shape], C.spellAreaEffects[area.effect]].filterJoin(" ");

            // Range Label
            let rng = data.range || {};
            if (["none", "touch", "personal"].includes(rng.units) || (rng.value === 0)) {
                rng.value = null;
            }
            if (["none"].includes(rng.units)) rng.units = null;
            labels.range = [rng.value, C.distanceUnits[rng.units] || null].filterJoin(" ");

            // Duration Label
            let dur = data.duration || {};
            labels.duration = [dur.value].filterJoin(" ");
        }

        // Item Actions
        if (data.hasOwnProperty("actionType")) {
            // Damage
            let dam = data.damage || {};
            if (dam.parts) labels.damage = dam.parts.map(d => d[0]).join(" + ")
                .replace(/\+ -/g, "- ");
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
        if (!hasProperty(data, "modifiers")) {
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
        let updates = {};

        if (this.type === "class" && !this.system?.slug) {
            updates["system.slug"] = this.name.slugify({replacement: "_", strict: true});
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
            hasOtherFormula: this.hasOtherFormula
        };

        if (this.type === "spell") {
            let descriptionText = duplicate(templateData.system.description.short || templateData.system.description.value);
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
        const rollMode = game.settings.get("core", "rollMode");

        // Basic chat message data
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            flags: {
                level: this.system.level,
                core: {
                    canPopout: true
                }
            },
            rollMode: rollMode,
            speaker: token ? ChatMessage.getSpeaker({token: token}) : ChatMessage.getSpeaker({actor: this.actor})
        };

        // Toggle default roll mode
        if (["gmroll", "blindroll"].includes(rollMode)) {
            chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        }
        if (rollMode === "blindroll") {
            chatData["blind"] = true;
        }
        if (rollMode === "selfroll") {
            chatData["whisper"] = ChatMessage.getWhisperRecipients(game.user.name);
        }

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
        const data = duplicate(this.system);
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
            if ("target"     in data.activation) props.push({name: labels.target, tooltip: null });
            if ("area"       in data.activation) props.push({name: labels.area, tooltip: null });
            if ("activation" in data.activation) props.push({name: labels.activation, tooltip: null });
            if ("range"      in data.activation) props.push({name: labels.range, tooltip: null });
            if ("duration"   in data.activation) props.push({name: labels.duration, tooltip: null });
        }

        if (data.hasOwnProperty("capacity")) {
            props.push({
                name: labels.capacity,
                tooltip: null
            });
        }

        if (this.type === "container") {
            if (this.actor) {
                const wealthString = new Intl.NumberFormat(game.i18n.lang).format(Math.floor(this.system.itemWealth.contentWealth));
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
            {name: game.i18n.localize("ITEM.TypeTechnological"), tooltip: null},
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
            {name: game.i18n.localize("ITEM.TypeHybrid"), tooltip: null},
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
            {name: game.i18n.localize("ITEM.TypeMagic"), tooltip: null},
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
        let armorType = "";

        if (data.armorType === 'any') {
            armorType = "Any";
        } else {
            armorType = CONFIG.SFRPG.armorTypes[data.armorType];
        }

        props.push(
            {name: game.i18n.localize("ITEM.TypeUpgrade"), tooltip: null},
            data.slots ? {name: `${game.i18n.localize("SFRPG.Items.Upgrade.Slots")} ${data.slots}`, tooltip: null} : null,
            {name: `${game.i18n.localize("SFRPG.Items.Upgrade.AllowedArmorType")}: ${armorType}`, tooltip: null}
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            {name:game.i18n.localize("ITEM.TypeAugmentation"), tooltip: null},
            data.type ? {name: CONFIG.SFRPG.augmentationTypes[data.type], tooltip: null} : null,
            data.system ? {name: CONFIG.SFRPG.augmentationSytems[data.system], tooltip: null} : null
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
            {name: game.i18n.localize("ITEM.TypeFusion"), tooltip: null},
            data.level ? {name: `${game.i18n.localize("SFRPG.LevelLabelText")} ${data.level}`, tooltip: null} : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("ITEM.TypeStarshipweapon"), tooltip: null},
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
            {name: game.i18n.localize("SFRPG.Items.Shield.Shield"), tooltip: null},
            {name: game.i18n.format("SFRPG.Items.Shield.AcMaxDex", { maxDex: (data.dex || 0).signedString() }),  tooltip: null},
            {name: game.i18n.format("SFRPG.Items.Shield.ArmorCheck", { acp: (data.acp || 0).signedString() }),  tooltip: null},
            {name: game.i18n.format("SFRPG.Items.Shield.Bonuses", { wielded: wieldedBonus.signedString(), aligned: alignedBonus.signedString() }),  tooltip: null},
            data.proficient ? {name: game.i18n.localize("SFRPG.Items.Proficient"), tooltip: null} : {name: game.i18n.localize("SFRPG.Items.NotProficient"), tooltip: null}
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
            {name: game.i18n.localize("ITEM.TypeTheme"), tooltip: null},
            data.abilityMod.ability ? {name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null} : null,
            data.skill ? {name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null} : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("ITEM.TypeRace"), tooltip: null},
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
            let sensesDeliminated = data.senses.senses.split(",");
            for (let index = 0; index < sensesDeliminated.length; index++) {
                let sense = sensesDeliminated[index];
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
            throw new Error("You may not place an Attack Roll with this Item.");
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
            const procifiencyKey = SFRPG.weaponTypeProficiency[this.system.weaponType];
            const proficient = itemData.proficient || this.actor?.system?.traits?.weaponProf?.value?.includes(procifiencyKey);
            if (!proficient) {
                parts.push(`-4[${game.i18n.localize("SFRPG.Items.NotProficient")}]`);
            }
        }

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
            if (mod.effectType === SFRPGEffectType.WEAPON_ATTACKS) {
                if (mod.valueAffected !== this.system.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_ATTACKS) {
                if (!this.system.properties[mod.valueAffected]) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_ATTACKS) {
                if (this.system.weaponCategory !== mod.valueAffected) {
                    return false;
                }
            }
            return (mod.enabled || mod.modifierType === "formula") && acceptedModifiers.includes(mod.effectType);
        });

        let stackModifiers = new StackModifiers();
        modifiers = stackModifiers.process(modifiers, null);

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === "formula") {
                rolledMods.push(bonus);
                return;
            }
            let computedBonus = bonus.modifier;
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
        const rollData = duplicate(actorData);
        // Add hasSave to roll
        itemData.hasSave = this.hasSave;
        itemData.hasSkill = this.hasSkill;
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

        /** Create additional modifiers. */
        const additionalModifiers = duplicate(SFRPG.globalAttackRollModifiers);

        /** Apply bonus rolled mods from relevant attack roll formula modifiers. */
        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");

        // Call the roll helper utility
        return DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
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

        const itemData = duplicate(this.system);
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

        if (this.hasCapacity()) {
            if (this.getCurrentCapacity() <= 0) {
                ui.notifications.warn(game.i18n.format("SFRPG.StarshipSheet.Weapons.NoCapacity"));
                return false;
            }
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
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: "@ship.attributes.computer.value", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "+4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "+2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "+2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.SnapShot"), modifier: "-2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.FireAtWill"), modifier: "-4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.Broadside"), modifier: "-2", enabled: false} }
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

        return await DiceSFRPG.d20Roll({
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

        return await DiceSFRPG.d20Roll({
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
     */
    async rollDamage({ event } = {}, options = {}) {
        const itemData  = this.system;
        const actorData = this.actor.getRollData(); // this.actor.system;
        const isWeapon  = ["weapon", "shield"].includes(this.type);
        const isHealing = this.system.actionType === "heal";

        if (!this.hasDamage) {
            throw new Error("You may not make a Damage Roll with this Item.");
        }

        if (this.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });
        if (this.type === "vehicleAttack") return this._rollVehicleDamage({ event: event});

        // Determine ability score modifier
        let abl = itemData.ability;
        if (!abl && (this.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        else if (!abl) abl = "str";

        // Define Roll parts
        /** @type {DamageParts[]} */
        const parts = duplicate(itemData.damage.parts.map(part => part));
        for (const part of parts) {
            part.isDamageSection = true;
        }

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
            return (mod.enabled || mod.modifierType === "formula");
        });

        let stackModifiers = new StackModifiers();
        modifiers = stackModifiers.process(modifiers, null);

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === "formula") {
                rolledMods.push(bonus);
                return;
            }

            // console.log(`Adding ${bonus.name} with ${bonus.modifier}`);
            let computedBonus = bonus.modifier;
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
        const rollData = mergeObject(duplicate(actorData), {
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

    async _rollVehicleDamage({ event } = {}, options = {}) {
        const itemData = this.system;

        if (!this.hasDamage) {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleAttackSheet.Errors.NoDamage"));
        }

        const parts = itemData.damage.parts.map(part => part);
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
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
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

        const parts = duplicate(itemData.damage.parts.map(part => part));
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
     * Adjust a cantrip damage formula to scale it for higher level characters and monsters
     * @private
     */
    _scaleCantripDamage(parts, level, scale) {
        const add = Math.floor((level + 1) / 6);
        if (add === 0) return;
        if (scale && (scale !== parts[0])) {
            parts[0] = parts[0] + " + " + scale.replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${add}d${d}`);
        } else {
            parts[0] = parts[0].replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${parseInt(nd) + add}d${d}`);
        }
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
            rollMode: game.settings.get("core", "rollMode"),
            roll: rollResult.roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
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

            const result = await this.rollDamage({}, options);
            if (!result.callbackResult) {
                // Roll was cancelled, don't consume.
                return;
            }
        } else {
            let htmlOptions = { secrets: this.actor?.isOwner || true, rollData: this };
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
                hasOtherFormula: this.hasOtherFormula
            };

            const template = `systems/sfrpg/templates/chat/consumed-item-card.hbs`;
            const html = await renderTemplate(template, templateData);

            const flavor = game.i18n.format("SFRPG.Items.Consumable.UseChatMessage", {consumableName: this.name});

            // Basic chat message data
            const chatData = {
                user: game.user.id,
                flavor: flavor,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                content: html,
                flags: { level: this.system.level },
                speaker: token ? ChatMessage.getSpeaker({token: token}) : ChatMessage.getSpeaker({actor: this.actor})
            };

            // Toggle default roll mode
            const rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) {
                chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
            }
            if (rollMode === "blindroll") {
                chatData["blind"] = true;
            }

            // Create the chat message
            ChatMessage.create(chatData, { displaySheet: false });
        }

        // Deduct consumed charges from the item
        if (itemData.uses.autoUse && !overrideUsage) {
            let quantity = itemData.quantity;
            const remainingUses = this.getRemainingUses();

            // Deduct an item quantity
            if (remainingUses <= 1 && quantity >= 1) {
                quantity -= 1;
                this.update({
                    'system.quantity': Math.max(quantity, 0),
                    'system.uses.value': (quantity === 0) ? 0 : this.getMaxUses()
                });
            }

            // Optionally destroy the item
            else if (remainingUses <= 1 && quantity === 0 && itemData.uses.autoDestroy) {
                this.actor.deleteEmbeddedDocuments("Item", [this.id]);
            }

            // Deduct the remaining charges
            else {
                this.update({'system.uses.value': Math.max(remainingUses - 1, 0) });
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
        const roll = await rollObject.evaluate({async: true});
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const rollMode = game.settings.get("core", "rollMode");
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
            whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessage.getWhisperRecipients("GM") : null,
            blind: rollMode === "blindroll",
            roll: roll,
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

    /* -------------------------------------------- */

    static chatListeners(html) {
        html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
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
        if (!chatCardActor) return;

        button.disabled = true;

        // Get the Item
        let item = chatCardActor.items.get(card.dataset.itemId);

        // Adjust item to level, if required
        if (typeof (message.flags.level) !== 'undefined' && message.flags.level !== item.system.level) {
            const newItemData = duplicate(item);
            newItemData.system.level = message.flags.level;

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

        // Skill Check
        else if (action === "skill" && targetActor) await targetActor.rollSkill(button.dataset.type, { event });

        // Saving Throw
        else if (action === "save" && targetActor) await targetActor.rollSave(button.dataset.type, { event });

        // Consumable usage
        else if (action === "consume") await item.rollConsumable({ event });

        // Re-enable the button
        button.disabled = false;
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
        enabled = true,
        source = "",
        notes = "",
        condition = "",
        id = null
    } = {}) {
        const data = this._ensureHasModifiers(duplicate(this.system));
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
            id
        }));

        console.log("Adding a modifier to the item");

        await this.update({["system.modifiers"]: modifiers});
    }

    /**
     * Delete a modifier for this Actor.
     *
     * @param {String} id The id for the modifier to delete
     */
    async deleteModifier(id) {
        const modifiers = this.system.modifiers.filter(mod => mod._id !== id);

        await this.update({"system.modifiers": modifiers});
    }

    /**
     * Edit a modifier for an Actor.
     *
     * @param {String} id The id for the modifier to edit
     */
    editModifier(id) {
        const modifiers = duplicate(this.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === id);

        new SFRPGModifierApplication(modifier, this, {}, this.actor).render(true);
    }

    static async _onScalingCantripsSettingChanges() {
        const d3scaling = "lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9)d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const d6scaling = "lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9)d6+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const npcd3scaling = "lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9)d(ternary(gte(@details.cr,7),4,3))+ternary(gte(@details.cr,3),floor(@details.cr/2),0)";
        const npcd6scaling = "lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9)d6+ternary(gte(@details.cr,3),floor(@details.cr/2),0)";

        const setting = game.settings.get("sfrpg", "scalingCantrips");
        let count = 0;
        let actorCount = 0;

        for (let actor of game.actors.contents) {
            const isNPC = ['npc', 'npc2'].includes(actor.type);

            let updates = [];
            let params = actor.items.filter(i => i.system.scaling?.d3 || i.system.scaling?.d6);
            if (params.length > 0) {
                updates = params.map( (currentValue) => {
                    return {
                        _id: currentValue.id,
                        "system.damage.parts": currentValue.system.damage.parts,
                        scaling: currentValue.system.scaling
                    };
                });

                for (let currentValue of updates) {
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

                await actor.updateEmbeddedDocuments("Item", updates);
                count += params.length;
                actorCount++;
            }
        }
        const message = `Starfinder | Updated ${count} spells to use ${(setting) ? "scaling" : "default"} formulas on ${actorCount} actors.`;
        ui.notifications.info(message);
    }

    static async _onScalingCantripDrop(addedItem, targetActor) {
        const d3scaling = "lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9)d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const d6scaling = "lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9)d6+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const npcd3scaling = "lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9)d(ternary(gte(@details.cr,7),4,3))+ternary(gte(@details.cr,3),floor(@details.cr/2),0)";
        const npcd6scaling = "lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9)d6+ternary(gte(@details.cr,3),floor(@details.cr/2),0)";

        const isNPC = ['npc', 'npc2'].includes(targetActor.actor.type);

        if (addedItem.system.scaling?.d3) {

            const updates = duplicate(addedItem.system.damage.parts);
            updates.map(i => {
                i.formula = (isNPC) ? npcd3scaling : d3scaling;
                return i;
            } );

            await addedItem.update({"system.damage.parts": updates});
            console.log(`Starfinder | Updated ${addedItem.name} to use the ${ (isNPC) ? 'NPC ' : ""}d3 scaling formula.`);

        } else if (addedItem.system.scaling?.d6) {

            const updates = duplicate(addedItem.system.damage.parts);
            updates.map(i => {
                i.formula = (isNPC) ? npcd6scaling : d6scaling;
                return i;
            } );

            await addedItem.update({"system.damage.parts": updates});
            console.log(`Starfinder | Updated ${addedItem.name} to use the ${ (isNPC) ? "NPC " : ""}d6 scaling formula.`);
        }
    }
}

