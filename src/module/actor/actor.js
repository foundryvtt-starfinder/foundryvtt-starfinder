import { DiceSFRPG, RollContext } from "../dice.js";
import { ChoiceDialog } from "../apps/choice-dialog.js";
import { ShortRestDialog } from "../apps/short-rest.js";
import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
import { AddEditSkillDialog } from "../apps/edit-skill-dialog.js";
import { NpcSkillToggleDialog } from "../apps/npc-skill-toggle-dialog.js";
import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../modifiers/types.js";
import SFRPGModifier from "../modifiers/modifier.js";
import SFRPGModifierApplication from "../apps/modifier-app.js";
import { DroneRepairDialog } from "../apps/drone-repair-dialog.js";
import { getItemContainer } from "./actor-inventory.js"

import { } from "./crew-update.js"
import { ItemSheetSFRPG } from "../item/sheet.js";
import { ItemSFRPG } from "../item/item.js";
import { ActorSheetSFRPG } from "./sheet/base.js";

/**
 * Extend the base :class:`Actor` to implement additional logic specialized for SFRPG
 */
export class ActorSFRPG extends Actor {

    constructor(data, context) {
        super(data, context);
        //console.log(`Constructor for actor named ${data.name} of type ${data.type}`);
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();

        return data;
    }

    /**
     * Augment the basic actor data with additional dynamic data.
     * 
     * @param {Object} actorData The data for the actor
     * @returns {Object} The actors data
     */
    prepareData() {
        super.prepareData();

        this._ensureHasModifiers(this.data.data);
        const modifiers = this.getAllModifiers();

        const items = this.items;
        const armor = items.find(item => item.type === "equipment" && item.data.data.equipped);
        const shields = items.filter(item => item.type === "shield" && item.data.data.equipped);
        const weapons = items.filter(item => item.type === "weapon" && item.data.data.equipped);
        const races = items.filter(item => item.type === "race");
        const frames = items.filter(item => item.type === "starshipFrame");
        const classes = items.filter(item => item.type === "class");
        const chassis = items.filter(item => item.type === "chassis");
        const theme = items.find(item => item.type === "theme");
        const mods = items.filter(item => item.type === "mod");
        const armorUpgrades = items.filter(item => item.type === "upgrade");
        const asis = items.filter(item => item.type === "asi");
        game.sfrpg.engine.process("process-actors", {
            actorId: this.id,
            actor: this,
            type: this.data.type,
            data: this.data.data,
            flags: this.data.flags,
            items: this.items,
            armor,
            shields,
            weapons,
            races,
            classes,
            chassis,
            modifiers,
            theme,
            mods,
            armorUpgrades,
            asis,
            frames
        });
    }

    
    /** @override */
    render(force, context={}) {
        /** Clear out deleted item sheets. */
        const keysToDelete = [];
        for (const [appId, app] of Object.entries(this.apps)) {
            if (app instanceof ItemSheetSFRPG) {
                const item = app.object;
                if (!this.items.find(x => x.id === item.id)) {
                    keysToDelete.push(appId);
                }
            }
        }
        if (keysToDelete.length > 0) {
            for (const key of keysToDelete) {
                delete this.apps[key];
            }
        }

        /** Now render this actor. */
        return super.render(force, context);
    }

    /**
     * TODO: Use these two methods to properly setup actor data for use
     * in the new Active Effects API.
     */
    prepareBaseData() { super.prepareBaseData(); }
    prepareDerivedData() { super.prepareDerivedData(); }

    /**
     * Check to ensure that this actor has a modifiers data object set, if not then set it. 
     * These will always be needed from hence forth, so we'll just make sure that they always exist.
     * 
     * @param {Object}      data The actor data to check against.
     * @param {String|Null} prop A specific property name to check.
     * 
     * @returns {Object}         The modified data object with the modifiers data object added.
     */
    _ensureHasModifiers(data, prop = null) {
        if (!hasProperty(data, "modifiers")) {
            //console.log(`Starfinder | ${this.name} does not have the modifiers data object, attempting to create them...`);
            data.modifiers = [];
        }

        return data;
    }
    
    /**
     * Extend the default update method to enhance data before submission.
     * See the parent Entity.update method for full details.
     *
     * @param {Object} data     The data with which to update the Actor
     * @param {Object} options  Additional options which customize the update workflow
     * @return {Promise}        A Promise which resolves to the updated Entity
     */
    async update(data, options = {}) {
        const newSize = data['data.traits.size'];
        if (newSize && (newSize !== getProperty(this.data, "data.traits.size"))) {
            let size = CONFIG.SFRPG.tokenSizes[data['data.traits.size']];
            if (this.isToken) this.token.update({ height: size, width: size });
            else if (!data["token.width"] && !hasProperty(data, "token.width")) {
                setProperty(data, 'token.height', size);
                setProperty(data, 'token.width', size);
            }
        }

        return super.update(data, options);
    }

    /**
     * Extend OwnedItem creation logic for the SFRPG system to make weapons proficient by default when dropped on a NPC sheet
     * See the base Actor class for API documentation of this method
     * 
     * @param {String} embeddedName The type of Entity being embedded.
     * @param {Object} itemData The data object of the item
     * @param {Object} options Any options passed in
     * @returns {Promise}
     */
    async createEmbeddedDocuments(embeddedName, itemData, options) {
        for (const item of itemData) {
            if (!this.hasPlayerOwner) {
                let t = item.type;
                let initial = {};           
                if (t === "weapon") initial['data.proficient'] = true;
                if (["weapon", "equipment"].includes(t)) initial['data.equipped'] = true;
                if (t === "spell") initial['data.prepared'] = true;
                mergeObject(item, initial);
            }

            item.effects = null;
        }

        return super.createEmbeddedDocuments(embeddedName, itemData, options);
    }

    async useSpell(item, { configureDialog = true } = {}) {
        if (item.data.type !== "spell") throw new Error("Wrong item type");

        let lvl = item.data.data.level;
        const usesSlots = (lvl > 0) && item.data.data.preparation.mode === "";
        if (!usesSlots) return item.roll();

        let consume = true;
        if (configureDialog) {
            try {
                const spellFormData = await SpellCastDialog.create(this, item);
                lvl = parseInt(spellFormData.get("level"));
                consume = Boolean(spellFormData.get("consume"));
            if (lvl && lvl !== item.data.data.level && !Number.isNaN(lvl)) {
                const mergedData = mergeObject(item.data, { "data.level": lvl }, { inplace: false });
                console.log([item.data, mergedData]);
                item = new ItemSFRPG(mergedData, this);
                }
            } catch (error) {
                return null;
            }
        }

        if (consume && (lvl > 0)) {
            await this.update({
                [`data.spells.spell${lvl}.value`]: Math.max(parseInt(this.data.data.spells[`spell${lvl}`].value) - 1, 0)
            });
        }

        return item.roll();
    }

    /**
     * Edit a skill's fields
     * @param {string} skillId The skill id (e.g. "ins")
     * @param {Object} options Options which configure how the skill is edited
     */
    async editSkill(skillId, options = {}) {
        // Keeping this here for later
        // this.update({"data.skills.-=skillId": null});
        // use this to delete any unwanted skills.

        const skill = duplicate(this.data.data.skills[skillId]);
        const isNpc = this.data.type === "npc";
        const formData = await AddEditSkillDialog.create(skillId, skill, true, isNpc, this.isOwner),
            isTrainedOnly = Boolean(formData.get('isTrainedOnly')),
            hasArmorCheckPenalty = Boolean(formData.get('hasArmorCheckPenalty')),
            value = Boolean(formData.get('value')) ? 3 : 0,
            misc = Number(formData.get('misc')),
            ranks = Number(formData.get('ranks')),
            ability = formData.get('ability'),
            remove = Boolean(formData.get('remove'));

        if (remove) return this.update({ [`data.skills.-=${skillId}`]: null });

        let updateObject = {
            [`data.skills.${skillId}.ability`]: ability,
            [`data.skills.${skillId}.ranks`]: ranks,
            [`data.skills.${skillId}.value`]: value,
            [`data.skills.${skillId}.misc`]: misc,
            [`data.skills.${skillId}.isTrainedOnly`]: isTrainedOnly,
            [`data.skills.${skillId}.hasArmorCheckPenalty`]: hasArmorCheckPenalty
        };

        if (isNpc) updateObject[`data.skills.${skillId}.enabled`] = Boolean(formData.get('enabled'));

        if ("subname" in skill) {
            updateObject[`data.skills.${skillId}.subname`] = formData.get('subname');
        }

        return this.update(updateObject);
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

        new SFRPGModifierApplication(modifier, this).render(true);
    }

    /**
     * Returns an array of all modifiers on this actor. This will include items such as equipment, feat, classes, race, theme, etc.
     * 
     * @param {Boolean} ignoreTemporary Should we ignore temporary modifiers? Defaults to false.
     * @param {Boolean} ignoreEquipment Should we ignore equipment modifiers? Defaults to false.
     */
    getAllModifiers(ignoreTemporary = false, ignoreEquipment = false) {
        let allModifiers = this.data.data.modifiers.filter(mod => {
            return (!ignoreTemporary || mod.subtab === "permanent");
        });

        for (const actorModifier of allModifiers) {
            actorModifier.container = {actorId: this.id, itemId: null};
        }

        for (const item of this.data.items) {
            const itemData = item.data.data;
            const itemModifiers = itemData.modifiers;

            let modifiersToConcat = [];
            switch (item.type) {
                // Armor upgrades are only valid if they are slotted into an equipped armor
                case "upgrade":
                    {
                        if (!ignoreEquipment) {
                            const container = getItemContainer(this.data.items, item.id);
                            if (container && container.type === "equipment" && container.data.equipped) {
                                modifiersToConcat = itemModifiers;
                            }
                        }
                        break;
                    }

                // Weapon upgrades (Fusions and accessories) are only valid if they are slotted into an equipped weapon
                case "fusion":
                case "weaponAccessory":
                    {
                        if (!ignoreEquipment) {
                            const container = getItemContainer(this.data.items, item.id);
                            if (container && container.type === "weapon" && container.data.equipped) {
                                modifiersToConcat = itemModifiers;
                            }
                        }
                        break;
                    }

                // Augmentations are always applied
                case "augmentation":
                    modifiersToConcat = itemModifiers;
                    break;

                // Feats are only active when they are passive, or activated
                case "feat":
                    if (itemData.activation?.type === "" || itemData.isActive) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;

                // Special handling for equipment, shield, and weapon
                case "equipment":
                case "shield":
                case "weapon":
                    if (!ignoreEquipment && itemData.equipped) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;

                // Everything else
                default:
                    if (!itemData.equippable || itemData.equipped) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;
            }

            if (modifiersToConcat && modifiersToConcat.length > 0) {
                for (const itemModifier of modifiersToConcat) {
                    itemModifier.container = {actorId: this.id, itemId: item.id};
                }

                allModifiers = allModifiers.concat(modifiersToConcat);
            }
        }
        return allModifiers;
    }

    /**
     * Toggles what NPC skills are shown on the sheet.
     */
    async toggleNpcSkills() {
        const skills = duplicate(this.data.data.skills);
        const formData = await NpcSkillToggleDialog.create(skills);
        let enabledSkills = {};
        const delta = Object.entries(skills).reduce((obj, curr) => {
            if (curr[1].enabled) obj[`data.skills.${curr[0]}.enabled`] = !curr[1].enabled;
            return obj;
        }, {});

        for (let [key, value] of formData.entries()) {
            enabledSkills[`data.${key}`] = Boolean(value);
        }
        
        enabledSkills = mergeObject(enabledSkills, delta, {overwrite: false, inplace: false});

        return await this.update(enabledSkills);
    }

    /**
     * Add a new skill
     * @param {Object} options Options which configure how the skill is added
     */
    async addSkill(options = {}) {
        const skill = {
            ability: "int",
            ranks: 0,
            value: 0,
            misc: 0,
            isTrainedOnly: false,
            hasArmorCheckPenalty: false,
            subname: ""
        };

        let skillId = "pro";
        let counter = 0;

        while (this.data.data.skills[skillId]) {
            skillId = `pro${++counter}`;
        }

        const formData = await AddEditSkillDialog.create(skillId, skill, false, this.hasPlayerOwner, this.isOwner),
            isTrainedOnly = Boolean(formData.get('isTrainedOnly')),
            hasArmorCheckPenalty = Boolean(formData.get('hasArmorCheckPenalty')),
            value = Boolean(formData.get('value')) ? 3 : 0,
            misc = Number(formData.get('misc')),
            ranks = Number(formData.get('ranks')),
            ability = formData.get('ability'),
            subname = formData.get('subname');

        let newSkillData = {
            [`data.skills.${skillId}`]: {},
            [`data.skills.${skillId}.isTrainedOnly`]: isTrainedOnly,
            [`data.skills.${skillId}.hasArmorCheckPenalty`]: hasArmorCheckPenalty,
            [`data.skills.${skillId}.value`]: value,
            [`data.skills.${skillId}.misc`]: misc,
            [`data.skills.${skillId}.ranks`]: ranks,
            [`data.skills.${skillId}.ability`]: ability,
            [`data.skills.${skillId}.subname`]: subname,
            [`data.skills.${skillId}.mod`]: value + misc + ranks,
            [`data.skills.${skillId}.enabled`]: true
        };

        return this.update(newSkillData);
    }

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {Object} options      Options which configure how the skill check is rolled
     */
    async rollSkill(skillId, options = {}) {
        const skl = this.data.data.skills[skillId];

        if (!this.hasPlayerOwner) {
            return await this.rollSkillCheck(skillId, skl, options);
        }

        if (skl.isTrainedOnly && !(skl.ranks > 0)) {
            let content = `${CONFIG.SFRPG.skills[skillId.substring(0, 3)]} is a trained only skill, but ${this.name} is not trained in that skill.
                Would you like to roll anyway?`;

            return new Promise(resolve => {
                new Dialog({
                    title: `${CONFIG.SFRPG.skills[skillId.substring(0, 3)]} is trained only`,
                    content: content,
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: () => resolve(this.rollSkillCheck(skillId, skl, options))
                        },
                        cancel: {
                            label: "No"
                        }
                    },
                    default: "cancel"
                }).render(true);
            });
        } else {
            return await this.rollSkillCheck(skillId, skl, options);
        }
    }

    /**
     * Roll a generic ability test.
     * 
     * @param {String} abilityId The ability id (e.g. "str")
     * @param {Object} options Options which configure how ability tests are rolled
     */
    async rollAbility(abilityId, options = {}) {
        const label = CONFIG.SFRPG.abilities[abilityId];
        const abl = this.data.data.abilities[abilityId];
        
        let parts = [];
        let data = this.getRollData();

        //Include ability check bonus only if it's not 0
        if(abl.abilityCheckBonus) {
            parts.push('@abilityCheckBonus');
            data.abilityCheckBonus = abl.abilityCheckBonus;
        }
        parts.push(`@abilities.${abilityId}.mod`);

        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);

        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title:  `Ability Check - ${label}`,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            }
        });
    }

    /**
     * Roll a save check
     * 
     * @param {String} saveId The save id (e.g. "will")
     * @param {Object} options Options which configure how saves are rolled
     */
    async rollSave(saveId, options = {}) {
        const label = CONFIG.SFRPG.saves[saveId];
        const save = this.data.data.attributes[saveId];

        let parts = [];
        let data = this.getRollData();

        parts.push(`@attributes.${saveId}.bonus`);
        
        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);

        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title: `Save - ${label}`,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            }
        });
    }

    async rollSkillCheck(skillId, skill, options = {}) {
        let parts = [];
        let data = this.getRollData();

        parts.push(`@skills.${skillId}.mod`);
        
        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);
        
        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title: `Skill Check - ${CONFIG.SFRPG.skills[skillId.substring(0, 3)]}`,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            }
        });
    }

    /**
     * Roll the Piloting skill of the pilot of a vehicle
     *
     * @param {Object} options Options which configure how saves are rolled
     */
    async rollVehiclePilotingSkill(role = null, actorId = null, system = null, options = {}) {

        let parts = [];
        let data = this.getRollData();

        const rollContext = new RollContext();
        rollContext.addContext("vehicle", this, data);
        rollContext.setMainContext("vehicle");

        // Add piloting modifier of vehicle
        parts.push(`@attributes.modifiers.piloting`);

        // Roll a piloting check with a specific system (usually Autopilot).
        // Only takes vehicle and system piloting into account
        if (system) {
            rollContext.addContext("system", system, system.data.data);
            parts.push(`@system.piloting.piloting`);
        }
        else if(!role || !actorId) {
            // Add pilot's piloting modifier
            parts.push(`@pilot.skills.pil.mod`);
        }
        else {
            let passenger = this.data.data.crew[role].actors.find(element => element._id == actorId);
            let actorData = null;
            if (passenger instanceof ActorSFRPG) {
                actorData = passenger.data.data;
            } else {
                actorData = passenger.data;
            }

            rollContext.addContext("passenger", passenger, actorData);
            parts.push(`@passenger.skills.pil.mod`);
        }

        this.setupRollContexts(rollContext);

        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title: `Skill Check - ${CONFIG.SFRPG.skills["pil"]}`,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            }
        });
    }

    /**
     * A utility method used to apply damage to any selected tokens when an option
     * is selected from a chat card context menu.
     * 
     * @param {JQuery} html The jQuery object representing the chat card.
     * @param {Number} multiplier A number used to multiply the damage being applied
     * @returns {Promise<any[]>} 
     */
    static async applyDamageFromContextMenu(html, multiplier) {
        const totalDamageDealt = Math.floor(parseFloat(html.find('.dice-total').text()) * multiplier);
        const isHealing = (multiplier < 0);
        const promises = [];
        for (const controlledToken of canvas.tokens.controlled) {
            let promise = null;
            if (controlledToken.actor.data.type === "starship") {
                promise = ActorSFRPG._applyStarshipDamage(html, controlledToken.actor, totalDamageDealt, isHealing);
            } else if (controlledToken.actor.data.type === "vehicle") {
                promise = ActorSFRPG._applyVehicleDamage(html, controlledToken.actor, totalDamageDealt, isHealing);
            } else {
                promise = ActorSFRPG._applyActorDamage(html, controlledToken.actor, totalDamageDealt, isHealing);
            }

            if (promise) {
                promises.push(promise);
            }
        }

        return Promise.all(promises);
    }

    /**
     * Applies damage to the Actor.
     * 
     * TODO: This isn't ready for mainstream use yet. The method signiture is probably gonna
     * need to change, and the way it functions will most definetly change as well. So, I'm 
     * basically putting this here as a stub that has some limited functionality until I can
     * get some other changes in place to allow this to work the way most people would expect
     * it to work. So, don't mention that this method exists for the time being ;) Consider it
     * an easter egg.
     * 
     * @param {JQuery} html The jQuery object representing the roll data.
     * @param {Number} multiplier A number that is used to change the damage value.
     */
    async applyDamage(html, multiplier) {
        const totalDamageDealt = Math.floor(parseFloat(html.find('.dice-total').text()) * multiplier);
        const isHealing = (multiplier < 0);

        switch (this.data.type) {
            case 'starship':
                await ActorSFRPG._applyStarshipDamage(html, this, totalDamageDealt, isHealing);
                break;
            case 'vehicle':
                await ActorSFRPG._applyVehicleDamage(html, this, totalDamageDealt, isHealing);
                break;
            default:
                await ActorSFRPG._applyActorDamage(html, this, totalDamageDealt, isHealing);
                break;
        }
    }

    static async _applyActorDamage(roll, actor, totalDamageDealt, isHealing) {
        let remainingUndealtDamage = totalDamageDealt;
        const actorUpdate = {};

        /** Update temp hitpoints */
        if (!isHealing) {
            const originalTempHP = parseInt(actor.data.data.attributes.hp.temp) | 0;
            const newTempHP = Math.clamped(originalTempHP - remainingUndealtDamage, 0, actor.data.data.attributes.hp.tempmax);
            remainingUndealtDamage = remainingUndealtDamage - (originalTempHP - newTempHP);
            
            actorUpdate["data.attributes.hp.temp"] = newTempHP;
        }

        /** Update stamina points */
        if (!isHealing) {
            const originalSP = actor.data.data.attributes.sp.value;
            const newSP = Math.clamped(originalSP - remainingUndealtDamage, 0, actor.data.data.attributes.sp.max);
            remainingUndealtDamage = remainingUndealtDamage - (originalSP - newSP);
            
            actorUpdate["data.attributes.sp.value"] = newSP;
        }

        /** Update hitpoints */
        const originalHP = actor.data.data.attributes.hp.value;
        const newHP = Math.clamped(originalHP - remainingUndealtDamage, 0, actor.data.data.attributes.hp.max);
        remainingUndealtDamage = remainingUndealtDamage - (originalHP - newHP);
        
        actorUpdate["data.attributes.hp.value"] = newHP;

        const promise = actor.update(actorUpdate);

        /** If the remaining undealt damage is equal to or greater than the max hp, the character dies of Massive Damage. */
        if (actor.data.type === "character" && remainingUndealtDamage >= actor.data.data.attributes.hp.max) {
            const localizedDeath = game.i18n.format("SFRPG.CharacterSheet.Warnings.DeathByMassiveDamage", {name: actor.name});
            ui.notifications.warn(localizedDeath, {permanent: true});
        }
    
        return promise;
    }

    static async _applyVehicleDamage(roll, vehicleActor, totalDamageDealt, isHealing) {
        ui.notifications.warn("Cannot currently apply damage to vehicles using the context menu");
        return null;
    }

    static async _applyStarshipDamage(roll, starshipActor, totalDamageDealt, isHealing) {
        if (isHealing) {
            ui.notifications.warn("Cannot currently apply healing to starships using the context menu.");
            return null;
        }

        /** Ask for quadrant */
        const options = [
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Forward"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Port"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Starboard"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Aft")
        ];
        const results = await ChoiceDialog.show(
            game.i18n.format("SFRPG.StarshipSheet.Damage.Title", {name: starshipActor.name}),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Message"),
            {
                quadrant: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Quadrant"),
                    options: options,
                    default: options[0]
                }
            }
        );

        if (results.resolution !== "ok") {
            return null;
        }

        let targetKey = null;
        let originalData = null;
        let newData = null;

        const selectedQuadrant = results.result.quadrant;
        const indexOfQuadrant = options.indexOf(selectedQuadrant);
        if (indexOfQuadrant === 0) {
            targetKey = "data.quadrants.forward";
            originalData = starshipActor.data.data.quadrants.forward;
        } else if (indexOfQuadrant === 1) {
            targetKey = "data.quadrants.port";
            originalData = starshipActor.data.data.quadrants.port;
        } else if (indexOfQuadrant === 2) {
            targetKey = "data.quadrants.starboard";
            originalData = starshipActor.data.data.quadrants.starboard;
        } else if (indexOfQuadrant === 3) {
            targetKey = "data.quadrants.aft";
            originalData = starshipActor.data.data.quadrants.aft;
        } else {
            /** Error, unrecognized quadrant, somehow. */
            return null;
        }

        let actorUpdate = {};
        newData = duplicate(originalData);

        let remainingUndealtDamage = totalDamageDealt;
        const hasDeflectorShields = starshipActor.data.data.hasDeflectorShields;
        const hasAblativeArmor = starshipActor.data.data.hasAblativeArmor;
        
        if (hasDeflectorShields) {
            if (originalData.shields.value > 0) {
                // Deflector shields are twice as effective against attacks from melee, ramming, and ripper starship weapons, so the starship ignores double the amount of damage from such attacks.
                // TODO: Any attack that would ignore a fraction or all of a target’s shields instead reduces the amount of damage the deflector shields ignore by an equal amount, rounded in the defender’s favor (e.g., deflector shields with a defense value of 5 would reduce damage from a burrowing weapon [Pact Worlds 153] by 3)
                const isMelee = roll.find('#melee').length > 0;
                const isRamming = roll.find('#ramming').length > 0;
                const isRipper = roll.find('#ripper').length > 0;

                const shieldMultiplier = (isMelee || isRamming || isRipper) ? 2 : 1;
                remainingUndealtDamage = Math.max(0, remainingUndealtDamage - (originalData.shields.value * shieldMultiplier));
            }
        } else {
            newData.shields.value = Math.max(0, originalData.shields.value - remainingUndealtDamage);
            remainingUndealtDamage = remainingUndealtDamage - (originalData.shields.value - newData.shields.value);
        }

        if (hasAblativeArmor) {
            newData.ablative.value = Math.max(0, originalData.ablative.value - remainingUndealtDamage);
            remainingUndealtDamage = remainingUndealtDamage - (originalData.ablative.value - newData.ablative.value);
        }

        const originalHullPoints = starshipActor.data.data.attributes.hp.value;
        const newHullPoints = Math.clamped(originalHullPoints - remainingUndealtDamage, 0, starshipActor.data.data.attributes.hp.max);
        remainingUndealtDamage = remainingUndealtDamage - (originalHullPoints - newHullPoints);

        /** Deflector shields only drop in efficiency when the ship takes hull point damage. */
        if (hasDeflectorShields) {
            let deflectorShieldDamage = 0;

            if (newHullPoints !== originalHullPoints) {
                deflectorShieldDamage = 1;

                // Weapons with the array or line special property that damage a starship’s Hull Points overwhelm its deflector shields, reducing their defense value in that quadrant by 2
                if (roll.find('#array').length > 0 || roll.find('#line').length > 0) {
                    deflectorShieldDamage = 2;
                }

                // TODO: ..whereas vortex weapons that deal Hull Point damage reduce the target’s deflector shields’ defense value in each quadrant by 1d4.
                else if (roll.find('#vortex').length > 0) {
                }
            }

            // Any successful attack by a weapon with the buster special property (or another special property that deals reduced damage to Hull Points) reduces the deflector shields’ defense value in the struck quadrant by 2, whether or not the attack damaged the target’s Hull Points.
            if (roll.find('#buster').length > 0) {
                deflectorShieldDamage = 2;
            }

            // When a gunnery check results in a natural 20, any decrease to the target’s deflector shield’s defense value from the attack is 1 greater.
            const isCritical = roll.find('#critical').length > 0;
            deflectorShieldDamage += isCritical ? 1 : 0;

            newData.shields.value = Math.max(0, newData.shields.value - deflectorShieldDamage);
        }

        if (originalData.shields.value !== newData.shields.value) {
            actorUpdate[targetKey + ".shields.value"] = newData.shields.value;
        }

        if (originalData.ablative.value !== newData.ablative.value) {
            actorUpdate[targetKey + ".ablative.value"] = newData.ablative.value;
        }

        if (newHullPoints !== originalHullPoints) {
            actorUpdate["data.attributes.hp.value"] = newHullPoints;
        }

        const originalCT = Math.floor((starshipActor.data.data.attributes.hp.max - originalHullPoints) / starshipActor.data.data.attributes.criticalThreshold.value);
        const newCT = Math.floor((starshipActor.data.data.attributes.hp.max - newHullPoints) / starshipActor.data.data.attributes.criticalThreshold.value);
        if (newCT > originalCT) {
            const crossedThresholds = newCT - originalCT;
            const warningMessage = game.i18n.format("SFRPG.StarshipSheet.Damage.CrossedCriticalThreshold", {name: starshipActor.name, crossedThresholds: crossedThresholds});
            ui.notifications.warn(warningMessage);
        }
     
        const promise = starshipActor.update(actorUpdate);
        return promise;
    }

    /**
     * Cause this Actor to take a Short 10 minute Rest
     * During a Short Rest resources and limited item uses may be recovered
     * @param {boolean} dialog  Present a dialog window which allows for spending Resolve Points as part of the Short Rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the short rest workflow has completed
     */
    async shortRest({ dialog = true, chat = true } = {}) {
        const data = this.data.data;

        // Ask user to confirm if they want to rest, and if they want to restore stamina points
        let sp = data.attributes.sp;
        let rp = data.attributes.rp;
        let canRestoreStaminaPoints = rp.value > 0 && sp.value < sp.max;

        let restoreStaminaPoints = false;

        if (dialog) {
            const restingResults = await ShortRestDialog.shortRestDialog({ actor: this, canRestoreStaminaPoints: canRestoreStaminaPoints });
            if (!restingResults.resting) return;
            restoreStaminaPoints = restingResults.restoreStaminaPoints;
        }
        
        let drp = 0;
        let dsp = 0;
        if (restoreStaminaPoints && canRestoreStaminaPoints) {
            drp = 1;
            let updatedRP = Math.max(rp.value - drp, 0);
            dsp = Math.min(sp.max - sp.value, sp.max);
            
            this.update({ "data.attributes.sp.value": sp.max, "data.attributes.rp.value": updatedRP });
        }

        // Restore resources that reset on short rests
        const updateData = {};
        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && r.sr) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }

        await this.update(updateData);

        // Reset items that restore their uses on a short rest
        const items = this.items.filter(item => item.data.data.uses && (item.data.data.uses.per === "sr"));
        const updateItems = items.map(item => {
            return {
                _id: item._id,
                "data.uses.value": item.data.data.uses.max
            }
        });

        await this.updateEmbeddedDocuments("Item", updateItems);

        // Notify chat what happened
        if (chat) {
            let msg = game.i18n.format("SFRPG.RestSChatMessage", { name: this.name });
            if (drp > 0) {
                msg = game.i18n.format("SFRPG.RestSChatMessageRestored", { name: this.name, spentRP: drp, regainedSP: dsp });
            }
            
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: msg,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }

        return {
            drp: drp,
            dsp: dsp,
            updateData: updateData,
            updateItems: updateItems
        }
    }

    /**
     * Cause this Actor to repair itself following drone repairing rules
     * During a drone repair, some amount of drone HP may be recovered.
     * @param {boolean} dialog  Present a dialog window which allows for utilizing the Repair Drone (Ex) feat while repairing.
     * @param {boolean} chat    Summarize the results of the repair workflow as a chat message
     * @return {Promise}        A Promise which resolves once the repair workflow has completed
     */
    async repairDrone({ dialog = true, chat = true } = {}) {
        const data = this.data.data;

        let hp = data.attributes.hp;
        if (hp.value >= hp.max) {
            let message = game.i18n.format("SFRPG.RepairDroneUnnecessary", { name: this.name });
            ui.notifications.info(message);
            return;
        }

        let improvedRepairFeat = false;
        if (dialog) {
            const dialogResults = await DroneRepairDialog.droneRepairDialog({ actor: this, improvedRepairFeat: improvedRepairFeat });
            if (!dialogResults.repairing) return;
            improvedRepairFeat = dialogResults.improvedRepairFeat;
        }
        
        let oldHP = hp.value;
        let maxRepairAmount = Math.floor(improvedRepairFeat ? hp.max * 0.25 : hp.max * 0.1);
        let newHP = Math.min(hp.max, hp.value + maxRepairAmount);
        let dhp = newHP - oldHP;

        const updateData = {};
        updateData["data.attributes.hp.value"] = newHP;
        await this.update(updateData);

        // Notify chat what happened
        if (chat) {
            let msg = game.i18n.format("SFRPG.RepairDroneChatMessage", { name: this.name, regainedHP: dhp });
            
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: msg,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }

        return {
            dhp: dhp,
            updateData: updateData
        };
    }

    async removeFromCrew(actorId) {
        const role = this.getCrewRoleForActor(actorId);
        if (role) {
            const crewData = duplicate(this.data.data.crew);
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
            return this.update({
                "data.crew": crewData
            });
        }
        return null;
    }

    /**
     * Take a long nights rest, recovering HP, SP, RP, resources, and spell slots
     * @param {boolean} dialog  Present a confirmation dialog window whether or not to take a long rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the long rest workflow has completed
     */
    async longRest({ dialog = true, chat = true } = {}) {
        const data = duplicate(this.data.data);
        const updateData = {};

        if (dialog) {
            try {
                await ShortRestDialog.longRestDialog(this);
            } catch (err) {
                return;
            }
        }

        // Recover HP, SP, and RP
        let dhp = data.attributes.hp.max === data.attributes.hp.value ? 0 :
            data.details.level.value > (data.attributes.hp.max - data.attributes.hp.value) ?
                data.attributes.hp.max - data.attributes.hp.value : data.details.level.value;
        let dsp = data.attributes.sp.max - data.attributes.sp.value;
        let drp = data.attributes.rp.max - data.attributes.rp.value;
        updateData['data.attributes.hp.value'] = Math.min(data.attributes.hp.value + data.details.level.value, data.attributes.hp.max);
        updateData['data.attributes.sp.value'] = data.attributes.sp.max;
        updateData['data.attributes.rp.value'] = data.attributes.rp.max;

        // Heal Ability damage
        for (let [abl, ability] of Object.entries(data.abilities)) {
            if (ability.damage && ability.damage > 0) {
                updateData[`data.abilities.${abl}.damage`] = --ability.damage;
            } 
        }

        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && (r.sr || r.lr)) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }

        for (let [k, v] of Object.entries(data.spells)) {
            if (!v.max) continue;
            updateData[`data.spells.${k}.value`] = v.max;
        }

        const items = this.items.filter(i => i.data.data.uses && ["sr", "lr", "day"].includes(i.data.data.uses.per));
        const updateItems = items.map(item => {
            return {
                _id: item._id,
                "data.uses.value": item.data.data.uses.max
            }
        });

        await this.update(updateData);
        await this.updateEmbeddedDocuments("Item", updateItems);

        if (chat) {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: `${this.name} takes a night's rest and recovers ${dhp} Hit points, ${dsp} Stamina points, and ${drp} Resolve points.`
            });
        }

        return {
            dhp: dhp,
            dsp: dsp,
            drp: drp,
            updateData: updateData,
            updateItems: updateItems
        }
    }

    /** Starship code */
    async useStarshipAction(actionId) {
        /** Bad entry; no action! */
        if (!actionId) {
            ui.notifications.error(game.i18n.format("SFRPG.Rolls.StarshipActions.ActionNotFoundError", {actionId: actionId}));
            return;
        }

        const starshipPackKey = game.settings.get("sfrpg", "starshipActionsSource");
        const starshipActions = game.packs.get(starshipPackKey);
        const actionEntryDocument = await starshipActions.getDocument(actionId);
        const actionEntry = actionEntryDocument.data;

        /** Bad entry; no action! */
        if (!actionEntry) {
            ui.notifications.error(game.i18n.format("SFRPG.Rolls.StarshipActions.ActionNotFoundError", {actionId: actionId}));
            return;
        }

        /** Bad entry; no formula! */
        if (actionEntry.data.formula.length < 1) {
            ui.notifications.error(game.i18n.format("SFRPG.Rolls.StarshipActions.NoFormulaError", {name: actionEntry.name}));
            return;
        }

        let quadrant = "";
        if (actionEntry.data.role === "gunner") {
            const options = [
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Forward"),
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Port"),
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Starboard"),
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Aft")
            ];
            const results = await ChoiceDialog.show(
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Title", {name: actionEntry.name}),
                game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Message"),
                {
                    quadrant: {
                        name: game.i18n.format("SFRPG.Rolls.StarshipActions.Quadrant.Quadrant"),
                        options: options,
                        default: options[0]
                    }
                }
            );

            if (results.resolution === 'cancel') {
                return;
            }

            const selectedOption = options.indexOf(results.result.quadrant);
            if (selectedOption === 1) {
                quadrant = "Port";
            } else if (selectedOption === 2) {
                quadrant = "Starboard";
            } else if (selectedOption === 3) {
                quadrant = "Aft";
            } else {
                quadrant = "Forward";
            }
        }

        let selectedFormula = actionEntry.data.formula[0];
        if (actionEntry.data.formula.length > 1) {
            const results = await ChoiceDialog.show(
                game.i18n.format("SFRPG.Rolls.StarshipActions.Choice.Title", {name: actionEntry.name}),
                game.i18n.format("SFRPG.Rolls.StarshipActions.Choice.Message", {name: actionEntry.name}),
                {
                    roll: {
                        name: game.i18n.format("SFRPG.Rolls.StarshipActions.Choice.AvailableRolls"),
                        options: actionEntry.data.formula.map(x => x.name),
                        default: actionEntry.data.formula[0].name
                    }
                }
            );

            if (results.resolution === 'cancel') {
                return;
            }

            selectedFormula = actionEntry.data.formula.find(x => x.name === results.result.roll);
        }

        const rollContext = new RollContext();
        rollContext.addContext("ship", this);
        rollContext.setMainContext("ship");

        this.setupRollContexts(rollContext, actionEntry.data.selectors || []);

        /** Create additional modifiers. */
        const additionalModifiers = [
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: "@ship.attributes.computer.value", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "4", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "2", enabled: false} },
            {bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "2", enabled: false} }
        ];
        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });

        let systemBonus = "";
        // Patch and Hold It Together are not affected by critical damage.
        if (actionEntry.name !== "Patch" && actionEntry.name !== "Hold It Together") {
            // Gunners must select a quadrant.
            if (actionEntry.data.role === "gunner") {
                systemBonus = ` + @ship.attributes.systems.weaponsArray${quadrant}.mod`;
                systemBonus += ` + @ship.attributes.systems.powerCore.modOther`;
            } else {
                for (const [key, value] of Object.entries(this.data.data.attributes.systems)) {
                    if (value.affectedRoles && value.affectedRoles[actionEntry.data.role]) {
                        if (key === "powerCore" && actionEntry.data.role !== "engineer") {
                            systemBonus += ` + @ship.attributes.systems.${key}.modOther`;
                        } else {
                            systemBonus += ` + @ship.attributes.systems.${key}.mod`;
                        }
                    }
                }
            }
        }

        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            rollFormula: selectedFormula.formula + systemBonus + " + @additional.modifiers.bonus",
            title: game.i18n.format("SFRPG.Rolls.StarshipAction", {action: actionEntry.name})
        });

        if (!rollResult) {
            return;
        }

        let speakerActor = this;
        const roleKey = CONFIG.SFRPG.starshipRoleNames[actionEntry.data.role];
        let roleName = game.i18n.format(roleKey);

        const desiredKey = actionEntry.data.selectorKey;
        if (desiredKey) {
            const selectedContext = rollContext.allContexts[desiredKey];
            if (!selectedContext) {
                ui.notifications.error(game.i18n.format("SFRPG.Rolls.StarshipActions.NoActorError", {name: desiredKey}));
                return;
            }

            speakerActor = selectedContext?.entity || this;

            const actorRole = this.getCrewRoleForActor(speakerActor.id);
            if (actorRole) {
                const actorRoleKey = CONFIG.SFRPG.starshipRoleNames[actorRole];
                roleName = game.i18n.format(actorRoleKey);
            }
        }

        let flavor = "";
        flavor += game.i18n.format("SFRPG.Rolls.StarshipActions.Chat.Role", {role: roleName, name: this.name});
        flavor += "<br/>";
        if (actionEntry.data.formula.length <= 1) {
            flavor += `<h2>${actionEntry.name}</h2>`;
        } else {
            flavor += `<h2>${actionEntry.name} (${selectedFormula.name})</h2>`;
        }

        const dc = selectedFormula.dc || actionEntry.data.dc;
        if (dc) {
            if (dc.resolve) {
                const dcRoll = await DiceSFRPG.createRoll({
                    rollContext: rollContext,
                    rollFormula: dc.value,
                    mainDie: 'd0',
                    title: game.i18n.format("SFRPG.Rolls.StarshipAction", {action: actionEntry.name}),
                    dialogOptions: { skipUI: true }
                });

                flavor += `<p><strong>${game.i18n.format("SFRPG.Rolls.StarshipActions.Chat.DC")}: </strong>${dcRoll.roll.total}</p>`;
            } else {
                flavor += `<p><strong>${game.i18n.format("SFRPG.Rolls.StarshipActions.Chat.DC")}: </strong>${TextEditor.enrichHTML(dc.value)}</p>`;
            }
        }

        flavor += `<p><strong>${game.i18n.format("SFRPG.Rolls.StarshipActions.Chat.NormalEffect")}: </strong>`;
        flavor += TextEditor.enrichHTML(selectedFormula.effectNormal || actionEntry.data.effectNormal);
        flavor += "</p>";

        if (actionEntry.data.effectCritical) {
            const critEffectDisplayState = game.settings.get("sfrpg", "starshipActionsCrit");
            if (critEffectDisplayState !== 'never') {
                if (critEffectDisplayState === 'always' || rollResult.roll.dice[0].values[0] === 20) {
                    flavor += `<p><strong>${game.i18n.format("SFRPG.Rolls.StarshipActions.Chat.CriticalEffect")}: </strong>`;
                    flavor += TextEditor.enrichHTML(selectedFormula.effectCritical || actionEntry.data.effectCritical);
                    flavor += "</p>";
                }
            }
        }

        const rollMode = game.settings.get("core", "rollMode");
        const preparedRollExplanation = DiceSFRPG.formatFormula(rollResult.formula.formula);
        rollResult.roll.render().then((rollContent) => {
            const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
            const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);
    
            ChatMessage.create({
                flavor: flavor,
                speaker: ChatMessage.getSpeaker({ actor: speakerActor }),
                content: explainedRollContent,
                rollMode: rollMode,
                roll: rollResult.roll,
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                sound: CONFIG.sounds.dice
            });
        });
    }

    /** Crewed actor functionality */
    getCrewRoleForActor(actorId) {
        const dataSource = this.data;
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(dataSource.type)) {
            console.log(`getCrewRoleForActor(${actorId}) called on an actor (${dataSource.id}) of type ${dataSource.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!dataSource?.data?.crew) {
            return null;
        }

        for (const [role, entry] of Object.entries(dataSource.data.crew)) {
            if (entry?.actorIds?.includes(actorId)) {
                return role;
            }
        }
        return null;
    }

    getActorIdsForCrewRole(role) {
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(this.data.type)) {
            console.log(`getActorIdsForCrewRole(${role}) called on an actor (${this.data.id}) of type ${this.data.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!this.data?.data?.crew) {
            return null;
        }

        if (!(role in this.data.data.crew)) {
            return null;
        }

        return duplicate(this.data.data.crew[role]);
    }

    /** Roll contexts */
    setupRollContexts(rollContext, desiredSelectors = []) {
        if (!this.data) {
            return;
        }

        const actorData = this.data;
        if (actorData.type === "vehicle") {
            if (!actorData.data.crew.useNPCCrew) {
                /** Add player pilot if available. */
                if (actorData.data.crew.pilot?.actors?.length > 0) {
                    const pilotActor = actorData.data.crew.pilot.actors[0];
                    let pilotData = null;
                    if (actor instanceof ActorSFRPG) {
                        pilotData = pilotActor.data.data;
                    } else {
                        pilotData = pilotActor.data;
                    }
                    rollContext.addContext("pilot", actor, pilotData);
                }
            }
        }
        else if (actorData.type === "starship") {
            if (!actorData.data.crew.useNPCCrew) {
                /** Add player captain if available. */
                if (actorData.data.crew.captain?.actors?.length > 0) {
                    const actor = actorData.data.crew.captain.actors[0];
                    let crewActorData = null;
                    if (actor instanceof ActorSFRPG) {
                        crewActorData = actor.data.data;
                    } else {
                        crewActorData = actor.data;
                    }
                    rollContext.addContext("captain", actor, crewActorData);
                }
        
                /** Add player pilot if available. */
                if (actorData.data.crew.pilot?.actors?.length > 0) {
                    const actor = actorData.data.crew.pilot.actors[0];
                    let crewActorData = null;
                    if (actor instanceof ActorSFRPG) {
                        crewActorData = actor.data.data;
                    } else {
                        crewActorData = actor.data;
                    }
                    rollContext.addContext("pilot", actor, crewActorData);
                }
        
                /** Add remaining roles if available. */
                const crewMates = ["gunner", "engineer", "chiefMate", "magicOfficer", "passenger", "scienceOfficer", "minorCrew", "openCrew"];
                const allCrewMates = ["minorCrew", "openCrew"];
                for (const crewType of crewMates) {
                    let crewCount = 1;
                    const crew = [];
                    if (allCrewMates.includes(crewType)) {
                        for (const crewEntries of Object.values(actorData.data.crew)) {
                            const crewList = crewEntries.actors;
                            if (crewList && crewList.length > 0) {
                                for (const actor of crewList) {
                                    let crewActorData = null;
                                    if (actor instanceof ActorSFRPG) {
                                        crewActorData = actor.data.data;
                                    } else {
                                        crewActorData = actor.data;
                                    }

                                    const contextId = crewType + crewCount;
                                    rollContext.addContext(contextId, actor, crewActorData);
                                    crew.push(contextId);
                                    crewCount += 1;
                                }
                            }
                        }
                    } else {
                        const crewList = actorData.data.crew[crewType].actors;
                        if (crewList && crewList.length > 0) {
                            for (const actor of crewList) {
                                let crewActorData = null;
                                if (actor instanceof ActorSFRPG) {
                                    crewActorData = actor.data.data;
                                } else {
                                    crewActorData = actor.data;
                                }

                                const contextId = crewType + crewCount;
                                rollContext.addContext(contextId, actor, crewActorData);
                                crew.push(contextId);
                                crewCount += 1;
                            }
                        }
                    }
        
                    if (desiredSelectors.includes(crewType)) {
                        rollContext.addSelector(crewType, crew);
                    }
                }
            } else {
                /** Create 'fake' actors. */
                rollContext.addContext("captain", this, actorData.data.crew.npcData.captain);
                rollContext.addContext("pilot", this, actorData.data.crew.npcData.pilot);
                rollContext.addContext("gunner", this, actorData.data.crew.npcData.gunner);
                rollContext.addContext("engineer", this, actorData.data.crew.npcData.engineer);
                rollContext.addContext("chiefMate", this, actorData.data.crew.npcData.chiefMate);
                rollContext.addContext("magicOfficer", this, actorData.data.crew.npcData.magicOfficer);
                rollContext.addContext("scienceOfficer", this, actorData.data.crew.npcData.scienceOfficer);
            }
        }
    }
}
