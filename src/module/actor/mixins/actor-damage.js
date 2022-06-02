import { SFRPG } from "../../config.js";
import { ChoiceDialog } from "../../apps/choice-dialog.js";

export class SFRPGHealingSetting {
    constructor() {
        this.healsStamina = false;
        this.healsHitpoints = true;
        this.healsTemporaryHitpoints = false;
    }

    toString() {
        return `[SFRPGHealingSetting sp: ${this.healsStamina}, hp: ${this.healsHitpoints}, temp: ${this.healsTemporaryHitpoints}]`;
    }

    // Only heals hitpoints
    static get defaultHealing() {
        return new SFRPGHealingSetting();
    }

    // Only heals stamina
    static get staminaOnly() {
        const healSetting = new SFRPGHealingSetting();
        healSetting.healsStamina = true;
        healSetting.healsHitpoints = false;
        return healSetting;
    }

    // Heals health and stamina
    static get staminaAndHealth() {
        const healSetting = new SFRPGHealingSetting();
        healSetting.healsStamina = true;
        healSetting.healsHitpoints = true;
        return healSetting;
    }

    // Heals hitpoints, stamina, and temporary hitpoints.
    static get healAllProperties() {
        const healSetting = new SFRPGHealingSetting();
        healSetting.healsStamina = true;
        healSetting.healsHitpoints = true;
        healSetting.healsTemporaryHitpoints = true;
        return healSetting;
    }
}

export class SFRPGDamage {
    constructor() {
        this.rawAmount = 0;
        this.damageTypes = [];
        this.properties = [];
        this.bIsCritical = false;
        this.multiplier = 1;
        this.healSettings = null;
    }

    toString() {
        return `[SFRPGDamage amount: ${this.amount}, types: ${JSON.stringify(this.damageTypes)}, props: ${JSON.stringify(this.properties)}, crit: ${this.isCritical}, heal: ${this.healSettings?.toString()}, mult: ${this.multiplier}]`;
    }

    get amount() {
        return Math.abs(this.rawAmount * this.multiplier);
    }

    get isCritical() {
        return this.bIsCritical;
    }

    get isHealing() {
        return this.healSettings != null;
    }

    negatesDamageReduction(damageReductionNegation) {
        if (this.properties.includes(damageReductionNegation)) {
            return true;
        }
        if (this.damageTypes.includes(damageReductionNegation)) {
            return true;
        }
        return false;
    }

    /**
     * Creates a new SFRPGDamage object.
     * 
     * @param {Number} damageAmount The amount of damage dealt.
     * @param {Array or String} damageTypes (Optional, default empty) Either a string or array object containing comma or semi-colon separated strings, e.g.: "fire, piercing", or "f;p", or ["f", "p"], or ["fire", "piercing"]. If left empty, untyped damage is applied.
     * @param {Bool} isCritical (Optional, default false) A boolean value indicating if this damage was critical damage.
     * @param {Array} properties (Optional, default empty) An array containing any additional damage properties, e.g.: ["adamantine", "line", "ripper"]; See SFRPG.specialMaterials, SFRPG.weaponProperties, and SFRPG.starshipWeaponProperties
     */
     static createDamage(damageAmount, damageTypes = [], isCritical = false, properties = []) {
         const parsedDamageTypes = [];
         if (damageTypes.constructor === String) {
             const splitTypes = damageTypes.trim().split(/([^,;])+/gi);
             for (const type of splitTypes) {
                 if (type === ',' || type === ';') {
                     continue;
                 }
                 
                 const trimmedType = SFRPGDamage.parseDamageType(type);
                 if (trimmedType) {
                    parsedDamageTypes.push(trimmedType);
                 }
             }
         } else if (damageTypes.constructor === Array) {
             for (const damageTypeEntry of damageTypes) {
                const trimmedType = SFRPGDamage.parseDamageType(damageTypeEntry);
                if (trimmedType) {
                    parsedDamageTypes.push(trimmedType);
                }
             }
         } else {
            throw `SFRPGDamage.createDamage provided with invalid damageTypes, received ${damageType.constructor}, expected String or Array.`;
         }

         const damageObject = new SFRPGDamage();
         damageObject.rawAmount = damageAmount;
         damageObject.damageTypes = parsedDamageTypes;
         damageObject.bIsCritical = isCritical;
         damageObject.properties = properties;
         return damageObject;
    }

    static createHeal(healedAmount, healSettings = SFRPGHealingSetting.defaultHealing) {
        if (healSettings.constructor !== SFRPGHealingSetting) {
            throw `createHeal provided with invalid type, received ${healSettings.constructor}, expected SFRPGHealingSetting.`;
        }

        const damageObject = new SFRPGDamage();
        damageObject.rawAmount = healedAmount;
        damageObject.healSettings = healSettings;
        return damageObject;
    }

    /**
     * Tries to recognize a damage type and provide it in a consistent scheme.
     * 
     * @param {String} damageType A string containing 1 damage type, e.g. "f", "fire", "Fire", "F".
     */
    static parseDamageType(damageType) {
        if (damageType.constructor !== String) {
            throw `parseDamageType provided with invalid type, received ${damageType.constructor}, expected String.`;
        }
        
        const acronymToDamageMap = {
            "a": "acid",
            "b": "bludgeoning",
            "c": "cold",
            "e": "electricity",
            "f": "fire",
            "p": "piercing",
            "s": "slashing",
            "so": "sonic"
        };

        const lowerType = damageType.trim().toLowerCase();
        if (acronymToDamageMap[lowerType]) {
            return acronymToDamageMap[lowerType];
        }

        return lowerType;
    }
}

export const ActorDamageMixin = (superclass) => class extends superclass {
    /**
     * A utility method used to apply damage to any selected tokens when an option
     * is selected from a chat card context menu.
     * 
     * @param {JQuery} html The jQuery object representing the chat card.
     * @param {Number} multiplier A number used to multiply the damage being applied
     * @returns {Promise<any[]>} 
     */
    static async applyDamageFromContextMenu(html, multiplier) {
        if (html?.length < 1) {
            return null;
        }

        const diceRollElement = html.find('.sfrpg.dice-roll');
        const diceTotal = diceRollElement.data("sfrpgDiceTotal");

        let rolledAmount = Math.floor((diceTotal ?? Math.floor(parseFloat(html.find('.dice-total').text()))));
        const isCritical = diceRollElement.data("sfrpgIsCritical") || false;
        const properties = [];

        const starshipWeaponProperties = diceRollElement.data("sfrpgStarshipWeaponProperties");
        if (starshipWeaponProperties) {
            properties.push(...starshipWeaponProperties);
        }

        let damageTypes = [];
        const chatMessageId = html[0].dataset?.messageId;
        const chatMessage = game.messages.get(chatMessageId);
        if (chatMessage) {
            const chatDamageData = chatMessage.data.flags.damage;
            if (chatDamageData) {
                rolledAmount = chatDamageData.amount;
                damageTypes = chatDamageData.types;
            }

            const chatSpecialMaterials = chatMessage.data.flags.specialMaterials;
            if (chatSpecialMaterials) {
                for (const [material, enabled] of Object.entries(chatSpecialMaterials)) {
                    if (enabled) {
                        properties.push(material);
                    }
                }
            }
        }

        if (multiplier < 0) {
            const heal = SFRPGDamage.createHeal(rolledAmount, SFRPGHealingSetting.defaultHealing);
            return this._applyToSelectedActors(heal);
        } else {
            const damage = SFRPGDamage.createDamage(
                rolledAmount,
                damageTypes,
                isCritical,
                properties
            );
    
            damage.multiplier = multiplier;
    
            return this._applyToSelectedActors(damage);
        }
    }

    static _applyToSelectedActors(damage) {
        const promises = [];
        for (const controlledToken of canvas.tokens?.controlled) {
            const actor = controlledToken.actor;
            const promise = actor.applyDamage(damage)

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
            throw `actor.applyDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`
        }

        //console.log(['Applying damage', damage.toString(), damage]);

        switch (this.data.type) {
            case 'starship':
                return this._applyStarshipDamage(damage);
            case 'vehicle':
                return this._applyVehicleDamage(damage);
            default:
                return this._applyActorDamage(damage);
        }
    }

    /**
    * Apply damage to an Actor.
    * 
    * @param {SFRPGDamage} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Actor
    */
    async _applyActorDamage(damage) {
        if (damage.constructor !== SFRPGDamage) {
            throw `actor._applyActorDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`
        }

        const actorUpdate = {};
        const actorData = foundry.utils.duplicate(this.data.data);

        const damagesPerType = [];
        if (damage.damageTypes.length > 0) {
            for (const damageType of damage.damageTypes) {
                if (this.isImmuneToDamageType(damageType)) {
                    continue;
                }

                let totalAppliedDamage = damage.amount / damage.damageTypes.length;

                if (this.isVulnerableToDamageType(damageType)) {
                    totalAppliedDamage = totalAppliedDamage * 1.5;
                }

                const resistance = this.getDamageMitigationForDamageType(damageType, damage);
                totalAppliedDamage -= resistance;

                totalAppliedDamage = Math.max(0, totalAppliedDamage);

                damagesPerType.push(totalAppliedDamage);
            }
        } else {
            damagesPerType.push(damage.amount);
        }

        const damageRoundingAdvantage = game.settings.get("sfrpg", "damageRoundingAdvantage");
        let bFloorNext = (damageRoundingAdvantage === "defender");
        let remainingUndealtDamage = 0;
        for (const damage of damagesPerType) {
            if (damage % 1 === 0) {
                remainingUndealtDamage += damage;
            } else {
                if (bFloorNext) {
                    remainingUndealtDamage += Math.floor(damage);
                } else {
                    remainingUndealtDamage += Math.ceil(damage);
                }
                bFloorNext = !bFloorNext;
            }
        }

        const originalTempHP = parseInt(actorData.attributes.hp.temp) || 0;
        const originalSP = actorData.attributes.sp.value;
        const originalHP = actorData.attributes.hp.value;

        if (!damage.isHealing) {
            /** Update temp hitpoints */
            let newTempHP = Math.clamped(originalTempHP - remainingUndealtDamage, 0, actorData.attributes.hp.tempmax);
            remainingUndealtDamage = remainingUndealtDamage - (originalTempHP - newTempHP);

            if (newTempHP <= 0) {
                newTempHP = null;
                actorUpdate['data.attributes.hp.tempmax'] = null;
            }
            
            actorUpdate["data.attributes.hp.temp"] = newTempHP;

            /** Update stamina points */
            const newSP = Math.clamped(originalSP - remainingUndealtDamage, 0, actorData.attributes.sp.max);
            remainingUndealtDamage = remainingUndealtDamage - (originalSP - newSP);
            
            actorUpdate["data.attributes.sp.value"] = newSP;

            /** Update hitpoints */
            const newHP = Math.clamped(originalHP - remainingUndealtDamage, 0, actorData.attributes.hp.max);
            remainingUndealtDamage = remainingUndealtDamage - (originalHP - newHP);

            actorUpdate["data.attributes.hp.value"] = newHP;

            /** If the remaining undealt damage is equal to or greater than the max hp, the character dies of Massive Damage. */
            if (this.data.type === "character" && remainingUndealtDamage >= actorData.attributes.hp.max) {
                const localizedDeath = game.i18n.format("SFRPG.CharacterSheet.Warnings.DeathByMassiveDamage", {name: this.name});
                ui.notifications.warn(localizedDeath, {permanent: true});
            }
        } else {
            if (damage.healSettings.healsHitpoints) {
                const newHP = Math.clamped(originalHP + remainingUndealtDamage, 0, actorData.attributes.hp.max);
                remainingUndealtDamage = remainingUndealtDamage - (newHP - originalHP);

                actorUpdate["data.attributes.hp.value"] = newHP;
            }
            
            if (damage.healSettings.healsStamina) {
                const newSP = Math.clamped(originalSP + remainingUndealtDamage, 0, actorData.attributes.sp.max);
                remainingUndealtDamage = remainingUndealtDamage - (newSP - originalSP);

                actorUpdate["data.attributes.sp.value"] = newSP;
            }
            
            if (damage.healSettings.healsTemporaryHitpoints) {
                const newTempHP = Math.clamped(originalTempHP + remainingUndealtDamage, 0, actorData.attributes.hp.tempmax);
                remainingUndealtDamage = remainingUndealtDamage - (newTempHP - originalTempHP);
                
                actorUpdate["data.attributes.hp.temp"] = newTempHP;
            }
        }

        const promise = this.update(actorUpdate);
        return promise;
   }

    /**
    * Checks whether an actor is immune to a specific damage type.
    * 
    * @param {string} damageType The damage type to evaluate.
    * @returns True if the actor is immune to this damage type
    */
    isImmuneToDamageType(damageType) {
        return this.data.data.traits.di.value.includes(damageType);
    }

    /**
    * Checks whether an actor is vulnerable to a specific damage type.
    * 
    * @param {string} damageType The damage type to evaluate.
    * @returns True if the actor is immune to this damage type
    */
    isVulnerableToDamageType(damageType) {
        return this.data.data.traits.dv.value.includes(damageType);
    }

    /**
    * Returns the amount of damage mitigation for a given damage type.
    * 
    * @param {string} damageType The damage type to evaluate.
    * @param {SFRPGDamage} damage (Optional, default null) A damage object from which the damage type originates. Damage reduction is not negated if this is not specified.
    * @returns Amount of damage mitigation applied.
    */
     getDamageMitigationForDamageType(damageType, damage = null) {
        const damageMitigation = this.data.data.traits.damageMitigation;
        if (!damageMitigation) {
            return 0;
        }

        const kineticDamageTypes = ['bludgeoning', 'piercing', 'slashing'];
        if (kineticDamageTypes.includes(damageType)) {
            for (const drEntry of damageMitigation.damageReduction) {
                const isNegated = (!damage || damage.negatesDamageReduction(drEntry.negatedBy));
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
    * Apply damage to a Vehicle Actor.
    * 
    * @param {object} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Vehicle
    */
    async _applyVehicleDamage(damage) {
        if (damage.constructor !== SFRPGDamage) {
            throw `actor._applyVehicleDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`
        }
        
        ui.notifications.warn("Cannot currently apply damage to vehicles using the context menu");
        return null;
    }

    /**
    * Apply damage to a Starship Actor.
    * 
    * @param {object} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Starship
    */
    async _applyStarshipDamage(damage) {
        if (damage.constructor !== SFRPGDamage) {
            throw `actor._applyStarshipDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`
        }
        
        if (damage.isHealing) {
            ui.notifications.warn("Cannot currently apply healing to starships using the context menu.");
            return null;
        }

        /** Ask for quadrant */
        const options = [
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Forward"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Port"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Starboard"),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Aft")
        ];
        const results = await ChoiceDialog.show(
            game.i18n.format("SFRPG.StarshipSheet.Damage.Title", {name: this.name}),
            game.i18n.format("SFRPG.StarshipSheet.Damage.Message"),
            {
                quadrant: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Damage.Quadrant.Quadrant"),
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
            targetKey = "data.quadrants.forward";
            originalData = this.data.data.quadrants.forward;
        } else if (indexOfQuadrant === 1) {
            targetKey = "data.quadrants.port";
            originalData = this.data.data.quadrants.port;
        } else if (indexOfQuadrant === 2) {
            targetKey = "data.quadrants.starboard";
            originalData = this.data.data.quadrants.starboard;
        } else if (indexOfQuadrant === 3) {
            targetKey = "data.quadrants.aft";
            originalData = this.data.data.quadrants.aft;
        } else {
            /** Error, unrecognized quadrant, somehow. */
            return null;
        }

        let actorUpdate = {};
        const newData = duplicate(originalData);

        let remainingUndealtDamage = damage.amount;
        const hasDeflectorShields = this.data.data.hasDeflectorShields;
        const hasAblativeArmor = this.data.data.hasAblativeArmor;
        
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
            remainingUndealtDamage = remainingUndealtDamage - (originalData.shields.value - newData.shields.value);
        }

        if (hasAblativeArmor) {
            newData.ablative.value = Math.max(0, originalData.ablative.value - remainingUndealtDamage);
            remainingUndealtDamage = remainingUndealtDamage - (originalData.ablative.value - newData.ablative.value);
        }

        const originalHullPoints = this.data.data.attributes.hp.value;
        const newHullPoints = Math.clamped(originalHullPoints - remainingUndealtDamage, 0, this.data.data.attributes.hp.max);
        remainingUndealtDamage = remainingUndealtDamage - (originalHullPoints - newHullPoints);

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
            actorUpdate["data.attributes.hp.value"] = newHullPoints;
        }

        const originalCT = Math.floor((this.data.data.attributes.hp.max - originalHullPoints) / this.data.data.attributes.criticalThreshold.value);
        const newCT = Math.floor((this.data.data.attributes.hp.max - newHullPoints) / this.data.data.attributes.criticalThreshold.value);
        if (newCT > originalCT) {
            const crossedThresholds = newCT - originalCT;
            const warningMessage = game.i18n.format("SFRPG.StarshipSheet.Damage.CrossedCriticalThreshold", {name: this.name, crossedThresholds: crossedThresholds});
            ui.notifications.warn(warningMessage);
        }
        if (damage.isCritical && newHullPoints !== originalHullPoints) {
            const warningMessage = (newCT > originalCT) ?  "SFRPG.StarshipSheet.Damage.Nat20WithThreshold" : "SFRPG.StarshipSheet.Damage.Nat20"
            ui.notifications.warn(game.i18n.format(warningMessage));
        }

        const promise = this.update(actorUpdate);
        return promise;
    }
}
