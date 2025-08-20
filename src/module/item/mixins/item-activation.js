import { DiceSFRPG } from "../../dice.js";
import RollContext from "../../rolls/rollcontext.js";

/**
 * The data necessary to track how long an activation has been ongoing.
 * @typedef {object} ActivationEvent
 * @property {?number} startTime - world time at activation, `null` for -Infinity
 * @property {?number} endTime - world time at expected expiration, `null` for Infinity
 * @property {string} endsOn - from {@linkcode CONFIG.SFRPG.effectEndTypes}
 * @property {string} status - A status string for `SFRPGTimedEffect` to set
 * @property {?number} deactivatedAt - world time at deactivation
 */

export const ItemActivationMixin = (superclass) => class extends superclass {

    hasUses() {
        const itemData = this.system;
        return (Number(itemData.uses?.max) || itemData.uses?.total) && (itemData.uses?.value !== null && itemData.uses?.value !== undefined);
    }

    getRemainingUses() {
        const itemData = this.system;
        return itemData.uses?.value || 0;
    }

    getMaxUses() {
        const itemData = this.system;
        return itemData.uses?.total || itemData.uses?.max || 0;
    }

    canBeUsed() {
        return this.getRemainingUses() > 0 && this.getMaxUses() > 0;
    }

    canBeActivated() {
        const itemData = this.system;
        if (this.type === "vehicleSystem") {
            return itemData.canBeActivated;
        } else {
            return !!(itemData?.activation?.type);
        }
    }

    isActive() {
        return !!this.system.isActive;
    }

    get timeRemainingStr() {
        return this.system.activationEvent?.status
            ?? this.timedEffect?.activeDuration?.remaining?.string
            ?? game.i18n.localize("SFRPG.ActorSheet.Inventory.Item.Deactivate");
    }

    /**
     * Activate or deactivate this item.
     * @param {!boolean} active True to activate, false to deactivate.
     * @returns {Promise<Document>} The promise for the async update.
     */
    setActive(active) {
        // Only true and false are accepted.
        if (active !== true && active !== false) {
            console.log(`Entering an invalid value ${active} for item.setActive()! Only true or false are allowed.`);
            return;
        }

        if (!this.canBeActivated() || this.isActive() === active) {
            return;
        }

        const duration = this.system.duration;
        const updateData = {};

        const remainingUses = this.getRemainingUses();
        const maxUses = this.getMaxUses();
        if (!this.isActive() && maxUses > 0) {
            if (remainingUses <= 0) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.UI.ErrorNoCharges", {name: this.name}));
                return false;
            }

            updateData['system.uses.value'] = Math.max(0, remainingUses - 1);
        }

        const isActive = active && (duration.units !== "instantaneous");
        updateData['system.isActive'] = isActive;

        if (isActive) {
            const worldTime = game.time.worldTime;
            let expiryTurn = "parent";

            let totalTime = null; // permanent or untracked
            if (Object.hasOwn(CONFIG.SFRPG.effectDurationFrom, duration.units)) {
                const rollContext = RollContext.createItemRollContext(this, this.actor);
                const totalUnits = DiceSFRPG.resolveFormulaWithoutDice(String(duration.value || 0), rollContext).total;
                totalTime = totalUnits * CONFIG.SFRPG.effectDurationFrom[duration.units];
                if (duration.units === "turn" && game.combat?.started) {
                    for (const combatant of game.combat.combatants) {
                        if (combatant.actor === this.actor) {
                            expiryTurn = game.combat.combatant.actor.uuid;
                        }
                    }
                }
            }

            updateData['system.activationEvent'] = {
                startTime: worldTime,
                endTime: worldTime + totalTime,
                endsOn: duration.endsOn ?? "onTurnStart",
                status: null,
                deactivatedAt: null,
                expiryTurn: expiryTurn
            };
        } else if (this.system.activationEvent) {
            updateData['system.activationEvent'] = {
                startTime: -1,
                endTime: -1,
                endsOn: duration.endsOn ?? "onTurnStart",
                status: null,
                deactivatedAt: game.time.worldTime,
                expiryTurn: "parent"
            };
        }

        const updatePromise = this.update(updateData);

        if (active || duration.value || this.system.uses.max > 0) {
            updatePromise.then(() => {
                // Render the chat card template
                const templateData = active
                    ? {
                        actor: this.actor,
                        item: this,
                        action: "SFRPG.ChatCard.ItemActivation.Activates",
                        labels: this.labels,
                        hasAttack: this.hasAttack,
                        hasDamage: this.hasDamage,
                        isVersatile: this.isVersatile,
                        hasSave: this.hasSave,
                        hasSkill: this.hasSkill,
                        hasArea: this.hasArea
                    }
                    : {
                        actor: this.actor,
                        item: this,
                        action: "SFRPG.ChatCard.ItemActivation.Deactivates"
                    };

                if (this.actor.token) {
                    templateData.tokenId = this.actor.token.id;
                    templateData.sceneId = this.actor.token.parent.id;
                }

                const template = `systems/sfrpg/templates/chat/item-action-card.hbs`;
                const htmlPromise = foundry.applications.handlebars.renderTemplate(template, templateData);
                htmlPromise.then((html) => {
                    // Create the chat message
                    const chatData = {
                        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        content: html,
                        flags: {
                            sfrpg: {
                                item: this.uuid,
                                actor: this.actor.uuid
                            }
                        }
                    };

                    if (!active) chatData.action = "SFRPG.ChatCard.ItemActivation.Deactivates";
                    const rollMode = game.settings.get("core", "rollMode");
                    ChatMessage.applyRollMode(chatData, rollMode);
                    ChatMessage.create(chatData, { displaySheet: false });
                });

                Hooks.callAll("itemActivationChanged", {actor: this.actor, item: this, isActive: active});
            });
        }

        return updatePromise;
    }
};
