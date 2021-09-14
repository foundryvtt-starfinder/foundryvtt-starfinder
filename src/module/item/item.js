import { Mix } from "../utils/custom-mixer.js";
import { ItemActivationMixin } from "./mixins/item-activation.js";
import { ItemCapacityMixin } from "./mixins/item-capacity.js";

import { DiceSFRPG } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";
import { SFRPG } from "../config.js";
import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../modifiers/types.js";
import SFRPGModifier from "../modifiers/modifier.js";
import SFRPGModifierApplication from "../apps/modifier-app.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";

export class ItemSFRPG extends Mix(Item).with(ItemActivationMixin, ItemCapacityMixin) {

    /* -------------------------------------------- */
    /*  Item Properties                             */
    /* -------------------------------------------- */

    /**
     * Does the Item implement an attack roll as part of its usage
     * @type {boolean}
     */
    get hasAttack() {
        if (this.data.type === "starshipWeapon") return true;
        return ["mwak", "rwak", "msak", "rsak"].includes(this.data.data.actionType);
    }

    get hasOtherFormula() {
        return ("formula" in this.data.data) && this.data.data.formula?.trim().length > 0;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a damage roll as part of its usage
     * @type {boolean}
     */
    get hasDamage() {
        return !!(this.data.data.damage && this.data.data.damage.parts.length);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSave() {
        const saveData = this.data?.data?.save;
        if (!saveData) {
            return false;
        }

        const hasType = !!saveData.type;
        return hasType;
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
        const itemData = this.data;
        const actorData = this.parent ? this.parent.data : {};
        const data = itemData.data;

        // Spell Level,  School, and Components
        if (itemData.type === "spell") {
            labels.level = C.spellLevels[data.level];
            labels.school = C.spellSchools[data.school];
        }

        // Feat Items
        else if (itemData.type === "feat") {
            const act = data.activation;
            if (act && act.type) labels.featType = data.damage.length ? "Attack" : "Action";
            else labels.featType = "Passive";
        }

        // Equipment Items
        else if (itemData.type === "equipment") {
            labels.eac = data.armor.eac ? `${data.armor.eac} EAC` : "";
            labels.kac = data.armor.kac ? `${data.armor.kac} KAC` : "";
        }
        
        // Activated Items
        if (data.hasOwnProperty("activation")) {

            // Ability Activation Label
            let act = data.activation || {};
            if (act) labels.activation = [
                act.cost,
                act.type === "none" ? null : C.abilityActivationTypes[act.type]
            ].filterJoin(" ");

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
            if (dam.parts) labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
        }

        // Assign labels and return the Item
        this.labels = labels;
    }

    processData() {
        game.sfrpg.engine.process("process-items", {
            item: this,
            itemData: this.data,
            owner: {
                actor: this.actor,
                actorData: this.actor?.data?.data,
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

    /* -------------------------------------------- */

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * @return {Promise}
     */
    async roll() {
        let htmlOptions = { secrets: this.actor?.isOwner || true, rollData: this.data };
        htmlOptions.rollData.owner = this.actor?.data?.data;

        // Basic template rendering data
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.parent.id}.${token.id}` : null,
            item: this.data,
            data: this.getChatData(htmlOptions),
            labels: this.labels,
            hasAttack: this.hasAttack,
            hasDamage: this.hasDamage,
            hasSave: this.hasSave,
            hasOtherFormula: this.hasOtherFormula
        };

        if (this.type === "spell") {
            let descriptionText = duplicate(templateData.data.description.short || templateData.data.description.value);
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
                    const shouldShowEx = level === this.data.data.level;
                    const startTagEx = `[${tag}_only]`;
                    const endTagEx = `[/${tag}_only]`;

                    const shouldShowInc = level <= this.data.data.level;
                    const startTagInc = `[${tag}]`;
                    const endTagInc = `[/${tag}]`;

                    if (shouldShowEx) {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        while (tagStartIndex != -1) {
                            descriptionText = descriptionText.replace(startTagEx, "");
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagEndIndex != -1) {
                            descriptionText = descriptionText.replace(endTagEx, "");
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagStartIndex != -1 && tagEndIndex != -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagEx.length);
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    }

                    if (shouldShowInc) {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        while (tagStartIndex != -1) {
                            descriptionText = descriptionText.replace(startTagInc, "");
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagEndIndex != -1) {
                            descriptionText = descriptionText.replace(endTagInc, "");
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagStartIndex != -1 && tagEndIndex != -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagInc.length);
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    }
                }

                if (templateData.data.description.short) {
                    templateData.data.description.short = descriptionText;
                } else {
                    templateData.data.description.value = descriptionText;
                }
            }
        }

        // Render the chat card template
        const templateType = ["tool", "consumable"].includes(this.data.type) ? this.data.type : "item";
        const template = `systems/sfrpg/templates/chat/${templateType}-card.html`;
        const html = await renderTemplate(template, templateData);

        // Basic chat message data
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: token ? ChatMessage.getSpeaker({token: token}) : ChatMessage.getSpeaker({actor: this.actor})
        };

        // Toggle default roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "blindroll") chatData["blind"] = true;

        // Create the chat message
        return ChatMessage.create(chatData, { displaySheet: false });
    }

    /* -------------------------------------------- */
    /*  Chat Cards                                  */
    /* -------------------------------------------- */

    getChatData(htmlOptions) {
        const data = duplicate(this.data.data);
        const labels = this.labels;

        // Rich text description
        data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

        // Item type specific properties
        const props = [];
        const fn = this[`_${this.data.type}ChatData`];
        if (fn) fn.bind(this)(data, labels, props);

        // General equipment properties
        const equippableTypes = ["weapon", "equipment", "shield"];
        if (data.hasOwnProperty("equipped") && equippableTypes.includes(this.data.type)) {
            props.push(
                {name: data.equipped ? "Equipped" : "Not Equipped", tooltip: null },
                {name: data.proficient ? "Proficient" : "Not Proficient", tooltip: null }
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(
                {name: labels.target, tooltip: null },
                {name: labels.area, tooltip: null },
                {name: labels.activation, tooltip: null },
                {name: labels.range, tooltip: null },
                {name: labels.duration, tooltip: null }
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push({
                name: labels.capacity,
                tooltip: null
            });
        }

        if (this.data.type === "container") {
            if (this.actor) {
                let wealth = 0;
                const containedItems = this._getContainedItems();
                for (const item of containedItems) {
                    wealth += item.data.data.quantity * item.data.data.price;
                }
                wealth = Math.floor(wealth);

                const wealthString = new Intl.NumberFormat().format(wealth);
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
        const contents = this.data.data.container?.contents;
        if (!contents || !this.actor) {
            return [];
        }

        const itemsToTest = [this];
        const containedItems = [];
        while (itemsToTest.length > 0) {
            const itemToTest = itemsToTest.shift();
            
            const contents = itemToTest?.data?.data?.container?.contents;
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
            {name: this.getRemainingUses() + "/" + this.getMaxUses() + " Charges", tooltip: null}
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
            {name: "Goods", tooltip: null},
            data.bulk ? {name: `Bulk ${data.bulk}`, tooltip: null} : null
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
            {name: "Technological", tooltip: null},
            data.bulk ? {name: `Bulk ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `Hands ${data.hands}`, tooltip: null} : null
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
            {name: "Hybrid", tooltip: null},
            data.bulk ? {name: `Bulk ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `Hands ${data.hands}`, tooltip: null} : null
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
            "Magic",
            data.bulk ? {name: `Bulk ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `Hands ${data.hands}`, tooltip: null} : null
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
            armorType = "Any"
        } else {
            armorType = CONFIG.SFRPG.armorTypes[data.armorType];
        }

        props.push(
            {name: "Armor Upgrade", tooltip: null},
            data.slots ? {name: `Slots ${data.slots}`, tooltip: null} : null,
            {name: `Allowed armor ${armorType}`, tooltip: null}
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            {name:"Augmentation", tooltip: null},
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
            {name: "Weapon Fusion", tooltip: null},
            data.level ? {name: `Level ${data.level}`, tooltip: null} : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            {name: "Starship Weapon", tooltip: null},
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
            {name: "Theme", tooltip: null},
            data.abilityMod.ability ? {name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null} : null,
            data.skill ? {name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null} : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            {name: "Race", tooltip: null},
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

        if (data.senses &&  data.senses.usedForSenses == true) {
            // We deliminate the senses by `,` and present each sense as a separate property
            let sensesDeliminated = data.senses.senses.split(",");
            for (let index = 0; index < sensesDeliminated.length; index++)
            {
                var sense = sensesDeliminated[index];
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
        const itemData = this.data;
        const isWeapon = ["weapon", "shield"].includes(this.data.type);

        const actorData = this.actor.data.data;
        if (!this.hasAttack) {
            throw new Error("You may not place an Attack Roll with this Item.");
        }

        if (this.data.type === "starshipWeapon") return this._rollStarshipAttack(options);
        if (this.data.type === "vehicleAttack") return this._rollVehicleAttack(options);

        // Determine ability score modifier
        let abl = itemData.data.ability;
        if (!abl && (this.data.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        else if (!abl && this.actor.data.type === "npc") abl = "";
        else if (!abl) abl = "str";        

        // Define Roll parts
        const parts = [];
        
        if (Number.isNumeric(itemData.data.attackBonus) && itemData.data.attackBonus !== 0) parts.push("@item.data.attackBonus");
        if (abl) parts.push(`@abilities.${abl}.mod`);
        if (["character", "drone"].includes(this.actor.data.type)) parts.push("@attributes.baseAttackBonus.value");
        if (isWeapon)
        {
            const procifiencyKey = SFRPG.weaponTypeProficiency[this.data.data.weaponType];
            const proficient = itemData.data.proficient || this.actor?.data?.data?.traits?.weaponProf?.value?.includes(procifiencyKey);
            if (!proficient) {
                parts.push("-4");
            }
        }

        let acceptedModifiers = [SFRPGEffectType.ALL_ATTACKS];
        if (["msak", "rsak"].includes(this.data.data.actionType)) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_ATTACKS);
        } else if (this.data.data.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_ATTACKS);
        } else if (this.data.data.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_ATTACKS);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_ATTACKS);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_ATTACKS);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            if (mod.effectType === SFRPGEffectType.WEAPON_ATTACKS) {
                if (mod.valueAffected !== this.data.data.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_ATTACKS) {
                if (!this.data.data.properties[mod.valueAffected]) {
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
        let crit = 20;
        //if ( this.data.type === "weapon" ) crit = this.actor.getFlag("sfrpg", "weaponCriticalThreshold") || 20;

        // Define Roll Data
        const rollData = duplicate(actorData);
        // Add hasSave to roll
        itemData.hasSave = this.hasSave;
        itemData.hasDamage = this.hasDamage;
        itemData.hasCapacity = this.hasCapacity();

        rollData.item = itemData;
        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: itemData.name});

        //Warn the user if there is no ammo left
        const usage = itemData.data.usage?.value || 0;
        const availableCapacity = this.getCurrentCapacity();
        if (availableCapacity < usage) {
            ui.notifications.warn(game.i18n.format("SFRPG.ItemNoUses", {name: this.data.name}));
        }
        
        const rollContext = new RollContext();
        rollContext.addContext("owner", this.actor);
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("owner");

        this.actor?.setupRollContexts(rollContext);

        /** Create additional modifiers. */
        const additionalModifiers = [
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Charge"), modifier: "-2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Flanking"), modifier: "+2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.FightDefensively"), modifier: "-4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.FullAttack"), modifier: "-4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.HarryingFire"), modifier: "+2", enabled: false, notes: game.i18n.format("SFRPG.Rolls.Character.HarryingFireTooltip") } },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Nonlethal"), modifier: "-4", enabled: false} }
        ];

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
            flavor: this.data?.data?.chatFlavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: crit,
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

        const itemData = duplicate(this.data.data);
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
                    ui.notifications.info("Currently cannot deduct ammunition from weapons with a usage per minute outside of combat.");
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
        const parts = ["max(@gunner.attributes.baseAttackBonus.value, @gunner.skills.pil.ranks)", "@gunner.abilities.dex.mod"];

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
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        /** Create additional modifiers. */
        const additionalModifiers = [
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: "@ship.attributes.computer.value", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.SnapShot"), modifier: "-2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.FireAtWill"), modifier: "-4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.Broadside"), modifier: "-2", enabled: false} }
        ];
        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");

        return await DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
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

    /**
     * Place an attack roll for a vehicle using an item.
     * @param {Object} options Options to pass to the attack roll
     */
    async _rollVehicleAttack(options = {}) {

        // TODO: Take vehicle's negative attack modifiers
        const parts = []

        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        return await DiceSFRPG.d20Roll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
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
        const itemData  = this.data.data;
        const actorData = this.actor.getRollData(); //this.actor.data.data;
        const isWeapon  = ["weapon", "shield"].includes(this.data.type);
        const isHealing = this.data.data.actionType === "heal";

        if (!this.hasDamage) {
            throw new Error("You may not make a Damage Roll with this Item.");
        }

        if (this.data.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });
        if (this.data.type === "vehicleAttack") return this._rollVehicleDamage({ event: event});

        // Determine ability score modifier
        let abl = itemData.ability;
        if (!abl && (this.data.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        else if (!abl) abl = "str";

        // Define Roll parts
        /** @type {DamageParts[]} */
        const parts = itemData.damage.parts.map(part => part);
        
        let acceptedModifiers = [SFRPGEffectType.ALL_DAMAGE];
        if (["msak", "rsak"].includes(this.data.data.actionType)) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_DAMAGE);
        } else if (this.data.data.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_DAMAGE);
        } else if (this.data.data.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_DAMAGE);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_DAMAGE);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_DAMAGE);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            if (!acceptedModifiers.includes(mod.effectType)) {
                return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_DAMAGE) {
                if (mod.valueAffected !== this.data.data.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_DAMAGE) {
                if (!this.data.data.properties[mod.valueAffected]) {
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

            //console.log(`Adding ${bonus.name} with ${bonus.modifier}`);
            let computedBonus = bonus.modifier;
            parts.push({ "formula": computedBonus, "types": null, "operator": null });
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
                title = game.i18n.format("SFRPG.Rolls.HealingRollFull", {name: this.data.name});
            } else {
                title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.data.name});
            }
        }
        
        const rollContext = new RollContext();
        rollContext.addContext("owner", this.actor, rollData);
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("owner");

        this.actor?.setupRollContexts(rollContext);

        /** Create additional modifiers. */
        const additionalModifiers = [];
        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        if (additionalModifiers.length > 0) {
            rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
            parts.push({ "formula": "@additional.modifiers.bonus", "types": null, "operator": null });
        }

        // Call the roll helper utility
        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            criticalData: itemData.critical,
            rollContext: rollContext,
            title: title,
            flavor: itemData.chatFlavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
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
        const itemData = this.data.data;

        if (!this.hasDamage) {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleAttackSheet.Errors.NoDamage"))
        }

        // const [parts, damageTypes] = itemData.damage.parts.reduce((acc, cur) => {
        //     if (cur.formula && cur.formula.trim() !== "") acc[0].push(cur.formula);
        //     if (cur.types) {
        //         const filteredTypes = Object.entries(cur.types).filter(type => type[1]);
        //         const obj = { types: [], operator: "" };

        //         for (const type of filteredTypes) {
        //             obj.types.push(type[0]);
        //         }

        //         if (cur.operator) obj.operator = cur.operator;

        //         acc[1].push(obj);
        //     }

        //     return acc;
        // }, [[], []]);

        const parts = itemData.damage.parts.map(part => part);

        let title = '';
        if (game.settings.get('sfrpg', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("vehicle", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
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
        const itemData = this.data.data;

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = itemData.damage.parts.map(part => part);

        let title = '';
        if (game.settings.get('sfrpg', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
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
        const itemData = this.data.data;
        const actorData = this.actor.getRollData();
        if (!itemData.formula) {
            throw new Error("This Item does not have a formula to roll!");
        }

        // Define Roll Data
        const rollContext = new RollContext();
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("item");
        if (this.actor) {
            rollContext.addContext("owner", this.actor);
            rollContext.setMainContext("owner");
        }

        this.actor?.setupRollContexts(rollContext);
    
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
        const itemData = this.data.data;
        const labels = this.labels;
        const formula = itemData.damage ? labels.damage : itemData.formula;

        // Submit the roll to chat
        if (formula) {
            Roll.create(formula).toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `Consumes ${this.name}`
            });
        } else {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `Consumes ${this.name}`
            })
        }

        // Deduct consumed charges from the item
        if (itemData.uses.autoUse) {
            const quantity = itemData.quantity;
            const remainingUses = this.getRemainingUses();

            // Deduct an item quantity
            if (remainingUses <= 1 && quantity > 1) {
                this.update({
                    'data.quantity': Math.max(remainingUses - 1, 0),
                    'data.uses.value': this.getMaxUses()
                });
            }

            // Optionally destroy the item
            else if (remainingUses <= 1 && quantity <= 1 && itemData.uses.autoDestroy) {
                this.actor.deleteEmbeddedDocuments("Item", [this.id]);
            }

            // Deduct the remaining charges
            else {
                this.update({'data.uses.value': Math.max(remainingUses - 1, 0) });
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform an ability recharge test for an item which uses the d6 recharge mechanic
     * @prarm {Object} options
     */
    async rollRecharge(options = {}) {
        const data = this.data.data;
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
        if (success) promises.push(this.update({ "data.recharge.charged": true }));
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
        const isTargetted = action === "save";
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const chatCardActor = this._getChatCardActor(card);
        if (!chatCardActor) return;

        button.disabled = true;

        // Get the Item
        const item = chatCardActor.items.get(card.dataset.itemId);

        // Get the target
        const targetActor = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });

        // Saving Throw
        else if (action === "save" && targetActor) {
            const savePromise = targetActor.rollSave(button.dataset.type, { event });
            savePromise.then(() => {
                button.disabled = false;
            });
            return;
        }

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
                if (tokenData)
                {
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
        const data = this._ensureHasModifiers(duplicate(this.data.data));
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

        await this.update({["data.modifiers"]: modifiers});
    }

    /**
     * Delete a modifier for this Actor.
     * 
     * @param {String} id The id for the modifier to delete
     */
    async deleteModifier(id) {
        const modifiers = this.data.data.modifiers.filter(mod => mod._id !== id);
        
        await this.update({"data.modifiers": modifiers});
    }

    /**
     * Edit a modifier for an Actor.
     * 
     * @param {String} id The id for the modifier to edit
     */
    editModifier(id) {
        const modifiers = duplicate(this.data.data.modifiers);
        const modifier = modifiers.find(mod => mod._id === id);

        new SFRPGModifierApplication(modifier, this, {}, this.actor).render(true);
    }
}
