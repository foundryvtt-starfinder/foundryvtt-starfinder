/**
 * Extend the base :class:`Actor` to implement additional logic specialized for Starfinder
 */
class ActorStarfinder extends Actor {
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

        // Ability modifiers and saves
        for (let abl of Object.values(data.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
        }

        const init = data.attributes.init;
        init.mod = data.abilities.dex.mod;
        init.bonus = init.value + (getProperty(flags, "starfinder.improvedInititive") ? 4 : 0);
        init.total = init.mod + init.bonus;

        data.attributes.eac.min = 10 + data.abilities.dex.mod;
        data.attributes.kac.min = 10 + data.abilities.dex.mod;
        
        return actorData;
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
        data.details.cr.value = parseFloat(data.details.cr.value || 0);
        data.details.xp.value = this.getCRExp(data.details.cr.value);
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
        if (cr < 1.0) return Math.max(400 * cr, 50);
        return CONFIG.STARFINDER.CR_EXP_LEVELS[cr];
    }
}

CONFIG.Actor.entityClass = ActorStarfinder;
