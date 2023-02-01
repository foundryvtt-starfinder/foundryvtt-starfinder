import { ShortRestDialog } from "../../apps/short-rest.js";
import { DroneRepairDialog } from "../../apps/drone-repair-dialog.js";
import { SFRPG } from "../../config.js";

export const ActorRestMixin = (superclass) => class extends superclass {
    /**
     * Cause this Actor to take a Short 10 minute Rest
     * During a Short Rest resources and limited item uses may be recovered
     * @param {boolean} dialog  Present a dialog window which allows for spending Resolve Points as part of the Short Rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the short rest workflow has completed
     */
    async shortRest({ dialog = true, chat = true } = {}) {
        const data = this.system;

        // Ask user to confirm if they want to rest, and if they want to restore stamina points
        let sp = data.attributes.sp;
        let rp = data.attributes.rp;
        let canRestoreStaminaPoints = rp.value > 0 && sp.value < sp.max;

        let restoreStaminaPoints = false;

        if (dialog) {
            const restingResults = await ShortRestDialog.shortRestDialog({ actor: this, canRestoreStaminaPoints: canRestoreStaminaPoints });
            if (!restingResults.resting) return;
            restoreStaminaPoints = restingResults.restoreStaminaPoints;
        }

        let drp = 0;
        let dsp = 0;
        if (restoreStaminaPoints && canRestoreStaminaPoints) {
            drp = 1;
            let updatedRP = Math.max(rp.value - drp, 0);
            dsp = Math.min(sp.max - sp.value, sp.max);

            this.update({ "system.attributes.sp.value": sp.max, "system.attributes.rp.value": updatedRP });
        }

        // Restore resources that reset on short rests
        const updateData = {};
        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && r.sr) {
                updateData[`system.resources.${k}.value`] = r.max;
            }
        }

        await this.update(updateData);

        // Reset items that restore their uses on a short rest
        const items = this.items.filter(item => item.system.uses && (item.system.uses.per === "sr"));
        const updateItems = items.map(item => {
            return {
                _id: item.id,
                "system.uses.value": item.getMaxUses()
            };
        });

        await this.updateEmbeddedDocuments("Item", updateItems);

        // Notify chat what happened
        if (chat) {
            let msg = game.i18n.format("SFRPG.Rest.Short.ChatMessage.Message", { name: this.name });
            if (drp > 0) {
                msg = game.i18n.format("SFRPG.Rest.Short.ChatMessage.Restored", { name: this.name, spentRP: drp, regainedSP: dsp });
            }

            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: msg,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }

        const restResults = {
            actor: this,
            restType: "short",
            deltaStamina: dsp,
            deltaResolve: drp,
            updateData: updateData,
            updateItems: updateItems
        };

        Hooks.callAll("onActorRest", restResults);

        return restResults;
    }

    /**
     * Cause this Actor to repair itself following drone repairing rules
     * During a drone repair, some amount of drone HP may be recovered.
     * @param {boolean} dialog  Present a dialog window which allows for utilizing the Repair Drone (Ex) feat while repairing.
     * @param {boolean} chat    Summarize the results of the repair workflow as a chat message
     * @return {Promise}        A Promise which resolves once the repair workflow has completed
     */
    async repairDrone({ dialog = true, chat = true } = {}) {
        const data = this.system;

        let hp = data.attributes.hp;
        if (hp.value >= hp.max) {
            let message = game.i18n.format("SFRPG.RepairDroneUnnecessary", { name: this.name });
            ui.notifications.info(message);
            return;
        }

        let improvedRepairFeat = false;
        if (dialog) {
            const dialogResults = await DroneRepairDialog.droneRepairDialog({ actor: this, improvedRepairFeat: improvedRepairFeat });
            if (!dialogResults.repairing) return;
            improvedRepairFeat = dialogResults.improvedRepairFeat;
        }

        let oldHP = hp.value;
        let maxRepairAmount = Math.floor(improvedRepairFeat ? hp.max * 0.25 : hp.max * 0.1);
        let newHP = Math.min(hp.max, hp.value + maxRepairAmount);
        let dhp = newHP - oldHP;

        const updateData = {};
        updateData["system.attributes.hp.value"] = newHP;
        await this.update(updateData);

        // Notify chat what happened
        if (chat) {
            let msg = game.i18n.format("SFRPG.RepairDroneChatMessage", { name: this.name, regainedHP: dhp });

            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: msg,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }

        const restResults = {
            actor: this,
            restType: "repair",
            deltaHitpoints: dhp,
            updateData: updateData
        };

        Hooks.callAll("onActorRest", restResults);

        return restResults;
    }

    /**
     * Take a long nights rest, recovering HP, SP, RP, resources, and spell slots
     * @param {boolean} dialog  Present a confirmation dialog window whether or not to take a long rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the long rest workflow has completed
     */
    async longRest({ dialog = true, chat = true } = {}) {
        const data = duplicate(this.system);
        const updateData = {};

        if (dialog) {
            try {
                await ShortRestDialog.longRestDialog(this);
            } catch (err) {
                return;
            }
        }

        // Recover HP, SP, and RP
        let dhp = data.attributes.hp.max === data.attributes.hp.value
            ? 0
            : data.details.level.value > (data.attributes.hp.max - data.attributes.hp.value)
                ? data.attributes.hp.max - data.attributes.hp.value
                : data.details.level.value;
        let dsp = data.attributes.sp.max - data.attributes.sp.value;
        let drp = data.attributes.rp.max - data.attributes.rp.value;
        updateData['system.attributes.hp.value'] = Math.min(data.attributes.hp.value + data.details.level.value, data.attributes.hp.max);
        updateData['system.attributes.sp.value'] = data.attributes.sp.max;
        updateData['system.attributes.rp.value'] = data.attributes.rp.max;

        // Heal Ability damage
        const restoredAbilityDamages = [];
        for (let [abl, ability] of Object.entries(data.abilities)) {
            if (ability.damage && ability.damage > 0) {
                updateData[`system.abilities.${abl}.damage`] = --ability.damage;
                restoredAbilityDamages.push({ability: abl, amount: 1});
            }
        }

        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && (r.sr || r.lr)) {
                updateData[`system.resources.${k}.value`] = r.max;
            }
        }

        let deltaSpellSlots = 0;
        for (let spellLevel = 1; spellLevel <= 6; spellLevel++) {
            const spellLevelData = data.spells[`spell${spellLevel}`];
            if (spellLevelData.value < spellLevelData.max) {
                updateData[`system.spells.spell${spellLevel}.value`] = spellLevelData.max;
                deltaSpellSlots += (spellLevelData.max - spellLevelData.value);
            }

            if (spellLevelData.perClass) {
                for (const [classKey, classData] of Object.entries(spellLevelData.perClass)) {
                    if (classData.value < classData.max) {
                        updateData[`system.spells.spell${spellLevel}.perClass.${classKey}.value`] = classData.max;
                        deltaSpellSlots += (classData.max - classData.value);
                    }
                }
            }
        }

        const items = this.items.filter(i => i.system.uses && ["sr", "lr", "day"].includes(i.system.uses.per) && i.system.uses.value < i.getMaxUses());
        const updateItems = items.map(item => {
            return {
                _id: item.id,
                "system.uses.value": item.getMaxUses()
            };
        });

        await this.update(updateData);
        await this.updateEmbeddedDocuments("Item", updateItems);

        if (chat) {
            const bulletPoint = '<br/><span><i class="fas fa-circle" style="font-size: 6px; vertical-align: middle; height: 7px;"></i></span> ';
            let content = "";
            if (dhp || dsp || drp || deltaSpellSlots || restoredAbilityDamages.length > 0 || items.length > 0) {
                content = game.i18n.format("SFRPG.Rest.Long.ChatMessage.Header", {name: this.name});
                if (dhp) { content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.HitPoints", {deltaHP: dhp}); }
                if (dsp) { content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.StaminaPoints", {deltaSP: dsp}); }
                if (drp) { content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.ResolvePoints", {deltaRP: drp}); }
                if (deltaSpellSlots) { content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.SpellSlots", {deltaSS: deltaSpellSlots}); }
                for (const restoredAbilityDamage of restoredAbilityDamages) {
                    content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.AbilityDamage", {ability: SFRPG.abilities[restoredAbilityDamage.ability], amount: restoredAbilityDamage.amount});
                }
                for (const rechargedItem of items) {
                    content += bulletPoint + game.i18n.format("SFRPG.Rest.Long.ChatMessage.Item", {itemName: rechargedItem.name});
                }
            } else {
                content = game.i18n.format("SFRPG.Rest.Long.ChatMessage.HeaderNoRecovery", {name: this.name});
            }

            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: content
            });
        }

        const restResults = {
            actor: this,
            restType: "long",
            deltaHitpoints: dhp,
            deltaStamina: dsp,
            deltaResolve: drp,
            deltaSpellSlots: deltaSpellSlots,
            restoredAbilityDamages: restoredAbilityDamages.length,
            updateData: updateData,
            updateItems: updateItems
        };

        Hooks.callAll("onActorRest", restResults);

        return restResults;
    }
};
