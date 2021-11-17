import { SFRPG } from "../../config.js"

export const ActorConditionsMixin = (superclass) => class extends superclass {
    /**
     * Check if the Actor has the condition.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffectIconMapping. Case insensitive.
     * @returns {Boolean} True if the conditionName exists and a condition with that name is assigned to the Actor. False in any other case.
     * @public
     */
    hasCondition(conditionName) {
        if (!SFRPG.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`Trying to check condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffectIconMapping for all valid conditions.`);
            return false;
        }

        const conditionItem = this.getCondition(conditionName);
        return (conditionItem !== undefined);
    }

    /**
     * Get a condition Item from the actor.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffectIconMapping. Case insensitive.
     * @returns {undefined|*} The condition Item if found. Returns undefined if conditionName does not exist or if the Item is not found.
     * @public
     */
    getCondition(conditionName) {
        if (!SFRPG.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`Trying to get condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffectIconMapping for all valid conditions.`);
            return undefined;
        }

        const conditionItem = this.items.find(x => x.type === "feat" && x.data.data.requirements?.toLowerCase() === "condition" && x.name.toLowerCase() === conditionName.toLowerCase());
        return conditionItem;
    }

    /**
     * Updates the Actor's conditions. Either adds or removes a condition Item as necessary to match the enabled argument.
     * @param {String} conditionName The name of the condition. Must match any key from config.js SFRPG.statusEffectIconMapping. Case insensitive.
     * @param {Boolean} enabled If this value is true it ensures the condition is present on the Actor.
     * @param {Object} overlay If this value is true it indicates that the token icon should be added as a full-sized overlay. Default is false.
     * @returns {Promise<*>} The Promise resulting from the create or delete Embedded Document call.
     */
    async setCondition(conditionName, enabled, { overlay = false } = {}) {
        if (!SFRPG.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`Trying to set condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.SFRPG.statusEffectIconMapping for all valid conditions.`);
            return;
        }

        // Try to get status effect object as a workaround for a poorly conceived check in foundry.js Token.toggleEffect(...)
        let statusEffect;
        for (const effect of SFRPG.statusEffects) {
            if (effect.id === conditionName) {
                statusEffect = effect;
            }
        }
        
        statusEffect = statusEffect ?? SFRPG.statusEffectIconMapping[conditionName];

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
                        const itemData = duplicate(entity.data);

                        const promise = this.createEmbeddedDocuments("Item", [itemData]);
                        promise.then((createdItems) => {
                            if (createdItems && createdItems.length > 0) {
                                this._updateActor(conditionName, true);
                                Hooks.callAll("onActorSetCondition", {actor: this, item: createdItems[0], conditionName: conditionName, enabled: enabled});
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
                    this._updateActor(conditionName, false);
                    Hooks.callAll("onActorSetCondition", {actor: this, item: conditionItem, conditionName: conditionName, enabled: enabled});
                });

                return promise;
            }
        }
    }

    /**
     * Updates the actor data with the condition settings and then checks if Flat-Footed needs to be updated.
     *
     * @param {String} conditionName The name of the condition matching keys from config.js SFRPG.statusEffectIconMapping
     * @param {Boolean} enabled If this value is true it enables the condition
     * @private
     * */
    _updateActor(conditionName, enabled) {
        const updateData = {};
        updateData[`data.conditions.${conditionName}`] = enabled;

        this.update(updateData).then(() => {
            this._checkFlatFooted(conditionName, enabled);
        });
    }

    /**
     *
     * @param conditionName
     * @param enabled
     * @private
     */
    _checkFlatFooted(conditionName, enabled) {
        const flatFooted = "flat-footed";
        let shouldBeFlatfooted = (conditionName === flatFooted && enabled);

        for (const ffCondition of SFRPG.conditionsCausingFlatFooted) {
            if (this.hasCondition(ffCondition)) {
                shouldBeFlatfooted = true;
                break;
            }
        }
        
        if (shouldBeFlatfooted !== this.hasCondition(flatFooted)) {
            this.setCondition(flatFooted, shouldBeFlatfooted);
        }
    }
}
