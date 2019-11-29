import { DiceStarfinder } from "../dice.js";

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
            if (skl.values && skl.values instanceof Array) continue; //TODO: Make profession skill work ;)
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

        return item.roll();
    }

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {Object} options      Options which configure how the skill check is rolled
     */
    rollSkill(skillId, options = {}) {
        const skl = this.data.data.skills[skillId];
        return DiceStarfinder.d20Roll({
            event: options.event,
            parts: ["@mod"],
            data: { mode: skl.mod },
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
}
