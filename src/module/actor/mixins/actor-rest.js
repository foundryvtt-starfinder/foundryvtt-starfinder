import { ShortRestDialog } from "../../apps/short-rest.js";
import { DroneRepairDialog } from "../../apps/drone-repair-dialog.js";

export const ActorRestMixin = (superclass) => class extends superclass {
    /**
     * Cause this Actor to take a Short 10 minute Rest
     * During a Short Rest resources and limited item uses may be recovered
     * @param {boolean} dialog  Present a dialog window which allows for spending Resolve Points as part of the Short Rest
     * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
     * @return {Promise}        A Promise which resolves once the short rest workflow has completed
     */
     async shortRest({ dialog = true, chat = true } = {}) {
        const data = this.data.data;

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
            
            this.update({ "data.attributes.sp.value": sp.max, "data.attributes.rp.value": updatedRP });
        }

        // Restore resources that reset on short rests
        const updateData = {};
        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && r.sr) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }

        await this.update(updateData);

        // Reset items that restore their uses on a short rest
        const items = this.items.filter(item => item.data.data.uses && (item.data.data.uses.per === "sr"));
        const updateItems = items.map(item => {
            return {
                _id: item.id,
                "data.uses.value": item.getMaxUses()
            }
        });

        await this.updateEmbeddedDocuments("Item", updateItems);

        // Notify chat what happened
        if (chat) {
            let msg = game.i18n.format("SFRPG.RestSChatMessage", { name: this.name });
            if (drp > 0) {
                msg = game.i18n.format("SFRPG.RestSChatMessageRestored", { name: this.name, spentRP: drp, regainedSP: dsp });
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
        const data = this.data.data;

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
        updateData["data.attributes.hp.value"] = newHP;
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
        const data = duplicate(this.data.data);
        const updateData = {};

        if (dialog) {
            try {
                await ShortRestDialog.longRestDialog(this);
            } catch (err) {
                return;
            }
        }

        // Recover HP, SP, and RP
        let dhp = data.attributes.hp.max === data.attributes.hp.value ? 0 :
            data.details.level.value > (data.attributes.hp.max - data.attributes.hp.value) ?
                data.attributes.hp.max - data.attributes.hp.value : data.details.level.value;
        let dsp = data.attributes.sp.max - data.attributes.sp.value;
        let drp = data.attributes.rp.max - data.attributes.rp.value;
        updateData['data.attributes.hp.value'] = Math.min(data.attributes.hp.value + data.details.level.value, data.attributes.hp.max);
        updateData['data.attributes.sp.value'] = data.attributes.sp.max;
        updateData['data.attributes.rp.value'] = data.attributes.rp.max;

        // Heal Ability damage
        for (let [abl, ability] of Object.entries(data.abilities)) {
            if (ability.damage && ability.damage > 0) {
                updateData[`data.abilities.${abl}.damage`] = --ability.damage;
            } 
        }

        for (let [k, r] of Object.entries(data.resources)) {
            if (r.max && (r.sr || r.lr)) {
                updateData[`data.resources.${k}.value`] = r.max;
            }
        }

        for (let [k, v] of Object.entries(data.spells)) {
            if (!v.max) continue;
            updateData[`data.spells.${k}.value`] = v.max;
        }

        const items = this.items.filter(i => i.data.data.uses && ["sr", "lr", "day"].includes(i.data.data.uses.per));
        const updateItems = items.map(item => {
            return {
                _id: item.id,
                "data.uses.value": item.getMaxUses()
            }
        });

        await this.update(updateData);
        await this.updateEmbeddedDocuments("Item", updateItems);

        if (chat) {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this}),
                content: `${this.name} takes a night's rest and recovers ${dhp} Hit points, ${dsp} Stamina points, and ${drp} Resolve points.`
            });
        }

        const restResults = {
            actor: this,
            restType: "long",
            deltaHitpoints: dhp,
            deltaStamina: dsp,
            deltaResolve: drp,
            updateData: updateData,
            updateItems: updateItems
        };

        Hooks.callAll("onActorRest", restResults);

        return restResults;
    }
}
