import { DiceStarfinder } from "../dice.js";
import { ShortRestDialog } from "../apps/short-rest.js";
import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
import { AddEditSkillDialog } from "../apps/edit-skill-dialog.js";

/**
 * Extend the base :class:`Actor` to implement additional logic specialized for Starfinder
 */
export class ActorStarfinder extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data.
     * 
     * @param {Object} actorData The data for the actor
     * @returns {Object} The actors data
     */
    prepareData(actorData) {
        actorData = super.prepareData(actorData);
        const data = actorData.data;
        const flags = actorData.flags;

        if (actorData.type === "character") this._prepareCharacterData(data);
        else if (actorData.type === "npc") this._prepareNPCData(data);
        else if (actorData.type === "starship") {
            this._prepareStarshipData(data);
            return actorData;
        } else if (actorData.type === "vehicle") {
            this._prepareVehicleData(data);
            return actorData;
        }

        // Ability modifiers
        for (let abl of Object.values(data.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
        }

        // Skills
        for (let skl of Object.values(data.skills)) {
            skl.value = parseFloat(skl.value || 0);
            let classSkill = skl.value;
            let hasRanks = skl.ranks > 0;
            skl.mod = data.abilities[skl.ability].mod + skl.ranks + (hasRanks ? classSkill : 0) + skl.misc;
        }

        // Saves
        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        fort.bonus = fort.value + data.abilities.con.mod + fort.misc;
        reflex.bonus = reflex.value + data.abilities.dex.mod + reflex.misc;
        will.bonus = will.value + data.abilities.wis.mod + will.misc;

        const init = data.attributes.init;
        init.mod = data.abilities.dex.mod;
        init.bonus = init.value + (getProperty(flags, "starfinder.improvedInititive") ? 4 : 0);
        init.total = init.mod + init.bonus;

        data.attributes.eac.min = 10 + data.abilities.dex.mod;
        data.attributes.kac.min = 10 + data.abilities.dex.mod;

        // CMD or AC Vs Combat Maneuvers as it's called in starfinder
        data.attributes.cmd.value = 8 + data.attributes.kac.value;

        return actorData;
    }

    /**
     * Prepare a starship's data
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareStarshipData(data) {

    }

    /**
     * Prepare a vechile's data
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareVehicleData(data) {

    }

    /**
     * Prepare the character's data.
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareCharacterData(data) {
        data.details.level.value = parseInt(data.details.level.value);
        data.details.xp.max = this.getLevelExp(data.details.level.value || 1);
        let prior = this.getLevelExp(data.details.level.value - 1 || 0),
            req = data.details.xp.max - prior;
        data.details.xp.pct = Math.min(Math.round((data.details.xp.value - prior) * 100 / req), 99.5);
    }

    /**
     * Prepare the NPC's data.
     * 
     * @param {Object} data The NPC's data to prepare
     * @private
     */
    _prepareNPCData(data) {
        data.details.xp.value = this.getCRExp(data.details.cr);
    }

    /**
     * Return the amount of experience required to gain a certain character level.
     * 
     * @param {Number} level The desired level
     * @returns {Number} The XP required for the next level
     */
    getLevelExp(level) {
        const levels = CONFIG.STARFINDER.CHARACTER_EXP_LEVELS;
        return levels[Math.min(level, levels.length - 1)];
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
        if (data['data.traits.size']) {
            let size = CONFIG.STARFINDER.tokenSizes[data['data.traits.size']];
            if (this.isToken) this.token.update(this.token.scene._id, { height: size, width: size });
            else {
                setProperty(data, 'token.height', size);
                setProperty(data, 'token.width', size);
            }
        }

        return super.update(data, options);
    }

    /**
     * Extend OwnedItem creation logic for the 5e system to make weapons proficient by default when dropped on a NPC sheet
     * See the base Actor class for API documentation of this method
     * 
     * @param {Object} itemData The data object of the item
     * @param {Object} options Any options passed in
     * @returns {Promise}
     */
    async createOwnedItem(itemData, options) {
        if (!this.isPC) {
            let t = itemData.type;
            let initial = {};
            if (t === "weapon") initial['data.proficient'] = true;
            if (["weapon", "equipment"].includes(t)) initial['data.equipped'] = true;
            if (t === "spell") initial['data.prepared'] = true;
            mergeObject(itemData, initial);
        }

        return super.createOwnedItem(itemData, options);
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
                item = item.constructor.createOwned(mergeObject(item.data, {"data.level": lvl}, {inplace: false}), this);
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
        const skill = this.data.data.skills[skillId];
        const formData = await AddEditSkillDialog.create(skillId, skill);

        let skillData = {};
        for (let data of formData.entries()) {
            skillData[data[0]] = data[1];
        }

        if (skillData['skill.isTrainedOnly'] && skillData['skill.isTrainedOnly'] === 'on') {
            skillData['skill.isTrainedOnly'] = true;
        } 

        if (skillData['skill.hasArmorCheckPenalty'] && skillData['skill.hasArmorCheckPenalty'] === 'on') {
            skillData['skill.hasArmorCheckPenalty'] = true;
        } 
        
        if (skillData['skill.value'] && skillData['skill.value'] === 'on') {
            skillData['skill.value'] = 3;
        }

        console.log(skillData);
        // TODO: Finish this.
    }

    /**
     * Add a new skill
     * @param {Object} options Options which configure how the skill is added
     */
    async addSkill(options={}) {
        console.log("Starfinder | In StarfinderActor.addSkill(options)");
    }

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {Object} options      Options which configure how the skill check is rolled
     */
    rollSkill(skillId, options = {}) {
        const skl = this.data.data.skills[skillId];
        if (skl.isTrainedOnly && !(skl.ranks > 0)) {
            let content = `${CONFIG.STARFINDER.skills[skillId]} is a trained only skill, but ${this.name} is not trained in that skill.
                Would you like to roll anyway?`;

            new Dialog({
                title: `${CONFIG.STARFINDER.skills[skillId]} is trained only`,
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
    rollAbility(abilityId, options={}) {
        const label = CONFIG.STARFINDER.abilities[abilityId];
        const abl = this.data.data.abilities[abilityId];

        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mod: abl.mod },
            title: `${label} Ability Check`,
            speaker: ChatMessage.getSpeaker({actor: this})
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
            speaker: ChatMessage.getSpeaker({actor: this})
        });
    }

    rollSkillCheck(skillId, skill, options = {}) {
        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mod: skill.mod },
            title: `${CONFIG.STARFINDER.skills[skillId]} Skill Check`,
            speaker: ChatMessage.getSpeaker({ actor: this })
        });
    }

    static async applyDamage(roll, multiplier) {
        let value = Math.floor(parseFloat(roll.find('.dice-total').text()) * multiplier);
        const promises = [];
        for (let t of canvas.tokens.controlled) {
            let a = t.actor,
                hp = a.data.data.attributes.hp,
                tmp = parseInt(hp.temp) | 0,
                dt = value > 0 ? Math.min(tmp, value) : 0;

            promises.push(t.actor.update({
                "data.attributes.hp.temp": tmp - dt,
                "data.attributes.hp.value": Math.clamped(hp.value - (value - dt), 0, hp.max)
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

        await this.updateManyOwnedItem(updateItems);

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
            data.details.level.value > data.attributes.hp.max ?
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
        await this.updateManyOwnedItem(updateItems);

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
