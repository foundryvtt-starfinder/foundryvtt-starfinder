import { SFRPG } from "../config.js"
import { DiceSFRPG } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";
import { Mix } from "../utils/custom-mixer.js";
import { ActorConditionsMixin } from "./mixins/actor-conditions.js";
import { ActorCrewMixin } from "./mixins/actor-crew.js";
import { ActorInventoryMixin } from "./mixins/actor-inventory.js";
import { ActorModifiersMixin } from "./mixins/actor-modifiers.js";
import { ActorResourcesMixin } from "./mixins/actor-resources.js";
import { ActorRestMixin } from "./mixins/actor-rest.js";
import { ChoiceDialog } from "../apps/choice-dialog.js";
import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
import { AddEditSkillDialog } from "../apps/edit-skill-dialog.js";
import { NpcSkillToggleDialog } from "../apps/npc-skill-toggle-dialog.js";

import { } from "./crew-update.js"
import { ItemSheetSFRPG } from "../item/sheet.js";
import { ItemSFRPG } from "../item/item.js";
import { hasDiceTerms } from "../utilities.js";

/**
 * A data structure for storing damage statistics.
 * 
 * @typedef {Object} DamagePart
 * @property {string}                     formula  The roll formula to use.
 * @property {{[key: string]: boolean}}   types    A set of key value pairs that determines the available damage types.
 * @property {string}                     operator An operator that determines how damage is split between multiple types.
 */

/**
 * Extend the base :class:`Actor` to implement additional logic specialized for SFRPG
 */
export class ActorSFRPG extends Mix(Actor).with(ActorConditionsMixin, ActorCrewMixin, ActorInventoryMixin, ActorModifiersMixin, ActorResourcesMixin, ActorRestMixin) {

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
        const actorResources = items.filter(item => item.type === "actorResource");
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
            frames,
            actorResources
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

        let spellLevel = item.data.data.level;
        const usesSlots = (spellLevel > 0) && item.data.data.preparation.mode === "";
        if (!usesSlots) {
            return item.roll();
        }

        let consumeSpellSlot = true;
        let selectedSlot = null;
        if (configureDialog) {
            try {
                const dialogResponse = await SpellCastDialog.create(this, item);
                const slotIndex = parseInt(dialogResponse.formData.get("level"));
                consumeSpellSlot = Boolean(dialogResponse.formData.get("consume"));
                selectedSlot = dialogResponse.spellLevels[slotIndex];
                spellLevel = parseInt(selectedSlot.level);

                if (spellLevel !== item.data.data.level && item.data.data.level > spellLevel) {
                    const newItemData = duplicate(item.data);
                    newItemData.data.level = spellLevel;

                    item = new ItemSFRPG(newItemData, {parent: this});
                    
                    // Run automation to ensure save DCs are correct.
                    item.prepareData();
                    const processContext = await item.processData();
                    if (processContext.fact.promises) {
                        await Promise.all(processContext.fact.promises);
                    }
                }
            } catch (error) {
                console.error(error);
                return null;
            }
        }

        if (consumeSpellSlot && (spellLevel > 0)) {

            if (selectedSlot) {
                if (selectedSlot.source === "general") {
                    await this.update({
                        [`data.spells.spell${spellLevel}.value`]: Math.max(parseInt(this.data.data.spells[`spell${spellLevel}`].value) - 1, 0)
                    });
                } else {
                    const selectedLevel = selectedSlot.level;
                    const selectedClass = selectedSlot.source;

                    await this.update({
                        [`data.spells.spell${selectedLevel}.perClass.${selectedClass}.value`]: Math.max(parseInt(this.data.data.spells[`spell${spellLevel}`].perClass[selectedClass].value) - 1, 0)
                    });
                }
            }
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

        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);

        //Include ability check bonus only if it's not 0
        if(abl.abilityCheckBonus) {
            parts.push('@abilityCheckBonus');
            data.abilityCheckBonus = abl.abilityCheckBonus;
        }
        parts.push(`@abilities.${abilityId}.mod`);

        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title:  game.i18n.format("SFRPG.Rolls.Dice.AbilityCheckTitle", {label: label}),
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
    rollSave(saveId, options = {}) {
        const label = CONFIG.SFRPG.saves[saveId];
        const save = this.data.data.attributes[saveId];

        let parts = [];
        let data = this.getRollData();

        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);

        parts.push(`@attributes.${saveId}.bonus`);

        return DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title: game.i18n.format("SFRPG.Rolls.Dice.SaveTitle", {label: label}),
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

        const rollContext = new RollContext();
        rollContext.addContext("main", this, data);
        rollContext.setMainContext("main");

        this.setupRollContexts(rollContext);

        parts.push(`@skills.${skillId}.mod`);
        
        return await DiceSFRPG.d20Roll({
            event: options.event,
            rollContext: rollContext,
            parts: parts,
            title: game.i18n.format("SFRPG.Rolls.Dice.SkillCheckTitle", {skill: CONFIG.SFRPG.skills[skillId.substring(0, 3)]}),
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
            title: game.i18n.format("SFRPG.Rolls.Dice.SkillCheckTitle", {skill: CONFIG.SFRPG.skills["pil"]}),
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
        const diceTotal = html.find('.sfrpg.dice-roll').data("sfrpgDiceTotal");
        const totalDamageDealt = Math.floor((diceTotal ?? Math.floor(parseFloat(html.find('.dice-total').text()))) * multiplier);
        const isHealing = (multiplier < 0);
        const promises = [];
        for (const controlledToken of canvas.tokens?.controlled) {
            let promise = null;
            const actor = controlledToken.actor;
            if (actor.data.type === "starship") {
                promise = actor._applyStarshipDamage(html, totalDamageDealt, isHealing);
            } else if (actor.data.type === "vehicle") {
                promise = actor._applyVehicleDamage(html, totalDamageDealt, isHealing);
            } else {
                promise = actor._applyActorDamage(html, totalDamageDealt, isHealing);
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
     * @param {Roll} roll The Roll object representing the roll data.
     * @param {Number} multiplier A number that is used to change the damage value.
     */
    async applyDamage(roll, multiplier) {
        const totalDamageDealt = roll.total;
        const isHealing = (multiplier < 0);

        switch (this.data.type) {
            case 'starship':
                await this._applyStarshipDamage(roll, totalDamageDealt, isHealing);
                break;
            case 'vehicle':
                await this._applyVehicleDamage(roll, totalDamageDealt, isHealing);
                break;
            default:
                await this._applyActorDamage(roll, totalDamageDealt, isHealing);
                break;
        }
    }

    /**
     * Apply damage to an Actor.
     * 
     * @param {JQuery|Roll} htmlOrRoll The html for the chat card or a Roll object
     * @param {number} totalDamageDealt The total damage being dealt
     * @param {boolean} isHealing Is this actualy a healing affect
     * @returns A Promise that resolves to the updated Actor
     */
    async _applyActorDamage(htmlOrRoll, totalDamageDealt, isHealing) {
        let remainingUndealtDamage = totalDamageDealt;
        const actorUpdate = {};
        const actorData = foundry.utils.duplicate(this.data.data);
        
        /** Update temp hitpoints */
        if (!isHealing) {
            const originalTempHP = parseInt(actorData.attributes.hp.temp) || 0;
            let newTempHP = Math.clamped(originalTempHP - remainingUndealtDamage, 0, actorData.attributes.hp.tempmax);
            remainingUndealtDamage = remainingUndealtDamage - (originalTempHP - newTempHP);

            if (newTempHP <= 0) {
                newTempHP = null;
                actorUpdate['data.attributes.hp.tempmax'] = null;
            }
            
            actorUpdate["data.attributes.hp.temp"] = newTempHP;
        }

        /** Update stamina points */
        if (!isHealing) {
            const originalSP = actorData.attributes.sp.value;
            const newSP = Math.clamped(originalSP - remainingUndealtDamage, 0, actorData.attributes.sp.max);
            remainingUndealtDamage = remainingUndealtDamage - (originalSP - newSP);
            
            actorUpdate["data.attributes.sp.value"] = newSP;
        }

        /** Update hitpoints */
        const originalHP = actorData.attributes.hp.value;
        const newHP = Math.clamped(originalHP - remainingUndealtDamage, 0, actorData.attributes.hp.max);
        remainingUndealtDamage = remainingUndealtDamage - (originalHP - newHP);
        
        actorUpdate["data.attributes.hp.value"] = newHP;

        const promise = this.update(actorUpdate);

        /** If the remaining undealt damage is equal to or greater than the max hp, the character dies of Massive Damage. */
        if (this.data.type === "character" && remainingUndealtDamage >= actorData.attributes.hp.max) {
            const localizedDeath = game.i18n.format("SFRPG.CharacterSheet.Warnings.DeathByMassiveDamage", {name: this.name});
            ui.notifications.warn(localizedDeath, {permanent: true});
        }
    
        return promise;
    }

    /**
     * Checks whether an acotr is immune to a specific damage type.
     * 
     * @param {string} damageType The damage type to evaluate.
     * @returns True if the actor is immune to this damage type
     */
    isImmuneToDamageType(damageType) {
        return this.data.data.traits.di.value.includes(damageType);
    }

    /**
     * Apply any damage vulnerabilites to the supplied damage type.
     * 
     * @param {number} damageBeingApplied The damage of the supplied type that will be increased if this actor has a vulnerability to it.
     * @param {string} damageType The damage type being evaluated.
     * @returns The amount of damage being added by the vulnerability.
     */
    _applyVulnerabilities(damageBeingApplied, damageType) {
        if (this.data.data.traits.dv.value.includes(damageType))
            return Math.floor(damageBeingApplied * 0.5);
            
        return 0;
    }

    /**
     * Apply any energy resistance to the supplied damage type.
     * 
     * @param {number} damageBeingApplied The damage of the supplied type that will be negated if this actor has a resistance to it.
     * @param {string} damageType The damage type being evaluated.
     * @returns The amount of damage that is being negated if this actor has resistance to this damage type.
     */
    _applyEnergyResistances(damageBeingApplied, damageType) {
        const energyResistances = this.data.data.traits.dr.value;
        if (energyResistances.length > 0 && !["bludgeoning", "piercing", "slashing"].includes(damageType)) {
            let resistedDamage = 0;
            for (const resistance of energyResistances) {
                if (resistance[damageType]) {
                    resistedDamage += resistance[damageType];
                }
            }

            return Math.min(damageBeingApplied, resistedDamage);
        }

        return 0;
    }
    
    /**
     * Applies any damage reduction that this actor might have on the supplied damage type.
     * 
     * @param {number} damageBeingApplied The amount of damage being negated if this actor has damage reduction.
     * @param {string} damageType The damage type being evaluated.
     * @returns The amount of damage being negated by damage reduction.
     */
    async _applyDamageReduction(damageBeingApplied, damageType) {
        const damageReduction = this.data.data.traits.damageReduction;
        if (damageReduction.value && ["bludgeoning", "piercing", "slashing"].includes(damageType)) {
            // NOTE: We have a cunumdrum here. The negation of damage reduction is fairly complex.
            // We could probably have a complex set of Regular expressions designed to filter out
            // all of the various negation effects, but applying them consistently is cumbersome at best.
            // My belief is that it's better to prompt the user to say yay or nay on whether the damage reduction
            // is negated or not.
            let isNegated = false;
            if (damageReduction.negatedBy?.trim() !== "") {
                let content = `<p>${game.i18n.format("Damage reduction is negated by {negatedBy} for this actor. Should this reduction be negated?", { negatedBy: damageReduction.negatedBy })}</p>`;
                isNegated = await Dialog.confirm({
                    title: game.i18n.localize("Negate Damage Reduction?"),
                    content: content,
                    defaultYes: false
                });
            }

            if (isNegated) return 0;

            let reducedDamage = parseFloat(damageReduction.value);

            return Math.min(damageBeingApplied, reducedDamage);
        }

        return 0;
    }

    async _applyVehicleDamage(roll, totalDamageDealt, isHealing) {
        ui.notifications.warn("Cannot currently apply damage to vehicles using the context menu");
        return null;
    }

    async _applyStarshipDamage(roll, totalDamageDealt, isHealing) {
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
            game.i18n.format("SFRPG.StarshipSheet.Damage.Title", {name: this.name}),
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
            originalData = this.data.data.quadrants.forward;
        } else if (indexOfQuadrant === 1) {
            targetKey = "data.quadrants.port";
            originalData = this.data.data.quadrants.port;
        } else if (indexOfQuadrant === 2) {
            targetKey = "data.quadrants.starboard";
            originalData = this.data.data.quadrants.starboard;
        } else if (indexOfQuadrant === 3) {
            targetKey = "data.quadrants.aft";
            originalData = this.data.data.quadrants.aft;
        } else {
            /** Error, unrecognized quadrant, somehow. */
            return null;
        }

        let actorUpdate = {};
        newData = duplicate(originalData);

        let remainingUndealtDamage = totalDamageDealt;
        const hasDeflectorShields = this.data.data.hasDeflectorShields;
        const hasAblativeArmor = this.data.data.hasAblativeArmor;
        
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

        const originalHullPoints = this.data.data.attributes.hp.value;
        const newHullPoints = Math.clamped(originalHullPoints - remainingUndealtDamage, 0, this.data.data.attributes.hp.max);
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

        const originalCT = Math.floor((this.data.data.attributes.hp.max - originalHullPoints) / this.data.data.attributes.criticalThreshold.value);
        const newCT = Math.floor((this.data.data.attributes.hp.max - newHullPoints) / this.data.data.attributes.criticalThreshold.value);
        if (newCT > originalCT) {
            const crossedThresholds = newCT - originalCT;
            const warningMessage = game.i18n.format("SFRPG.StarshipSheet.Damage.CrossedCriticalThreshold", {name: this.name, crossedThresholds: crossedThresholds});
            ui.notifications.warn(warningMessage);
        }
     
        const promise = this.update(actorUpdate);
        return promise;
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
        const rollContent = await rollResult.roll.render({ breakdown: preparedRollExplanation });

        ChatMessage.create({
            flavor: flavor,
            speaker: ChatMessage.getSpeaker({ actor: speakerActor }),
            content: rollContent,
            rollMode: rollMode,
            roll: rollResult.roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: CONFIG.sounds.dice
        });
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
                    if (pilotActor instanceof ActorSFRPG) {
                        pilotData = pilotActor.data.data;
                    } else {
                        pilotData = pilotActor.data;
                    }
                    rollContext.addContext("pilot", pilotActor, pilotData);
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

Hooks.on("afterClosureProcessed", (closureName, fact) => {
    if (closureName == "process-actors") {
        for (const item of fact.actor.items) {
            item.processData();
        }
    }
});
