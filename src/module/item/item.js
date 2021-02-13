import { DiceSFRPG, RollContext } from "../dice.js";
import { SFRPG } from "../config.js";
import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../modifiers/types.js";
import SFRPGModifier from "../modifiers/modifier.js";
import SFRPGModifierApplication from "../apps/modifier-app.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";

export class ItemSFRPG extends Item {

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
        return !!(this.data.data.save && this.data.data.save.type);
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
        const actorData = this.actor ? this.actor.data : {};
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

        // Vehicle Attacks
        else if (itemData.type == "vehicleAttack") {
            //
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

            // Save DC
            let save = data.save || {};
            labels.save = this._getSaveLabel(save, actorData, data);

            // Damage
            let dam = data.damage || {};
            if (dam.parts) labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
        }

        // Assign labels and return the Item
        this.labels = labels;
    }

    _getSaveLabel(save, actorData, itemData) {
        if (!save?.type || !save?.dc) return "";
        
        let dcFormula = save.dc.toString();
        if (dcFormula) {
            const rollContext = new RollContext();
            rollContext.addContext("item", this, itemData);
            rollContext.setMainContext("item");
            if (this.actor) {
                rollContext.addContext("owner", this.actor);
                rollContext.setMainContext("owner");
            }
    
            this.actor?.setupRollContexts(rollContext);

            const rollResult = DiceSFRPG.createRoll({
                rollContext: rollContext,
                rollFormula: dcFormula,
                mainDie: 'd0',
                dialogOptions: { skipUI: true }
            });

            const returnValue = `DC ${rollResult.roll.total || ""} ${CONFIG.SFRPG.saves[save.type]} ${CONFIG.SFRPG.saveDescriptors[save.descriptor]}`;
            return returnValue;
        } else {
            return `DC ${save.dc || ""} ${CONFIG.SFRPG.saves[save.type]} ${CONFIG.SFRPG.saveDescriptors[save.descriptor]}`;
        }
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
            console.log(`SFRPG | ${this.name} does not have the modifiers data object, attempting to create them...`);
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
        let htmlOptions = { secrets: this.actor?.owner || true, rollData: this.data };
        htmlOptions.rollData.owner = this.actor?.data?.data;

        // Basic template rendering data
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.scene._id}.${token.id}` : null,
            item: this.data,
            data: this.getChatData(htmlOptions),
            labels: this.labels,
            hasAttack: this.hasAttack,
            hasDamage: this.hasDamage,
            isVersatile: this.isVersatile,
            hasSave: this.hasSave
        };

        // Render the chat card template
        const templateType = ["tool", "consumable"].includes(this.data.type) ? this.data.type : "item";
        const template = `systems/sfrpg/templates/chat/${templateType}-card.html`;
        const html = await renderTemplate(template, templateData);

        // Basic chat message data
        const chatData = {
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
            }
        };

        // Toggle default roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "blindroll") chatData["blind"] = true;

        // Create the chat message
        return ChatMessage.create(chatData, { displaySheet: false });
    }

    /* -------------------------------------------- */
    /*  Chat Cards																	*/
    /* -------------------------------------------- */

    getChatData(htmlOptions) {
        const data = duplicate(this.data.data);
        const labels = this.labels;
        labels.save = this._getSaveLabel(data.save, this.actor.data, data);

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
                data.equipped ? "Equipped" : "Not Equipped",
                data.proficient ? "Proficient" : "Not Proficient",
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(
                labels.target,
                labels.area,
                labels.activation,
                labels.range,
                labels.duration
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push(
                labels.capacity
            );
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
                props.push(wealthProperty);
            }
        }

        // Filter properties and return
        data.properties = props.filter(p => !!p);
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
                    const containedItem = this.actor.getOwnedItem(content.id);
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
            CONFIG.SFRPG.armorTypes[data.armor.type],
            labels.eac || null,
            labels.kac || null
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for weapon type items
     * @private
     */
    _weaponChatData(data, labels, props) {
        props.push(
            CONFIG.SFRPG.weaponTypes[data.weaponType],
            ...Object.entries(data.properties).filter(e => e[1] === true)
                .map(e => CONFIG.SFRPG.weaponProperties[e[0]])
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for consumable type items
     * @private
     */
    _consumableChatData(data, labels, props) {
        props.push(
            CONFIG.SFRPG.consumableTypes[data.consumableType],
            data.uses.value + "/" + data.uses.max + " Charges"
        );
        data.hasCharges = data.uses.value >= 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for tool type items
     * @private
     */
    _toolChatData(data, labels, props) {
        props.push(
            CONFIG.SFRPG.abilities[data.ability] || null,
            CONFIG.SFRPG.proficiencyLevels[data.proficient || 0]
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for goods type items
     * @private
     */
    _goodsChatData(data, labels, props) {
        props.push(
            "Goods",
            data.bulk ? `Bulk ${data.bulk}` : null
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
            "Technological",
            data.bulk ? `Bulk ${data.bulk}` : null,
            data.hands ? `Hands ${data.hands}` : null
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
            "Hybrid",
            data.bulk ? `Bulk ${data.bulk}` : null,
            data.hands ? `Hands ${data.hands}` : null
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
            data.bulk ? `Bulk ${data.bulk}` : null,
            data.hands ? `Hands ${data.hands}` : null
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
            "Armor Upgrade",
            data.slots ? `Slots ${data.slots}` : null,
            `Allowed armor ${armorType}`
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            "Augmentation",
            data.type ? CONFIG.SFRPG.augmentationTypes[data.type] : null,
            data.system ? CONFIG.SFRPG.augmentationSytems[data.system] : null
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
            "Weapon Fusion",
            data.level ? `Level ${data.level}` : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            "Starship Weapon",
            data.weaponType ? CONFIG.SFRPG.starshipWeaponTypes[data.weaponType] : null,
            data.class ? CONFIG.SFRPG.starshipWeaponClass[data.class] : null,
            data.range ? CONFIG.SFRPG.starshipWeaponRanges[data.range] : null,
            data.mount.mounted ? game.i18n.localize("SFRPG.Items.ShipWeapon.Mounted") : game.i18n.localize("SFRPG.Items.ShipWeapon.NotMounted"),
            data.speed > 0 ? game.i18n.format("SFRPG.Items.ShipWeapon.Speed", {speed: data.speed}) : null
        );
    }

    /**
     * Prepare chat card data for shield type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _shieldChatData(data, labels, props) {
        let wieldedBonus = data.proficient ? data.bonus.wielded.toString() : "0";
        let alignedBonus = data.proficient ? data.bonus.aligned.toString() : "0";

        props.push(
            game.i18n.localize("SFRPG.Items.Shield.Shield"),
            game.i18n.format("SFRPG.Items.Shield.AcMaxDex", { maxDex: data.dex.signedString() }),
            game.i18n.format("SFRPG.Items.Shield.ArmorCheck", { acp: data.acp.signedString() }),
            game.i18n.format("SFRPG.Items.Shield.Bonuses", { wielded: wieldedBonus.signedString(), aligned: alignedBonus.signedString() }),
            data.proficient ? game.i18n.localize("SFRPG.Items.Proficient") : game.i18n.localize("SFRPG.Items.NotProficient")
        );
    }

    /* -------------------------------------------- */

    /**
     * Render a chat card for Spell type data
     * @return {Object}
     * @private
     */
    _spellChatData(data, labels, props) {
        const ad = this.actor.data.data;

        // Spell saving throw text
        const abl = ad.attributes.keyability || "int";
        if (this.hasSave && !data.save.dc) data.save.dc = `10 + @owner.details.level.value + @owner.abilities.${abl}.mod`;
        labels.save = this._getSaveLabel(data.save, this.actor.data, data);

        // Spell properties
        props.push(
            labels.level
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for items of the "Feat" type
     */
    _featChatData(data, labels, props) {
        const ad = this.actor.data.data;

        // Spell saving throw text
        const abl = data.ability || ad.attributes.keyability || "str";
        if (this.hasSave && !data.save.dc) data.save.dc = `10 + @owner.details.level.value + @owner.abilities.${abl}.mod`;
        labels.save = this._getSaveLabel(data.save, this.actor.data, data);

        // Feat properties
        props.push(
            data.requirements
        );
    }

    _themeChatData(data, labels, props) {
        props.push(
            "Theme",
            data.abilityMod.ability ? `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}` : null,
            data.skill ? `Skill ${CONFIG.SFRPG.skills[data.skill]}` : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            "Race",
            data.type ? data.type : null,
            data.subtype ? data.subtype : null
        );
    }

    /* -------------------------------------------- */
    /*  Item Rolls - Attack, Damage, Saves, Checks  */
    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.d20Roll logic for the core implementation
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
        
        if (itemData.data.attackBonus !== 0) parts.push("@item.data.attackBonus");
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
        const availableCapacity = itemData.data.capacity?.value || 0;
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
        return await DiceSFRPG.d20Roll({
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
            onClose: this._onAttackRollClose.bind(this)
        });
    }

    /**
     * Handle updating item capacity when the attack dialog closes.
     *
     * @param {Html} html The html from the dailog
     * @param {Array} parts The parts of the roll
     * @param {Object} data The data
     */
    _onAttackRollClose(roll, formula, finalFormula) {
        if (!roll) {
            return;
        }
        
        const itemData = duplicate(this.data.data);

        if (itemData.hasOwnProperty("usage")) {
            const usage = itemData.usage;

            const capacity = itemData.capacity;
            if (!capacity?.value || capacity.value <= 0) return;

            if (usage.per && ["round", "shot"].includes(usage.per)) {
                capacity.value = Math.max(capacity.value - usage.value, 0);
            } else if (usage.per && ['minute'].includes(usage.per)) {
                if (game.combat) {
                    const round = game.combat.current.round || 0;
                    if (round % 10 === 1) {
                        capacity.value = Math.max(capacity.value - usage.value, 0);
                    }
                } else {
                    ui.notifications.info("Currently cannot deduct ammunition from weapons with a usage per minute outside of combat.");
                }
            }

            this.actor.updateEmbeddedEntity("OwnedItem", {
                _id: this.data._id,
                "data.capacity.value": capacity.value
            }, {});
            // this.actor.updateOwnedItem({
            //   id: this.data.id,
            //   'data.capacity.value': capacity.value
            // });
        }

        const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
        if (rollDamageWithAttack) {
            this.rollDamage({});
        }
    }

    /**
     * Place an attack roll for a starship using an item.
     * @param {Object} options Options to pass to the attack roll
     */
    async _rollStarshipAttack(options = {}) {
        const parts = ["max(@gunner.attributes.baseAttackBonus.value, @gunner.skills.pil.ranks)", "@gunner.abilities.dex.mod"];

        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});
        
        if (this.hasCapacity()) {
            if (this.data.data.capacity.value <= 0) {
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
                    if (rollDamageWithAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity()) {
                        this.actor.updateEmbeddedEntity("OwnedItem", {
                            _id: this.data._id,
                            "data.capacity.value": Math.max(0, this.data.data.capacity.value - 1)
                        }, {});
                    }
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
                    if (rollDamageWithAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity()) {
                        this.actor.updateEmbeddedEntity("OwnedItem", {
                            _id: this.data._id,
                            "data.capacity.value": Math.max(0, this.data.data.capacity.value - 1)
                        }, {});
                    }
                }
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * Place a damage roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.damageRoll logic for the core implementation
     */
    async rollDamage({ event } = {}) {
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
        let parts = itemData.damage.parts.map(d => d[0]);
        let damageTypes = itemData.damage.parts.map(d => d[1]);
        
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
            parts.push(computedBonus);
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
            parts.push("@additional.modifiers.bonus");
        }

        // Call the roll helper utility
        return await DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            criticalData: itemData.critical,
            rollContext: rollContext,
            title: title,
            damageTypes: damageTypes,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            }
        });
    }

    async _rollVehicleDamage({ event } = {}) {
        const itemData = this.data.data;

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = itemData.damage.parts.map(d => d[0]);

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

        return await DiceSFRPG.damageRoll({
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
            }
        });
    }

    async _rollStarshipDamage({ event } = {}) {
        const itemData = this.data.data;

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = itemData.damage.parts.map(d => d[0]);

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

        return await DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
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
    
        const title = `Other Formula`;
        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            rollFormula: itemData.formula,
            title: title
        });

        const preparedRollExplanation = DiceSFRPG.formatFormula(rollResult.formula.formula);
        rollResult.roll.render().then((rollContent) => {
            const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
            const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);
    
            ChatMessage.create({
                flavor: itemData.chatFlavor || title,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: explainedRollContent,
                rollMode: game.settings.get("core", "rollMode"),
                roll: rollResult.roll,
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                sound: CONFIG.sounds.dice
            });
        });
    }

    /* -------------------------------------------- */

    /**
     * Use a consumable item
     */
    async rollConsumable(options = {}) {
        let itemData = this.data.data;
        const labels = this.labels;
        const formula = itemData.damage ? labels.damage : itemData.formula;

        // Submit the roll to chat
        if (formula) {
            new Roll(formula).toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `Consumes ${this.name}`
            });
        } else {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `Consumes ${this.name}`
            })
        }

        // Deduct consumed charges from the item
        if (itemData.uses.autoUse) {
            let q = itemData.quantity;
            let c = itemData.uses.value;

            // Deduct an item quantity
            if (c <= 1 && q > 1) {
                this.update({
                    'data.quantity': Math.max(q - 1, 0),
                    'data.uses.value': itemData.uses.max
                });
            }

            // Optionally destroy the item
            else if (c <= 1 && q <= 1 && itemData.uses.autoDestroy) {
                this.actor.deleteOwnedItem(this.id);
            }

            // Deduct the remaining charges
            else {
                this.update({'data.uses.value': Math.max(c - 1, 0) });
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
        const roll = new Roll("1d6").roll();
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const rollMode = game.settings.get("core", "rollMode");
        const chatData = {
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
            whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessage.getWhisperRecipients("GM") : null,
            blind: rollMode === "blindroll",
            roll: roll,
            speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
            }
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
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        // Validate permission to proceed with the roll
        const isTargetted = action === "save";
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const actor = this._getChatCardActor(card);
        if (!actor) return;

        // Get the Item
        const item = actor.getOwnedItem(card.dataset.itemId);

        // Get the target
        const target = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });

        // Saving Throw
        else if (action === "save" && target) await target.rollSave(button.dataset.type, { event });

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

        // Case 1 - a synthetic actor from a Token
        const tokenKey = card.dataset.tokenId;
        if (tokenKey) {
            const [sceneId, tokenId] = tokenKey.split(".");
            const scene = game.scenes.get(sceneId);
            if (!scene) return null;
            const tokenData = scene.getEmbeddedEntity("Token", tokenId);
            if (!tokenData) return null;
            const token = new Token(tokenData);
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.actorId;
        return game.actors.get(actorId) || null;
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
        const controlled = canvas.tokens.controlled;
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

    /**
     * Checks if this item has capacity.
     */
    hasCapacity() {
        if (this.type === "starshipWeapon") {
            return (
                this.data.data.weaponType === "tracking"
                || this.data.data.special["mine"]
                || this.data.data.special["transposition"]
                || this.data.data.special["orbital"]
                || this.data.data.special["rail"]
                || this.data.data.special["forcefield"]
                || this.data.data.special["limited"]
            );
        }
        return this.data.data.hasOwnProperty("capacity");
    }
}
