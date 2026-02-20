import { ChoiceDialog } from "../../apps/choice-dialog.js";
import { ChatMessageSFRPG } from "../../chat/message.js";

export class SFRPGDamage {
    constructor(data) {
        this.rawAmount          = data.rawAmount ?? 0;
        this.damageTypes        = data.damageTypes ?? [];
        this.damageProperties   = data.damageProperties ?? [];
        this.critical           = data.critical ?? false;
        this.multiplier         = data.multiplier ?? 1;
        this.bypassStamina      = data.bypassStamina ?? false;
        this.healSettings       = data.healSettings ?? null;
    }

    toString() {
        return `[SFRPGDamage amount: ${this.amount}, types: ${JSON.stringify(this.damageTypes)}, props: ${JSON.stringify(this.damageProperties)}, crit: ${this.isCritical}, heal: ${this.healSettings?.toString()}, mult: ${this.multiplier}]`;
    }

    get amount() {
        let amount = Math.abs(this.rawAmount * this.multiplier);
        if (amount < 1) amount = 1;
        return amount;
    }

    get isCritical() {
        return this.critical;
    }

    get isDamage() {
        return !this.isHealing;
    }

    get isHealing() {
        return this.damageTypes.some(type => Object.keys(CONFIG.SFRPG.healingTypes).includes(type));
    }

    negatesDamageReduction(damageReductionNegation, damageType) {
        // Change the damage match condition if multiple kinetic damage types are included in an && operator
        const damageMatch = (drNegationArray, drNegation, damageType) => {
            const b = drNegationArray.includes('bludgeoning') ? 1 : 0;
            const p = drNegationArray.includes('piercing') ? 1 : 0;
            const s = drNegationArray.includes('slashing') ? 1 : 0;
            if (b + p + s >= 2) {
                return this.damageTypes.includes(drNegation);
            } else {
                return damageType === drNegation;
            }
        };

        // For && separator, return true if all values match; for || separator, return true if any values match
        if (damageReductionNegation.includes('&&')) {
            const drNegationArray = damageReductionNegation.split('&&').map(type => type.trim().toLowerCase());
            for (const drNegation of drNegationArray) {
                if (!(this.damageProperties.includes(drNegation) || damageMatch(drNegationArray, drNegation, damageType))) return false;
            }
            return true;
        } else {
            const drNegationArray = damageReductionNegation.split('||').map(type => type.trim().toLowerCase());
            for (const drNegation of drNegationArray) {
                if (this.damageProperties.includes(drNegation) || damageType === drNegation) return true;
            }
            return false;
        }
    }
}

export const ActorDamageMixin = (superclass) => class extends superclass {
    /**
     * A utility method used to apply damage to any selected tokens when an option
     * is selected from a chat card context menu.
     *
     * @param {HTML} html The HTML object representing the chat card.
     * @param {Number} multiplier A number used to multiply the damage being applied
     * @returns {Promise<any[]>}
     */
    static async applyDamageFromContextMenu(html, multiplier) {
        if (html?.length < 1) return null;

        // Get the chat message document defining the damage
        const chatMessageId = html.dataset?.messageId;
        const chatMessage = game.messages.get(chatMessageId);
        if (!chatMessage || chatMessage?.type !== "damage") return null;

        // Verify that we have at least one damage roll
        const damageRolls = chatMessage.rolls.filter(roll => roll.isDamageRoll);
        if (damageRolls.length < 1) return null;

        // Add descriptors, starship properties, special materials, weapon properties, and magic status
        const damageProperties = [];
        damageProperties.push(...chatMessage.system.descriptors);
        damageProperties.push(...chatMessage.system.starshipWeaponProperties);

        for (const [key, value] of Object.entries(chatMessage.system.specialMaterials)) {
            if (value) damageProperties.push(key);
        }

        for (const [key, propData] of Object.entries(chatMessage.system.properties)) {
            if (propData.value) damageProperties.push(key);
        }

        if (chatMessage.system.damage.isMagic) damageProperties.push("magic");

        // Create an array of damage application promises
        const damagePromises = [];
        for (const roll of damageRolls) {
            let damageTypes = roll.rollCriteria.damageTypes;
            // If appliying in reverse, assume we want to reverse a previous application of damage/healing
            if (multiplier < 0) {
                damageTypes = ["healing", "stamina", "tempHP"];
            }
            const damage = new SFRPGDamage({
                rawAmount: roll.total,
                damageTypes,
                critical: chatMessage.system.critical.isCritical,
                damageProperties: damageProperties,
                multiplier
            });
            damagePromises.push(this._applyToSelectedActors(damage));
        }
        return damagePromises;
    }

    static _applyToSelectedActors(damage) {
        const promises = [];
        for (const controlledToken of (canvas.tokens?.controlled || [])) {
            const actor = controlledToken.actor;
            const promise = actor.applyDamage(damage);

            if (promise) {
                promises.push(promise);
            }
        }

        return Promise.all(promises);
    }

    /**
     * Applies damage to the Actor.
     *
     * @param {SFRPGDamage} damage The damage object to be applied to this actor.
     */
    async applyDamage(damage) {
        if (damage.constructor !== SFRPGDamage) {
            throw `actor.applyDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`;
        }

        switch (this.type) {
            case 'starship':
                return this._applyStarshipDamage(damage);
            case 'vehicle':
                return this._applyVehicleDamage(damage);
            default:
                return this._applyActorDamage(damage);
        }
    }

    /**
    * Checks whether an actor is immune to a specific damage type.
    *
    * @param {string} damageType The damage type to evaluate.
    * @returns True if the actor is immune to this damage type
    */
    isImmuneToDamageType(damageType) {
        return this.system.traits.di.value.includes(damageType);
    }

    /**
    * Checks whether an actor is vulnerable to a specific damage type.
    *
    * @param {string} damageType The damage type to evaluate.
    * @returns True if the actor is immune to this damage type
    */
    isVulnerableToDamageType(damageType) {
        return this.system.traits.dv.value.includes(damageType);
    }

    /**
    * Returns the amount of damage mitigation for a given damage type.
    *
    * @param {string} damageType The damage type to evaluate.
    * @param {SFRPGDamage} damage (Optional, default null) A damage object from which the damage type originates. Damage reduction is not negated if this is not specified.
    * @returns Amount of damage mitigation applied.
    */
    getDamageMitigationForDamageType(damageType, damage = null) {
        const damageMitigation = this.system.traits.damageMitigation;
        if (!damageMitigation) {
            return 0;
        }

        const kineticDamageTypes = ['bludgeoning', 'piercing', 'slashing'];
        if (kineticDamageTypes.includes(damageType)) {
            for (const drEntry of damageMitigation.damageReduction) {
                const isNegated = (!damage || damage.negatesDamageReduction(drEntry.negatedBy, damageType));
                if (!isNegated) {
                    return drEntry.value;
                }
            }
        }

        const energyDamageTypes = ['acid', 'cold', 'electricity', 'fire', 'sonic'];
        if (energyDamageTypes.includes(damageType)) {
            const erEntry = damageMitigation.energyResistance[damageType];
            if (erEntry) {
                return erEntry.value;
            }
        }

        return 0;
    }

    /**
    * Apply damage to a Starship Actor.
    *
    * @param {object} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Starship
    */
    async _applyStarshipDamage(damage) {

        if (damage.isHealing) {
            ui.notifications.warn("Cannot currently apply healing to starships using the context menu.");
            return null;
        }

        /** Ask for quadrant */
        const options = [
            game.i18n.format("SFRPG.StarshipSheet.Quadrants.Forward"),
            game.i18n.format("SFRPG.StarshipSheet.Quadrants.Port"),
            game.i18n.format("SFRPG.StarshipSheet.Quadrants.Starboard"),
            game.i18n.format("SFRPG.StarshipSheet.Quadrants.Aft")
        ];
        const results = await ChoiceDialog.show(
            game.i18n.format("SFRPG.StarshipSheet.Damage.Title", {name: this.name}),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Message"),
            {
                quadrant: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Quadrants.Quadrant"),
                    options: options,
                    default: options[0]
                }
            }
        );

        if (results.resolution !== "ok") {
            return null;
        }

        let targetKey = null;
        let originalData = null;

        const selectedQuadrant = results.result.quadrant;
        const indexOfQuadrant = options.indexOf(selectedQuadrant);
        if (indexOfQuadrant === 0) {
            targetKey = "system.quadrants.forward";
            originalData = this.system.quadrants.forward;
        } else if (indexOfQuadrant === 1) {
            targetKey = "system.quadrants.port";
            originalData = this.system.quadrants.port;
        } else if (indexOfQuadrant === 2) {
            targetKey = "system.quadrants.starboard";
            originalData = this.system.quadrants.starboard;
        } else if (indexOfQuadrant === 3) {
            targetKey = "system.quadrants.aft";
            originalData = this.system.quadrants.aft;
        } else {
            /** Error, unrecognized quadrant, somehow. */
            return null;
        }

        const actorUpdate = {};
        const newData = foundry.utils.deepClone(originalData);

        let remainingUndealtDamage = damage.amount + damage.modifier;

        if (remainingUndealtDamage % 1 !== 0) {
            const damageRoundingAdvantage = game.settings.get("sfrpg", "damageRoundingAdvantage");
            if (damageRoundingAdvantage === "defender") {
                remainingUndealtDamage = Math.floor(remainingUndealtDamage);
            } else {
                remainingUndealtDamage = Math.ceil(remainingUndealtDamage);
            }
        }

        const hasDeflectorShields = this.system.hasDeflectorShields;
        const hasAblativeArmor = this.system.hasAblativeArmor;

        if (hasDeflectorShields) {
            if (originalData.shields.value > 0) {
                // Deflector shields are twice as effective against attacks from melee, ramming, and ripper starship weapons, so the starship ignores double the amount of damage from such attacks.
                // TODO: Any attack that would ignore a fraction or all of a target’s shields instead reduces the amount of damage the deflector shields ignore by an equal amount, rounded in the defender’s favor (e.g., deflector shields with a defense value of 5 would reduce damage from a burrowing weapon [Pact Worlds 153] by 3)
                const isMelee = damage.properties.includes('melee');
                const isRamming = damage.properties.includes('ramming');
                const isRipper = damage.properties.includes('ripper');

                const shieldMultiplier = (isMelee || isRamming || isRipper) ? 2 : 1;
                remainingUndealtDamage = Math.max(0, remainingUndealtDamage - (originalData.shields.value * shieldMultiplier));
            }
        } else {
            newData.shields.value = Math.max(0, originalData.shields.value - remainingUndealtDamage);
            remainingUndealtDamage -= (originalData.shields.value - newData.shields.value);
        }

        if (hasAblativeArmor) {
            newData.ablative.value = Math.max(0, originalData.ablative.value - remainingUndealtDamage);
            remainingUndealtDamage -= (originalData.ablative.value - newData.ablative.value);
        }

        const originalHullPoints = this.system.attributes.hp.value;
        const newHullPoints = Math.clamp(originalHullPoints - remainingUndealtDamage, 0, this.system.attributes.hp.max);
        remainingUndealtDamage -= (originalHullPoints - newHullPoints);

        /** Deflector shields only drop in efficiency when the ship takes hull point damage. */
        if (hasDeflectorShields) {
            let deflectorShieldDamage = 0;

            if (newHullPoints !== originalHullPoints) {
                deflectorShieldDamage = 1;

                // Weapons with the array or line special property that damage a starship’s Hull Points overwhelm its deflector shields, reducing their defense value in that quadrant by 2
                if (damage.properties.includes('array') || damage.properties.includes('line')) {
                    deflectorShieldDamage = 2;
                }

                // TODO: ..whereas vortex weapons that deal Hull Point damage reduce the target’s deflector shields’ defense value in each quadrant by 1d4.
                else if (damage.properties.includes('vortex')) {
                    if (this.options.debug) {
                        console.log("Vortex Extra Deflector Damage Not Implemented");
                    }
                }
            }

            // Any successful attack by a weapon with the buster special property (or another special property that deals reduced damage to Hull Points) reduces the deflector shields’ defense value in the struck quadrant by 2, whether or not the attack damaged the target’s Hull Points.
            if (damage.properties.includes('buster')) {
                deflectorShieldDamage = 2;
            }

            // When a gunnery check results in a natural 20, any decrease to the target’s deflector shield’s defense value from the attack is 1 greater.
            deflectorShieldDamage += damage.isCritical ? 1 : 0;

            newData.shields.value = Math.max(0, newData.shields.value - deflectorShieldDamage);
        }

        if (originalData.shields.value !== newData.shields.value) {
            actorUpdate[targetKey + ".shields.value"] = newData.shields.value;
        }

        if (originalData.ablative.value !== newData.ablative.value) {
            actorUpdate[targetKey + ".ablative.value"] = newData.ablative.value;
        }

        if (newHullPoints !== originalHullPoints) {
            actorUpdate["system.attributes.hp.value"] = newHullPoints;
        }

        const originalCT = Math.floor((this.system.attributes.hp.max - originalHullPoints) / this.system.attributes.criticalThreshold.value);
        const newCT = Math.floor((this.system.attributes.hp.max - newHullPoints) / this.system.attributes.criticalThreshold.value);
        let timesToRoll = 0;
        const rollMode = this.token?.disposition === -1 && game.settings.get("sfrpg", "hideHostileStarshipCrit")
            ? CONST.DICE_ROLL_MODES.PRIVATE
            : game.settings.get("core", "rollMode");

        if (newCT > originalCT) {
            const crossedThresholds = newCT - originalCT;
            const warningMessage = game.i18n.format("SFRPG.StarshipSheet.Damage.CrossedCriticalThreshold", {name: this.name, crossedThresholds: crossedThresholds});
            timesToRoll += crossedThresholds;
            ui.notifications.warn(warningMessage);
            const chatData = {
                user: game.user.id,
                speaker: ChatMessageSFRPG.getSpeaker({actor: this}),
                content: warningMessage,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER
            };
            ChatMessageSFRPG.applyRollMode(chatData, rollMode);
            ChatMessageSFRPG.create(chatData);
        }

        if (damage.isCritical && newHullPoints !== originalHullPoints) {
            timesToRoll++;
            const warningMessage = game.i18n.format((newCT > originalCT) ?  "SFRPG.StarshipSheet.Damage.Nat20WithThreshold" : "SFRPG.StarshipSheet.Damage.Nat20", {name: this.name});
            ui.notifications.warn(warningMessage);
            const chatData = {
                user: game.user.id,
                speaker: ChatMessageSFRPG.getSpeaker({actor: this}),
                content: warningMessage,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER
            };
            ChatMessageSFRPG.applyRollMode(chatData, rollMode);
            ChatMessageSFRPG.create(chatData);
        }

        if (timesToRoll > 0) {
            if (game.settings.get("sfrpg", "autoRollCritEffect")) {
                const pack = await game.packs.get('sfrpg.tables');
                const index = pack.index ?? await pack.getIndex();
                const obj = index.getName("Starship Critical Damage Effects");
                const doc = await pack.getDocument(obj._id);
                doc.drawMany(timesToRoll, { rollMode: rollMode });
            }
        }

        const promise = this.update(actorUpdate);
        return promise;
    }

    /**
    * Apply damage to a Vehicle Actor.
    *
    * @param {object} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Vehicle
    */
    async _applyVehicleDamage(damage) {
        ui.notifications.warn("Cannot currently apply damage to vehicles using the context menu");
        return null;
    }

    /**
    * Apply damage to an Actor.
    *
    * @param {SFRPGDamage} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Actor
    */
    async _applyActorDamage(damage) {

        const actorUpdate = {};
        const actorData = this.system;

        const damagePerType = [];
        if (damage.isDamage && damage.damageTypes.length > 0) {
            for (const damageType of damage.damageTypes) {
                if (this.isImmuneToDamageType(damageType)) continue;

                let totalAppliedDamage = damage.amount / damage.damageTypes.length;

                if (this.isVulnerableToDamageType(damageType)) totalAppliedDamage *= 1.5;

                const resistance = this.getDamageMitigationForDamageType(damageType, damage);
                totalAppliedDamage -= resistance;

                totalAppliedDamage = Math.max(0, totalAppliedDamage);

                damagePerType.push(totalAppliedDamage);
            }
        } else {
            damagePerType.push(damage.amount);
        }

        // Divide the damage by the number of damage types there are. Alternate rounding damage up and down
        const damageRoundingAdvantage = game.settings.get("sfrpg", "damageRoundingAdvantage");
        let floorNext = (damageRoundingAdvantage === "defender");
        let remainingUndealtDamage = 0;
        for (const damage of damagePerType) {
            if (damage % 1 === 0) {
                remainingUndealtDamage += damage;
            } else {
                if (floorNext) remainingUndealtDamage += Math.floor(damage);
                else remainingUndealtDamage += Math.ceil(damage);
                floorNext = !floorNext;
            }
        }

        // Static instances of the actor's current hp/sp/temphp
        const originalTempHP = parseInt(actorData.attributes.hp.temp) || 0;
        const originalSP = actorData.attributes?.sp?.value || 0;
        const originalHP = actorData.attributes.hp.value;

        // If the damage is not healing, assume it's damage
        if (damage.isDamage) {

            // Update temp hitpoints
            const newTempHP = Math.clamp(originalTempHP - remainingUndealtDamage, 0, actorData.attributes.hp.tempmax || 0);
            remainingUndealtDamage -= (originalTempHP - newTempHP);
            actorUpdate["system.attributes.hp.temp"] = newTempHP;

            // Update stamina points
            if (!damage.bypassStamina) {
                const newSP = Math.clamp(originalSP - remainingUndealtDamage, 0, actorData.attributes?.sp?.max || 0);
                remainingUndealtDamage -= (originalSP - newSP);
                actorUpdate["system.attributes.sp.value"] = newSP;
            }

            // Update hitpoints
            const newHP = Math.clamp(originalHP - remainingUndealtDamage, 0, actorData.attributes.hp.max);
            remainingUndealtDamage -= (originalHP - newHP);
            actorUpdate["system.attributes.hp.value"] = newHP;

            // Display Massive Damage notification if the remaining undealt damage is equal to or greater than the max hp
            if (this.type === "character" && remainingUndealtDamage >= actorData.attributes.hp.max) {
                const localizedDeath = game.i18n.format("SFRPG.CharacterSheet.Warnings.DeathByMassiveDamage", {name: this.name});
                ui.notifications.warn(localizedDeath, {permanent: true});
            }

        // Handle healing
        } else {

            if (damage.damageTypes.includes("healing")) {
                const newHP = Math.clamp(originalHP + remainingUndealtDamage, 0, actorData.attributes.hp.max);
                remainingUndealtDamage -= (newHP - originalHP);
                actorUpdate["system.attributes.hp.value"] = newHP;
            }

            if (damage.damageTypes.includes("stamina")) {
                const newSP = Math.clamp(originalSP + remainingUndealtDamage, 0, actorData.attributes?.sp?.max);
                remainingUndealtDamage -= (newSP - originalSP);
                actorUpdate["system.attributes.sp.value"] = newSP;
            }

            if (damage.damageTypes.includes("tempHP")) {
                const newTempHP = Math.clamp(originalTempHP + remainingUndealtDamage, 0, actorData.attributes.hp.tempmax || 0);
                remainingUndealtDamage -= (newTempHP - originalTempHP);
                actorUpdate["system.attributes.hp.temp"] = newTempHP;
            }
        }

        const promise = this.update(actorUpdate);
        return promise;
    }
};
