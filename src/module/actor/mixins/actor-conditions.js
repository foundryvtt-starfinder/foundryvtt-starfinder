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
        return (conditionItem !== undefined);
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

        return this.items.find(item => this._isCondition(item) && item.name.toLowerCase() === conditionName.toLowerCase());

    }

    /**
     * Get an Array of all conditions on the actor.
     * @returns {Array} strings
     * @public
     */
    getActiveConditions() {
        return this.items.filter(item => this._isCondition(item));
    }

    /**
     * Checks if the item is a feat containing the data requirements of condition.
     * @param item foundry item document
     * @returns {boolean}
     * @private
     */
    _isCondition(item) {
        return item.type === "effect" && item.system.requirements?.toLowerCase() === "condition";
    }

    _isStatusEffect(name) {
        return CONFIG.SFRPG.statusEffects.find(effect => effect.id === name) != undefined;
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

        // Update condition item
        const conditionItem = this.getCondition(conditionName);

        if (enabled) {
            if (!conditionItem) {
                const pack = game.packs.get("sfrpg.conditions");
                const index = pack.indexed ? pack.index : await pack.getIndex();

                const entry = index.find(e => e.name.toLowerCase() === conditionName.toLowerCase());
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
            token._onApplyStatusEffect(conditionName.toLowerCase(), enabled);
        }

        return enabled;
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

    /**
     * Checks if the Flat-Footed condition should be enabled based on other conditions in SFRPG.conditionsCausingFlatFooted.
     * @param conditionName The condition being added or removed
     * @param enabled True if the condition is being added
     * @private
     */
    _checkFlatFooted(conditionName, enabled) {
        const flatFooted = "flat-footed";
        const hasFlatFooted =  this.hasCondition(flatFooted);

        let hasCausingCondition = false;
        for (const condition of CONFIG.SFRPG.conditionsCausingFlatFooted) {
            if (this.hasCondition(condition)) {
                hasCausingCondition = true;
                break;
            }

        }

        let shouldBeFlatFooted = (conditionName === flatFooted && enabled) || hasFlatFooted;

        const causesFlatFooted = CONFIG.SFRPG.conditionsCausingFlatFooted.includes(conditionName);
        if (causesFlatFooted) shouldBeFlatFooted = hasCausingCondition || enabled;

        return this.setCondition(flatFooted, shouldBeFlatFooted);

    }
};
