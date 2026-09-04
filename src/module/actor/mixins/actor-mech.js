import { SFRPG } from "../../config.js";
import { actionAttackBonus } from "../../rules/mech-attack-bonus.js";
import { actionDamageOverride } from "../../rules/mech-damage-level.js";
import { promoteDiceLinkToBonus } from "../../system/mech-bonus-link.js";
import { promoteDiceLinkToReplenish } from "../../system/mech-replenish-link.js";
import { replenishFormula } from "../../rules/mech-replenish.js";
import { effectiveSystems, overcomeActions } from "../../rules/mech-system-effects.js";
import { auxiliarySystemUsable, postAuxiliaryCheck, postChanceCard } from "../../system/mech-failure-link.js";

export const ActorMechMixin = (superclass) => class extends superclass {
    /**
     * Spend Power Points to shrug off one component's system failure.
     *
     * The override holds until the start of the mech's next turn. Because
     * regeneration is worked out at the end of a turn, an override bought at the
     * start of that turn is still standing when the power core's rate is read -
     * which is the point of buying it.
     *
     * @param {string} component The component to overcome.
     * @returns {Promise<boolean>} True when the Power Points were spent.
     */
    async useOvercomeAction(component) {
        const held = this.getFlag("sfrpg", "systemOverrides") ?? {};
        const statuses = effectiveSystems(this.system.attributes.systems, held);
        const action = overcomeActions(statuses, held).find(entry => entry.component === component);
        if (!action) return false;

        const currentPP = this.system.attributes.pp.value || 0;
        if (currentPP < action.ppCost) {
            ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Actions.InsufficientPP"));
            return false;
        }

        const overrides = { ...held, [component]: action.override };
        await this.update({
            "system.attributes.pp.value": currentPP - action.ppCost,
            "flags.sfrpg.systemOverrides": overrides
        });

        return true;
    }

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
        let name, description, ppCost, actionType, gearName, armsOverride, armsAttackBonus, restoresShields;
        // Set for gear actions so the override they arm is spent by the weapon it
        // is printed on and not by whatever the mech fires next.
        let overrideItemId = null;
        let img = this.img;

        if (category === "pp") {
            const action = SFRPG.mechPPActions[index];
            if (!action) return null;
            name = game.i18n.localize(action.name);
            ppCost = action.ppCost;
            armsOverride = action.armsOverride;
            armsAttackBonus = actionAttackBonus(action);
            restoresShields = action.restoresShields;

            // An action whose dice depend on the mech writes them into its own
            // sentence, so the card reads as this mech's version of the ability.
            description = restoresShields
                ? game.i18n.format(action.description, {
                    formula: replenishFormula(this.system.details.tier, restoresShields)
                })
                : game.i18n.localize(action.description);
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

            // A system stopped by the failure roll, or by a check it failed
            // earlier this turn, does nothing at all - so it takes no payment.
            if (item.type === "mechAuxiliary" && !auxiliarySystemUsable(item)) {
                ui.notifications.warn(game.i18n.format("SFRPG.MechSheet.SystemFailure.SystemStopped", {
                    name: item.name
                }));
                return null;
            }
            name = `${action.name} (${item.name})`;
            description = action.description;
            ppCost = action.ppCost;
            actionType = action.actionType;
            gearName = item.name;
            img = item.img;
            armsOverride = actionDamageOverride(action);
            armsAttackBonus = actionAttackBonus(action);
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

        // A failing auxiliary component may stop the system from doing anything.
        // The check comes after the Power Points are deducted, because they are
        // spent whether or not the system works.
        if (category === "gear") {
            const item = this.items.get(itemId);
            if (item?.type === "mechAuxiliary") {
                const statuses = effectiveSystems(
                    this.system.attributes.systems,
                    this.getFlag("sfrpg", "systemOverrides") ?? {}
                );
                await postAuxiliaryCheck(this, item, statuses.auxSystem);
            }
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

        // Aim's die is not rolled here. Its description already reads "roll 1d4",
        // and enriching the description turns that into a dice link, so the card
        // hands the player the roll rather than making it for them. Clicking the
        // link rolls the die and arms the bonus - see onMechAttackBonusClick.
        let descriptionHTML = null;
        if (armsAttackBonus) {
            const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(description);
            const wrapper = document.createElement("div");
            wrapper.innerHTML = enriched;

            const promoted = promoteDiceLinkToBonus(wrapper, armsAttackBonus.formula, {
                source: name,
                ppSpent: ppCost || 0,
                itemId: category === "gear" ? itemId : null,
                tooltip: game.i18n.format("SFRPG.MechSheet.AttackBonusOverride.LinkTooltip", {
                    formula: armsAttackBonus.formula
                })
            });

            if (promoted) descriptionHTML = wrapper.innerHTML;
        }

        // Replenish's dice are not rolled here either. The card hands the player
        // the roll, and clicking it restores the shields - see onMechReplenishClick.
        if (restoresShields) {
            const formula = replenishFormula(this.system.details.tier, restoresShields);
            const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(description);
            const wrapper = document.createElement("div");
            wrapper.innerHTML = enriched;

            const promoted = promoteDiceLinkToReplenish(wrapper, formula, {
                source: name,
                tooltip: game.i18n.format("SFRPG.MechSheet.Replenish.LinkTooltip", { formula })
            });

            if (promoted) descriptionHTML = wrapper.innerHTML;
        }

        const ppSpent = (ppCost !== null && ppCost !== undefined && ppCost > 0)
            ? game.i18n.format("SFRPG.MechSheet.Actions.PPSpent", { amount: ppCost })
            : null;

        const templateData = {
            actor: this,
            name: name,
            img: img,
            description: description,
            descriptionHTML: descriptionHTML,
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
     * Post the check unreliable controls owe when the pilot spends a full action.
     *
     * The system has no notion of that action, so it cannot be detected. The
     * button on the sheet is the operator saying they took it.
     *
     * @returns {Promise<ChatMessage|null>} The card, or null when the cockpit is sound.
     */
    async rollCockpitControlCheck() {
        const statuses = effectiveSystems(
            this.system.attributes.systems,
            this.getFlag("sfrpg", "systemOverrides") ?? {}
        );
        if (statuses.cockpit !== "inoperable") return null;

        return postChanceCard(this, {
            chance: 50,
            purpose: "cockpit",
            label: game.i18n.localize("SFRPG.MechSheet.SystemFailure.CockpitCheckLabel")
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
     * Roll an action's declared bonus and arm it against this mech's next attack roll.
     *
     * Called from the dice link on the action's chat card rather than when the
     * action is used, so the player rolls the die themselves and sees the number
     * before committing to an attack.
     *
     * @param {string} formula The formula to roll, e.g. "1d4"
     * @param {Object} [options]
     * @param {string} [options.source] Name of the action arming the bonus
     * @param {number} [options.ppSpent] Power Points already spent, refunded if the bonus is disarmed
     * @param {string} [options.itemId] Weapon the bonus is restricted to, if any
     * @returns {Promise<number|null>} The rolled bonus, or null if one was already armed
     */
    async armMechAttackBonus(formula, { source = "", ppSpent = 0, itemId = null } = {}) {
        const armed = this.getFlag("sfrpg", "attackBonusOverride");
        if (armed) {
            ui.notifications.warn(game.i18n.format("SFRPG.MechSheet.AttackBonusOverride.AlreadyArmed", {
                source: armed.source,
                value: armed.value
            }));
            return null;
        }

        const roll = await new Roll(formula, this.getRollData()).evaluate();

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: game.i18n.format("SFRPG.MechSheet.AttackBonusOverride.RollFlavor", { source })
        });

        await this.setFlag("sfrpg", "attackBonusOverride", {
            source: source,
            formula: formula,
            value: roll.total,
            ppSpent: ppSpent,
            itemId: itemId
        });

        return roll.total;
    }

    /**
     * Cancel a damage level override that has not been rolled yet, refunding the
     * Power Points that armed it.
     *
     * @returns {Promise<number|null>} The Power Points refunded, or null if no
     *                                 override was armed
     */
    async cancelMechDamageOverride() {
        return this._cancelMechOverride("damageLevelOverride", "SFRPG.MechSheet.DamageLevelOverride.Cancelled");
    }

    /**
     * Cancel an attack bonus that has not been rolled against yet, refunding the
     * Power Points that armed it.
     *
     * @returns {Promise<number|null>} The Power Points refunded, or null if no
     *                                 bonus was armed
     */
    async cancelMechAttackBonus() {
        return this._cancelMechOverride("attackBonusOverride", "SFRPG.MechSheet.AttackBonusOverride.Cancelled");
    }

    /**
     * Clear one of the mech's armed overrides and hand back what it cost.
     *
     * The refund is capped at the mech's maximum so replenishing Power Points
     * before disarming can't push the pool past full.
     *
     * @private
     * @param {string} flag Name of the flag under the sfrpg scope
     * @param {string} messageKey Localization key for the notification
     * @returns {Promise<number|null>} The Power Points refunded, or null if the flag was not set
     */
    async _cancelMechOverride(flag, messageKey) {
        const override = this.getFlag("sfrpg", flag);
        if (!override) return null;

        await this.unsetFlag("sfrpg", flag);

        const refund = override.ppSpent || 0;
        if (refund > 0) {
            const pp = this.system.attributes.pp;
            await this.update({
                "system.attributes.pp.value": Math.min(pp.value + refund, pp.max)
            });
        }

        ui.notifications.info(game.i18n.format(messageKey, {
            source: override.source,
            amount: refund
        }));

        return refund;
    }
};
