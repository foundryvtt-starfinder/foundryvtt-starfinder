import { SFRPG } from "../../config.js";
import { actionDamageOverride } from "../../rules/mech-damage-level.js";

export const ActorMechMixin = (superclass) => class extends superclass {
    /**
     * Perform one of the mech's actions: spend its Power Points, arm any damage
     * level override it declares, and post its chat card.
     *
     * Power Point and Special actions are addressed by their index in
     * SFRPG.mechPPActions / SFRPG.mechSpecialActions. Gear actions come from the
     * `actions` array on one of the mech's own components, so they need the item
     * and the index within that item.
     *
     * @param {string} category "pp", "special" or "gear"
     * @param {number} index Index into the matching action table; ignored for gear
     * @param {Object} [options]
     * @param {string} [options.itemId] Component holding the action, for "gear"
     * @param {number} [options.itemActionIndex] Index into that component's actions, for "gear"
     * @returns {Promise<ChatMessage|null>} The action's chat card, or null if the
     *                                      action could not be performed
     */
    async useMechAction(category, index, { itemId = null, itemActionIndex = null } = {}) {
        let name, description, ppCost, actionType, gearName, armsOverride;
        // Set for gear actions so the override they arm is spent by the weapon it
        // is printed on and not by whatever the mech fires next.
        let overrideItemId = null;
        let img = this.img;

        if (category === "pp") {
            const action = SFRPG.mechPPActions[index];
            if (!action) return null;
            name = game.i18n.localize(action.name);
            description = game.i18n.localize(action.description);
            ppCost = action.ppCost;
            armsOverride = action.armsOverride;
        } else if (category === "special") {
            const action = SFRPG.mechSpecialActions[index];
            if (!action) return null;
            name = game.i18n.localize(action.name);
            description = game.i18n.localize(action.description);
            actionType = action.actionType;
        } else if (category === "gear") {
            const item = this.items.get(itemId);
            if (!item) return null;
            const action = item.system.actions?.[itemActionIndex];
            if (!action) return null;
            name = `${action.name} (${item.name})`;
            description = action.description;
            ppCost = action.ppCost;
            actionType = action.actionType;
            gearName = item.name;
            img = item.img;
            armsOverride = actionDamageOverride(action);
            if (armsOverride) overrideItemId = item.id;
        } else {
            return null;
        }

        const actionTypeLabels = Object.fromEntries(
            Object.entries(SFRPG.mechActionTypes).map(([key, label]) => [key, game.i18n.localize(label)])
        );

        // Deduct PP if this action has a cost
        if (ppCost !== null && ppCost !== undefined && ppCost > 0) {
            const currentPP = this.system.attributes.pp.value || 0;
            if (currentPP < ppCost) {
                ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Actions.InsufficientPP"));
                return null;
            }
            await this.update({ "system.attributes.pp.value": currentPP - ppCost });
        }

        // Actions like Devastating Hit are declared before damage is rolled, so they arm an
        // override that the next mech damage roll consumes.
        if (armsOverride) {
            await this.setFlag("sfrpg", "damageLevelOverride", {
                ...armsOverride,
                source: name,
                ppSpent: ppCost || 0,
                itemId: overrideItemId
            });
        }

        const ppSpent = (ppCost !== null && ppCost !== undefined && ppCost > 0)
            ? game.i18n.format("SFRPG.MechSheet.Actions.PPSpent", { amount: ppCost })
            : null;

        const templateData = {
            actor: this,
            name: name,
            img: img,
            description: description,
            ppCost: ppCost !== null && ppCost !== undefined ? `${ppCost} PP` : null,
            ppSpent: ppSpent,
            actionTypeLabel: actionType ? (actionTypeLabels[actionType] || actionType) : null,
            gearName: gearName || null
        };

        const html = await foundry.applications.handlebars.renderTemplate(
            "systems/sfrpg/templates/chat/mech-action-card.hbs",
            templateData
        );

        return ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: html,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        });
    }

    /**
     * Activate or deactivate one of this mech's mission pods.
     *
     * Activating creates the pod's item templates on the mech and records their
     * ids; deactivating deletes those items again. Only one pod may be active at
     * a time.
     *
     * @param {string} podId Id of the mechMissionPod item
     * @param {boolean} active True to activate, false to deactivate
     * @param {Object} [options]
     * @param {boolean} [options.confirm] Ask before changing state
     * @returns {Promise<boolean>} True if the pod's state changed
     */
    async setMissionPodActive(podId, active, { confirm = true } = {}) {
        const pod = this.items.get(podId);
        if (!pod || pod.type !== "mechMissionPod") return false;
        if (!!pod.system.isActive === !!active) return false;

        if (active) {
            const activePod = this.items.find(i => i.type === "mechMissionPod" && i.system.isActive);
            if (activePod) {
                ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.MissionPod.OnlyOne"));
                return false;
            }
        }

        const prompt = active ? "Activate" : "Deactivate";
        if (confirm) {
            const confirmed = await Dialog.confirm({
                title: game.i18n.localize(`SFRPG.MechSheet.MissionPod.${prompt}ConfirmTitle`),
                content: `<p>${game.i18n.format(`SFRPG.MechSheet.MissionPod.${prompt}ConfirmPrompt`, { pod: pod.name })}</p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });

            if (!confirmed) return false;
        }

        if (active) {
            // Create items from the pod's item templates
            const itemTemplates = pod.system.itemTemplates || [];
            const createdItemIds = [];

            if (itemTemplates.length > 0) {
                const itemsToCreate = itemTemplates.map(template => {
                    const itemData = foundry.utils.deepClone(template);
                    // Remove _id so Foundry generates a new one
                    delete itemData._id;
                    // Mark as from mission pod
                    itemData.flags = itemData.flags || {};
                    itemData.flags.sfrpg = itemData.flags.sfrpg || {};
                    itemData.flags.sfrpg.fromMissionPod = pod.id;
                    return itemData;
                });

                const createdItems = await this.createEmbeddedDocuments("Item", itemsToCreate);
                for (const item of createdItems) {
                    createdItemIds.push(item.id);
                }
            }

            await pod.update({
                "system.isActive": true,
                "system.createdItemIds": createdItemIds
            });
        } else {
            // Remove the items this pod created, ignoring any already deleted
            const createdItemIds = pod.system.createdItemIds || [];
            const idsToDelete = createdItemIds.filter(id => this.items.has(id));
            if (idsToDelete.length > 0) {
                await this.deleteEmbeddedDocuments("Item", idsToDelete);
            }

            await pod.update({
                "system.isActive": false,
                "system.createdItemIds": []
            });
        }

        // The pod's items change the mech's derived stats, which are computed once
        // per data preparation rather than watched.
        this.prepareData();

        ui.notifications.info(`${pod.name} ${active ? "activated" : "deactivated"}.`);
        return true;
    }

    /**
     * Cancel a damage level override that has not been rolled yet, refunding the
     * Power Points that armed it.
     *
     * @returns {Promise<number|null>} The Power Points refunded, or null if no
     *                                 override was armed
     */
    async cancelMechDamageOverride() {
        const override = this.getFlag("sfrpg", "damageLevelOverride");
        if (!override) return null;

        await this.unsetFlag("sfrpg", "damageLevelOverride");

        const refund = override.ppSpent || 0;
        if (refund > 0) {
            const pp = this.system.attributes.pp;
            await this.update({
                "system.attributes.pp.value": Math.min(pp.value + refund, pp.max)
            });
        }

        ui.notifications.info(game.i18n.format("SFRPG.MechSheet.DamageLevelOverride.Cancelled", {
            source: override.source,
            amount: refund
        }));

        return refund;
    }
};
