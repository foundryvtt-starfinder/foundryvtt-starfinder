export const ActorConditionsMixin = (superclass) => class extends superclass {
    /**
     * Check if the Actor has the condition.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffects. Case sensitive.
     * @returns {Boolean} True if the conditionName exists and a condition with that name is assigned to the Actor. False in any other case.
     * @public
     */
    hasCondition(conditionName) {
        if (!this._isStatusEffect(conditionName)) {
            ui.notifications.warn(`Trying to check condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffects for all valid conditions.`);
            return false;
        }

        const conditionItem = this.getCondition(conditionName);
        return (conditionItem !== null);
    }

    /**
     * Get a condition Item from the actor.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffects. Case sensitive.
     * @returns {undefined|*} The condition Item if found. Returns undefined if conditionName does not exist or if the Item is not found.
     * @public
     */
    getCondition(conditionName) {
        if (!this._isStatusEffect(conditionName)) {
            ui.notifications.warn(`Trying to get condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffects for all valid conditions.`);
            return undefined;
        }

        const conditionItem = this.items.find(item => (item.system.slug === conditionName) || (item.name.toLowerCase() === conditionName)); // TODO: The 'or' is in place for backward compatibility. This should only use slug once DataModels are implemented and migrations can be done easily.
        return conditionItem ?? null;
    }

    /**
     * Updates the Actor's conditions. Either adds or removes a condition Item as necessary to match the enabled argument.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffects. Case sensitive.
     * @param {Boolean} enabled If this value is true it ensures the condition is present on the Actor.
     * @public
     */
    async setCondition(conditionName, enabled) {
        if (!this._isStatusEffect(conditionName)) {
            ui.notifications.warn(`Trying to set condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffects for all valid conditions.`);
            return;
        }

        // Find the relevant condition item on the actor, if it exists
        const conditionItem = this.getCondition(conditionName);

        if (enabled) {
            if (!conditionItem) {
                const pack = game.packs.get("sfrpg.conditions");
                const indexKey = CONFIG.SFRPG.statusEffects.find(e => e.id === conditionName).compendiumKey;
                const index = pack.indexed ? pack.index : await pack.getIndex();
                const entry = index.get(indexKey);

                if (entry) {
                    const entity = await pack.getDocument(entry._id);
                    const itemData = entity.toObject();
                    const createdItems = await this.createEmbeddedDocuments("Item", [itemData]);

                    if (createdItems && createdItems.length > 0) {
                        await this._updateActorCondition(conditionName, true);
                        Hooks.callAll("onActorSetCondition", {actor: this, item: createdItems[0], conditionName, enabled});
                    }
                }
            }
        } else {
            if (conditionItem) {
                const effect = game.sfrpg.timedEffects.get(conditionItem.uuid);
                effect.delete();
                await this.deleteEmbeddedDocuments("Item", [conditionItem.id]);
                await this._updateActorCondition(conditionName, false);
                Hooks.callAll("onActorSetCondition", {actor: this, item: conditionItem, conditionName: conditionName, enabled: enabled});
            }
        }

        // Since conditions sidestep Foundry status effects, simulate a status effect change.
        const tokens = this.getActiveTokens(true);
        for (const token of tokens) {
            token._onApplyStatusEffect(conditionName, enabled);
        }

        return enabled;
    }

    /** Redirect to `setCondition` if possible. */
    async toggleStatusEffect(statusId, options) {
        return this._isStatusEffect(statusId) && !("overlay" in options)
            ? this.setCondition(statusId, !this.hasCondition(statusId))
            : super.toggleStatusEffect(statusId, options);
    }

    /**
     * Checks if the Flat-Footed condition should be enabled based on other conditions in SFRPG.conditionsCausingFlatFooted.
     * @param conditionName The condition being added or removed
     * @param enabled True if the condition is being added
     * @private
     */
    _checkFlatFooted(conditionName, enabled) {
        const hasFlatFooted =  this.hasCondition("flat-footed");
        let hasCausingCondition = false;
        for (const condition of CONFIG.SFRPG.conditionsCausingFlatFooted) {
            if (this.hasCondition(condition)) {
                hasCausingCondition = true;
                break;
            }
        }

        let shouldBeFlatFooted = (conditionName === "flat-footed" && enabled) || hasFlatFooted;
        const causesFlatFooted = CONFIG.SFRPG.conditionsCausingFlatFooted.includes(conditionName);
        if (causesFlatFooted) {
            shouldBeFlatFooted = hasCausingCondition || enabled;
        }

        return this.setCondition("flat-footed", shouldBeFlatFooted);

    }

    /**
     * Checks if the item is an effect in the status effects list
     * @param item foundry item document
     * @returns {boolean}
     * @private
     */
    _isStatusEffect(name) {
        return CONFIG.SFRPG.statusEffects.find(effect => effect.id === name) !== undefined;
    }

    /**
     * Updates the actor data with the condition settings and then checks if Flat-Footed needs to be updated.
     *
     * @param {String} conditionName The name of the condition matching keys from config.js SFRPG.statusEffects
     * @param {Boolean} enabled If this value is true it enables the condition
     * @private
     * */
    async _updateActorCondition(conditionName, enabled) {
        const updateData = {};
        updateData[`system.conditions.${conditionName}`] = enabled;

        await this.update(updateData);
        this._checkFlatFooted(conditionName, enabled);
    }

    static async generateConditionCache() {
        const pack = game.packs.get("sfrpg.conditions");
        const documents = await pack.getDocuments({type: "effect"});

        const cacheEntries = documents.reduce((obj, doc) => {
            obj[doc.system.slug] = doc;
            return obj;
        }, {});

        game.sfrpg.conditionCache = new Map(Object.entries(cacheEntries));
    }
};
