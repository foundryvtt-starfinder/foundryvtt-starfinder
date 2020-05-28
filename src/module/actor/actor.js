import { DiceStarfinder } from "../dice.js";
import { ShortRestDialog } from "../apps/short-rest.js";
import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
import { AddEditSkillDialog } from "../apps/edit-skill-dialog.js";
import { NpcSkillToggleDialog } from "../apps/npc-skill-toggle-dialog.js";

/**
 * Extend the base :class:`Actor` to implement additional logic specialized for Starfinder
 */
export class ActorStarfinder extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();
        data.classes = this.data.items.reduce((obj, i) => {
            if (i.type === "class") {
                obj[i.name.slugify({replacement: "_", strict: true})] = i.data;
            }
            return obj;
        }, {});

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
        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        if (actorData.type === "npc") {
            this._prepareNPCData(data);
            return;
        }
        else if (actorData.type === "starship") {
            this._prepareStarshipData(data);
            return;
        } else if (actorData.type === "vehicle") {
            this._prepareVehicleData(data);
            return;
        }

        const items = actorData.items;
        const armor = items.find(item => item.type === "equipment" && item.data.equipped);
        const classes = items.filter(item => item.type === "class");

        game.starfinder.engine.process("process-pc", {
            data,
            armor,
            classes,
            flags
        });

        this._preparePCSkills(data);
    }

    /**
     * Check to ensure that this actor has the modifiers flag set, if not then set it. 
     * These will always be needed from hence forth, so we'll just make sure that they always exist.
     * 
     * @param {Object} flags The actor flags to check against.
     */
    _ensureHasModifiersFlag(flags) {
        // if (!hasProperty(flags, "starfinder")) {
        //     console.log(`Starfinder | ${this.name} does not have any starfinder flags, attempting to create them...`);
        //     const updateData = duplicate(flags);
        //     console.log(updateData);
        //     this.update({'flags.starfinder': {}});
        // }
        // if (hasProperty(flags, 'starfinder') && !hasProperty(flags, "starfinder.modifiers")) {
        //     // this.setFlag('starfinder', 'modifiers', []).then(entity => console.log(entity));
        // }
    }

    /**
     * Calculate the ability modifer for each ability.
     * @param {Object} data The Actor's data
     */
    _prepareAbilities(data) {
        game.starfinder.engine.process("process-base-ability-modifiers", {data});
    }

    /**
     * Process skills for player character's.
     * 
     * @param {Object} data The actor's data
     */
    _preparePCSkills(data) {
        // TODO: Transition this over to the new rules engine
        // once the modifier system is in place.
        const actorData = this.data;
        const flags = actorData.flags;
        const items = actorData.items;
        const armor = items.find(item => item.type === "equipment" && item.data.equipped);

        // All of the relevent flags that modify skill bonuses
        let flatAffect = getProperty(flags, "starfinder.flatAffect") ? -2 : 0;
        let historian = getProperty(flags, "starfinder.historian") ? 2 : 0;
        let naturalGrace = getProperty(flags, "starfinder.naturalGrace") ? 2 : 0;
        let cultrualFascination = getProperty(flags, "starfinder.culturalFascination") ? 2 : 0;
        let armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;
        let scrounger = getProperty(flags, "starfinder.scrounger") ? 2 : 0;
        let elvenMagic = getProperty(flags, "starfinder.elvenMagic") ? 2 : 0;
        let keenSenses = getProperty(flags, "starfinder.keenSenses") ? 2 : 0;
        let curious = getProperty(flags, "starfinder.curious") ? 2 : 0;
        let intimidating = getProperty(flags, "starfinder.intimidating") ? 2 : 0;
        let selfSufficient = getProperty(flags, "starfinder.selfSufficient") ? 2 : 0;
        let sneaky = getProperty(flags, "starfinder.sneaky") ? 2 : 0;
        let sureFooted = getProperty(flags, "starfinder.sureFooted") ? 2 : 0;

        // Skills
        for (let [skl, skill] of Object.entries(data.skills)) {
            let accumulator = 0;
             // Specific skill modifiers
             switch (skl) {
                case "acr":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "ath":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "cul":
                    accumulator += historian;
                    accumulator += cultrualFascination;
                    accumulator += curious;
                    break;
                case "dip":
                    accumulator += cultrualFascination;
                    break;
                case "eng":
                    accumulator += scrounger;
                    break;
                case "int":
                    accumulator += intimidating;
                    break;
                case "mys":
                    accumulator += elvenMagic;
                    break;
                case "per":
                    accumulator += keenSenses;
                    break;
                case "sen":
                    accumulator += flatAffect;
                    break;
                case "ste":
                    accumulator += scrounger;
                    accumulator += sneaky;
                    break;
                case "sur":
                    accumulator += scrounger;
                    accumulator += selfSufficient;
                    break;
            }

            skill.value = parseFloat(skill.value || 0);
            let classSkill = skill.value;
            let hasRanks = skill.ranks > 0;
            let acp = armor && armor.data.armor.acp < 0 && skill.hasArmorCheckPenalty ? armor.data.armor.acp : 0;
            if (acp < 0 && armorSavant > 0) acp = Math.min(acp + armorSavant, 0);
            skill.mod = data.abilities[skill.ability].mod + acp + skill.ranks + (hasRanks ? classSkill : 0) + skill.misc + accumulator;
        }
    }

    /**
     * Prepare a starship's data
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareStarshipData(data) {
        game.starfinder.engine.process("process-starship", {data});
    }

    /**
     * Prepare a vechile's data
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareVehicleData(data) {
        // TODO: Actually do stuff here.
    }

    /**
     * Prepare the NPC's data.
     * 
     * NPC's are a little more free form in their data. They generaly don't follow the
     * same character creation rules that PC's do, so there stats don't need as much 
     * automation.
     * 
     * @param {Object} data The NPC's data to prepare
     * @private
     */
    _prepareNPCData(data) {
        // NOTE: I've pretty much removed all of the automated 
        // calculations from NPC's.
        data.details.xp.value = this.getCRExp(data.details.cr);

        // CMD or AC Vs Combat Maneuvers as it's called in starfinder
        data.attributes.cmd.value = 8 + data.attributes.kac.value;
    }

    /**
     * Return the amount of experience granted by killing a creature of a certain CR.
     * 
     * @param {Number} cr The creature's challenge rating
     * @returns {Number} The amount of experience granted per kill
     */
    getCRExp(cr) {
        if (cr < 1.0) {
            if (cr === (1 / 3)) {
                return 135;
            } else if (cr === (1 / 6)) {
                return 65;
            }

            return Math.max(400 * cr, 50);
        }
        return CONFIG.STARFINDER.CR_EXP_LEVELS[cr];
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
            let size = CONFIG.STARFINDER.tokenSizes[data['data.traits.size']];
            if (this.isToken) this.token.update({ height: size, width: size });
            else if (!data["token.width"] && !hasProperty(data, "token.width")) {
                setProperty(data, 'token.height', size);
                setProperty(data, 'token.width', size);
            }
        }

        return super.update(data, options);
    }

    /**
     * Extend OwnedItem creation logic for the Starfinder system to make weapons proficient by default when dropped on a NPC sheet
     * See the base Actor class for API documentation of this method
     * 
     * @param {String} embeddedName The type of Entity being embedded.
     * @param {Object} itemData The data object of the item
     * @param {Object} options Any options passed in
     * @returns {Promise}
     */
    async createEmbeddedEntity(embeddedName, itemData, options) {
        if (!this.isPC) {
            let t = itemData.type;
            let initial = {};
            if (t === "weapon") initial['data.proficient'] = true;
            if (["weapon", "equipment"].includes(t)) initial['data.equipped'] = true;
            if (t === "spell") initial['data.prepared'] = true;
            mergeObject(itemData, initial);
        }

        return super.createEmbeddedEntity(embeddedName, itemData, options);
    }

    async useSpell(item, { configureDialog = true } = {}) {
        if (item.data.type !== "spell") throw new Error("Wrong item type");

        let lvl = item.data.data.level;
        const usesSlots = (lvl > 0) && item.data.data.preparation.mode === "";
        if (!usesSlots) return item.roll();

        let consume = true;
        if (configureDialog) {
            const spellFormData = await SpellCastDialog.create(this, item);
            lvl = parseInt(spellFormData.get("level"));
            consume = Boolean(spellFormData.get("consume"));
            if (lvl !== item.data.data.level) {
                item = item.constructor.createOwned(mergeObject(item.data, { "data.level": lvl }, { inplace: false }), this);
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
        const formData = await AddEditSkillDialog.create(skillId, skill, true, isNpc),
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

        const formData = await AddEditSkillDialog.create(skillId, skill, false),
            isTrainedOnly = Boolean(formData.get('isTrainedOnly')),
            hasArmorCheckPenalty = Boolean(formData.get('hasArmorCheckPenalty')),
            value = Boolean(formData.get('value')) ? 3 : 0,
            misc = Number(formData.get('misc')),
            ranks = Number(formData.get('ranks')),
            ability = formData.get('ability'),
            subname = formData.get('subname');

        return this.update({
            [`data.skills.${skillId}`]: {},
            [`data.skills.${skillId}.isTrainedOnly`]: isTrainedOnly,
            [`data.skills.${skillId}.hasArmorCheckPenalty`]: hasArmorCheckPenalty,
            [`data.skills.${skillId}.value`]: value,
            [`data.skills.${skillId}.misc`]: misc,
            [`data.skills.${skillId}.ranks`]: ranks,
            [`data.skills.${skillId}.ability`]: ability,
            [`data.skills.${skillId}.subname`]: subname
        });
    }

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {Object} options      Options which configure how the skill check is rolled
     */
    rollSkill(skillId, options = {}) {
        const skl = this.data.data.skills[skillId];

        if (!this.isPC) {
            this.rollSkillCheck(skillId, skl, options);
            return;
        }

        if (skl.isTrainedOnly && !(skl.ranks > 0)) {
            let content = `${CONFIG.STARFINDER.skills[skillId.substring(0, 3)]} is a trained only skill, but ${this.name} is not trained in that skill.
                Would you like to roll anyway?`;

            new Dialog({
                title: `${CONFIG.STARFINDER.skills[skillId.substring(0, 3)]} is trained only`,
                content: content,
                buttons: {
                    yes: {
                        label: "Yes",
                        callback: () => this.rollSkillCheck(skillId, skl, options)
                    },
                    cancel: {
                        label: "No"
                    }
                },
                default: "cancel"
            }).render(true);
        } else {
            this.rollSkillCheck(skillId, skl, options);
        }
    }

    /**
     * Roll a generic ability test.
     * 
     * @param {String} abilityId The ability id (e.g. "str")
     * @param {Object} options Options which configure how ability tests are rolled
     */
    rollAbility(abilityId, options = {}) {
        const label = CONFIG.STARFINDER.abilities[abilityId];
        const abl = this.data.data.abilities[abilityId];

        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mod: abl.mod },
            title: `${label} Ability Check`,
            speaker: ChatMessage.getSpeaker({ actor: this })
        });
    }

    /**
     * Roll a save check
     * 
     * @param {String} saveId The save id (e.g. "will")
     * @param {Object} options Options which configure how saves are rolled
     */
    rollSave(saveId, options = {}) {
        const label = CONFIG.STARFINDER.saves[saveId];
        const save = this.data.data.attributes[saveId];

        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mod: save.bonus },
            title: `${label} Save`,
            speaker: ChatMessage.getSpeaker({ actor: this })
        });
    }

    rollSkillCheck(skillId, skill, options = {}) {
        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mod: skill.mod },
            title: `${CONFIG.STARFINDER.skills[skillId.substring(0, 3)]} Skill Check`,
            speaker: ChatMessage.getSpeaker({ actor: this })
        });
    }

    static async applyDamage(roll, multiplier) {
        let value = Math.floor(parseFloat(roll.find('.dice-total').text()) * multiplier);
        const promises = [];
        for (let t of canvas.tokens.controlled) {
            if (t.actor.data.type === "starship") {
                ui.notifications.warn("Cannot currently apply damage to starships using the context menu");
                continue;
            } else if (t.actor.data.type === "vehicle") {
                ui.notifications.warn("Cannot currently apply damage to vehicles using the context menu");
                continue;
            }

            let a = t.actor,
                hp = a.data.data.attributes.hp,
                sp = a.data.data.attributes.sp,
                tmp = parseInt(hp.temp) | 0,
                dt = value > 0 ? Math.min(tmp, value) : 0,
                tmpd = tmp - dt,
                // stamina doesn't get healed like hit points do, so skip it if we're appling 
                // healing instead of damage.
                spd = value > 0 ? Math.clamped(sp.value - (value - dt), 0, sp.max) : sp.value;

            dt = value > 0 ? value - Math.clamped((value - dt) - sp.value, 0, value) : 0;

            let hpd = Math.clamped(hp.value - (value - dt), 0, hp.max);

            promises.push(t.actor.update({
                "data.attributes.hp.temp": tmpd,
                "data.attributes.sp.value": spd,
                "data.attributes.hp.value": hpd
            }));
        }

        return Promise.all(promises);
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

        const rp0 = data.attributes.rp.value;
        const sp0 = data.attributes.sp.value;

        if (dialog) {
            const rested = await ShortRestDialog.shortRestDialog({ actor: this, canSpendRp: rp0 > 0 });
            if (!rested) return;
        }

        const drp = data.attributes.rp.value - rp0;
        const dsp = data.attributes.sp.value - sp0;

        const updateData = {};
        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && r.sr) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }

        await this.update(updateData);

        const items = this.items.filter(item => item.data.data.uses && (item.data.data.uses.per === "sr"));
        const updateItems = items.map(item => {
            return {
                "id": item.data.id,
                "data.uses.value": item.data.data.uses.max
            }
        });

        await this.updateEmbeddedEntity("OwnedItem", updateItems);

        if (chat) {
            let msg = `${this.name} takes a short 10 minute rest spending ${-drp} Resolve Point to recover ${dsp} Stamina Points.`;
            ChatMessage.create({
                user: game.user._id,
                speaker: { actor: this, alias: this.name },
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

    async removeFromCrew() {
        await this.unsetFlag('starfinder', 'crewMember');
    }

    async setCrewMemberRole(shipId, role) {
        return this.setFlag('starfinder', 'crewMember', {
            shipId: shipId,
            role: role
        });
    }

    /**
     * Take a long nights rest, recovering HP, SP, RP, resources, and spell slots
     * @param {boolean} dialog  Present a confirmation dialog window whether or not to take a long rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the long rest workflow has completed
     */
    async longRest({ dialog = true, chat = true } = {}) {
        const data = this.data.data;
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
                "id": item.data.id,
                "data.uses.value": item.data.data.uses.max
            }
        });

        await this.update(updateData);
        await this.updateEmbeddedEntity("OwnedItem", updateItems);

        if (chat) {
            ChatMessage.create({
                user: game.user._id,
                speaker: { actor: this, alias: this.name },
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

    /**
     * Spend the resiquite number of resolve points to regain all stamina points
     */
    spendRp() {
        if (this.data.data.attributes.rp.value === 0) throw new Error(`${this.name} has no Resolve Points remaining!`);

        let sp = this.data.data.attributes.sp,
            dsp = Math.min(sp.max - sp.value, sp.max),
            rp = Math.max(this.data.data.attributes.rp.value - 1, 0);
        this.update({ "data.attributes.sp.value": sp.value + dsp, "data.attributes.rp.value": rp });
    }
}
