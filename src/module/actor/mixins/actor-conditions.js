import { SFRPG } from "../../config.js"

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

        const conditionItem = this.items.find(item => this._isCondition(item) && item.name.toLowerCase() === conditionName.toLowerCase());
        return conditionItem;
    }

    /**
     * Get an Array of all conditions on the actor.
     * @returns {Array} strings
     * @public
     */
    getActiveConditions() {
        const activeConditions = this.items.filter(item => this._isCondition(item));
        return activeConditions;
    }

    /**
     * Checks if the item is a feat containing the data requirements of condition.
     * @param item foundry item document
     * @returns {boolean}
     * @private
     */
    _isCondition(item) {
        return item.type === "feat" && item.system.requirements?.toLowerCase() === "condition";
    }

    _isStatusEffect(name) {
        return SFRPG.statusEffects.find(effect => effect.id === name) != undefined;
    }

    /**
     * Updates the Actor's conditions. Either adds or removes a condition Item as necessary to match the enabled argument.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffects. Case sensitive.
     * @param {Boolean} enabled If this value is true it ensures the condition is present on the Actor.
     * @param {Object} overlay If this value is true it indicates that the token icon should be added as a full-sized overlay. Default is false.
     * @returns {Promise<*>} The Promise resulting from the create or delete Embedded Document call.
     * @public
     */
    async setCondition(conditionName, enabled, { overlay = false } = {}) {
        if (!this._isStatusEffect(conditionName)) {
            ui.notifications.warn(`Trying to set condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffects for all valid conditions.`);
            return;
        }

        // Try to get status effect object as a workaround for a poorly conceived check in foundry.js Token.toggleEffect(...)
        const statusEffect = SFRPG.statusEffects.find(effect => effect.id === conditionName);

        // Reflect state on tokens
        const tokens = this.getActiveTokens(true);
        for (const token of tokens) {
            await token.toggleEffect(statusEffect, {active: enabled, overlay: overlay});
        }

        // Update condition item
        const conditionItem = this.getCondition(conditionName);
        
        if (enabled) {
            if (!conditionItem) {
                const compendium = game.packs.find(element => element.title.includes("Conditions"));
                if (compendium) {
                    await compendium.getIndex();

                    const entry = compendium.index.find(e => e.name.toLowerCase() === conditionName.toLowerCase());
                    if (entry) {
                        const entity = await compendium.getDocument(entry._id);
                        const itemData = duplicate(entity);

                        const promise = this.createEmbeddedDocuments("Item", [itemData]);
                        promise.then((createdItems) => {
                            if (createdItems && createdItems.length > 0) {
                                this._updateActorCondition(conditionName, true).then(() => {
                                    Hooks.callAll("onActorSetCondition", {actor: this, item: createdItems[0], conditionName: conditionName, enabled: enabled});
                                });
                            }
                        });
                        
                        return promise;
                    }
                }
            }
        } else {
            if (conditionItem) {
                const promise = this.deleteEmbeddedDocuments("Item", [conditionItem.id]);
                promise.then(() => {
                    this._updateActorCondition(conditionName, false).then(() => {
                        Hooks.callAll("onActorSetCondition", {actor: this, item: conditionItem, conditionName: conditionName, enabled: enabled});
                    });
                });

                return promise;
            }
        }
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

        return this.update(updateData).then(() => {
            this._checkFlatFooted(conditionName, enabled);
        });
    }

    /**
     * Checks if the Flat-Footed condition should be enabled based on other conditions in SFRPG.conditionsCausingFlatFooted.
     * @param conditionName The condition being added or removed
     * @param enabled True if the condition is being added
     * @private
     */
    async _checkFlatFooted(conditionName, enabled) {
        const flatFooted = "flat-footed";
        let shouldBeFlatfooted = (conditionName === flatFooted && enabled);

        for (const ffCondition of SFRPG.conditionsCausingFlatFooted) {
            if (this.hasCondition(ffCondition)) {
                shouldBeFlatfooted = true;
                break;
            }
        }
        
        if (shouldBeFlatfooted !== this.hasCondition(flatFooted)) {
            return this.setCondition(flatFooted, shouldBeFlatfooted);
        }

        return null;
    }
}
