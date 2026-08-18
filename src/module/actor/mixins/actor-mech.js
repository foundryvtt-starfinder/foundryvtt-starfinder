import { SFRPG } from "../../config.js";

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
                ppSpent: ppCost || 0
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
