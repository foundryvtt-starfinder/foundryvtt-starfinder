import { ChoiceDialog } from "../../apps/choice-dialog.js";

export class SFRPGHealingSetting {
    constructor({stamina = false, hitpoints = true, temp = false} = {}) {
        this.healsStamina = stamina;
        this.healsHitpoints = hitpoints;
        this.healsTemporaryHitpoints = temp;
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
    static createDamage(damageAmount, damageTypes = [], isCritical = false, properties = [], options = {}) {
        const parsedDamageTypes = [];
        if (damageTypes.constructor === String) {
            const splitTypes = damageTypes.trim().split(/([,;])+/gi);
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
        damageObject.options = options;
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

        const shiftKey = game.keyboard.downKeys.has("ShiftLeft") || game.keyboard.downKeys.has("ShiftRight");
        let modifier = 0;
        let healingTarget = null;
        let bypassStamina = false;

        // Allow for modification of damage if shift key is held while context button is clicked
        if (shiftKey) {
            // Clicking the close button throws an error, so catch it if it does
            try {
                await Dialog.wait({
                    title: game.i18n.localize("SFRPG.ChatCard.ContextMenu.ModifyDamage"),
                    /* eslint-disable indent */
                    content: `<form>
                        <p>${game.i18n.localize("SFRPG.ChatCard.ContextMenu.ModifyDamageText")}</p>
                        <div class="form-group">
                            <input type="number" id="modifier" placeholder=0 autofocus />
                        </div>
                        ${(multiplier < 0) // Is healing
                        ? `
                            <div class="form-group">
                                <label for="apply-healing">${game.i18n.localize("SFRPG.ChatCard.ContextMenu.ApplyHealingTo")}</label>
                                <select name="apply-healing" id="apply-healing">
                                    <option value="hp">${game.i18n.localize("SFRPG.ChatCard.ContextMenu.HP")}</option>
                                    <option value="sp">${game.i18n.localize("SFRPG.ChatCard.ContextMenu.SP")}</option>
                                    <option value="both">${game.i18n.localize("SFRPG.ChatCard.ContextMenu.HPAndSP")}</option>
                                </select>
                            </div>
                        `
                        : `
                            <div class="form-group">
                                <label for="bypass-stamina">${game.i18n.localize("SFRPG.ChatCard.ContextMenu.BypassStamina")}</label>
                                <input type=checkbox name="bypass-stamina" id="bypass-stamina" />
                            </div>
                            `}
                    </form>`,
                    /* eslint-enable indent */
                    default: "yes",
                    buttons: {
                        yes: {
                            icon: "<i class='fas fa-check'></i>",
                            label: game.i18n.localize("SFRPG.ChatCard.ContextMenu.Accept"),
                            callback: (html) => {
                                modifier = parseInt(html[0].querySelector("#modifier").value) || 0;
                                healingTarget = html[0].querySelector("#apply-healing")?.value || "hp";
                                bypassStamina = html[0].querySelector("#bypass-stamina")?.checked;
                                if (!modifier && (healingTarget === "hp" || bypassStamina === false)) ui.notifications.warn(game.i18n.localize("SFRPG.ChatCard.ContextMenu.NoDamageModifier"));
                            }
                        }
                    }
                });
            } catch {
                ui.notifications.warn(game.i18n.localize("SFRPG.ChatCard.ContextMenu.NoDamageModifier"));
            }

        }

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
            const chatDamageData = chatMessage.flags.damage;
            if (chatDamageData) {
                rolledAmount = chatDamageData.amount;
                damageTypes = chatDamageData.types;
            }

            const chatSpecialMaterials = chatMessage.flags.specialMaterials;
            if (chatSpecialMaterials) {
                for (const [material, enabled] of Object.entries(chatSpecialMaterials)) {
                    if (enabled) {
                        properties.push(material);
                    }
                }
            }
        }

        if (multiplier < 0) {
            const healingSetting = {
                hp: SFRPGHealingSetting.defaultHealing,
                sp: SFRPGHealingSetting.staminaOnly,
                both: SFRPGHealingSetting.staminaAndHealth
            }[healingTarget] || SFRPGHealingSetting.defaultHealing;

            const heal = SFRPGDamage.createHeal(rolledAmount, healingSetting);
            heal.modifier = modifier || 0;
            return this._applyToSelectedActors(heal);
        } else {
            const damage = SFRPGDamage.createDamage(
                rolledAmount,
                damageTypes,
                isCritical,
                properties,
                { bypassStamina }
            );

            damage.multiplier = multiplier;
            damage.modifier = modifier || 0;

            return this._applyToSelectedActors(damage);
        }
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

        // console.log(['Applying damage', damage.toString(), damage]);

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
    * Apply damage to an Actor.
    *
    * @param {SFRPGDamage} damage A SFRPGDamage object, describing the damage to be dealt.
    * @returns A Promise that resolves to the updated Actor
    */
    async _applyActorDamage(damage) {
        if (damage.constructor !== SFRPGDamage) {
            throw `actor._applyActorDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`;
        }

        const actorUpdate = {};
        const actorData = foundry.utils.deepClone(this.system);

        const damagesPerType = [];
        if (damage.damageTypes.length > 0) {
            for (const damageType of damage.damageTypes) {
                if (this.isImmuneToDamageType(damageType)) {
                    continue;
                }

                let totalAppliedDamage = damage.amount / damage.damageTypes.length;

                if (this.isVulnerableToDamageType(damageType)) {
                    totalAppliedDamage *= 1.5;
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
        remainingUndealtDamage += damage.modifier || 0;

        const originalTempHP = parseInt(actorData.attributes.hp.temp) || 0;
        const originalSP = actorData.attributes?.sp?.value || 0;
        const originalHP = actorData.attributes.hp.value;

        if (!damage.isHealing) {
            /** Update temp hitpoints */
            let newTempHP = Math.clamp(originalTempHP - remainingUndealtDamage, 0,
                actorData.attributes.hp.tempmax || actorData.attributes.hp.temp);
            remainingUndealtDamage -= (originalTempHP - newTempHP);

            if (newTempHP <= 0) {
                newTempHP = null;
                actorUpdate['system.attributes.hp.tempmax'] = null;
            }

            actorUpdate["system.attributes.hp.temp"] = newTempHP;

            if (!damage?.options?.bypassStamina) {
            /** Update stamina points */
                const newSP = Math.clamp(originalSP - remainingUndealtDamage, 0, actorData.attributes?.sp?.max || 0);
                remainingUndealtDamage -= (originalSP - newSP);

                actorUpdate["system.attributes.sp.value"] = newSP;
            }

            /** Update hitpoints */
            const newHP = Math.clamp(originalHP - remainingUndealtDamage, 0, actorData.attributes.hp.max);
            remainingUndealtDamage -= (originalHP - newHP);

            actorUpdate["system.attributes.hp.value"] = newHP;

            /** If the remaining undealt damage is equal to or greater than the max hp, the character dies of Massive Damage. */
            if (this.type === "character" && remainingUndealtDamage >= actorData.attributes.hp.max) {
                const localizedDeath = game.i18n.format("SFRPG.CharacterSheet.Warnings.DeathByMassiveDamage", {name: this.name});
                ui.notifications.warn(localizedDeath, {permanent: true});
            }
        } else {
            if (damage.healSettings.healsHitpoints) {
                const newHP = Math.clamp(originalHP + remainingUndealtDamage, 0, actorData.attributes.hp.max);
                remainingUndealtDamage -= (newHP - originalHP);

                actorUpdate["system.attributes.hp.value"] = newHP;
            }

            if (damage.healSettings.healsStamina) {
                const newSP = Math.clamp(originalSP + remainingUndealtDamage, 0, actorData.attributes?.sp?.max);
                remainingUndealtDamage -= (newSP - originalSP);

                actorUpdate["system.attributes.sp.value"] = newSP;
            }

            if (damage.healSettings.healsTemporaryHitpoints) {
                const newTempHP = Math.clamp(originalTempHP + remainingUndealtDamage, 0, actorData.attributes.hp.tempmax);
                remainingUndealtDamage -= (newTempHP - originalTempHP);

                actorUpdate["system.attributes.hp.temp"] = newTempHP;
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
            throw `actor._applyVehicleDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`;
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
            throw `actor._applyStarshipDamage received an invalid damage object, received ${damage.constructor}, expected SFRPGDamage.`;
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
        if (newCT > originalCT) {
            const crossedThresholds = newCT - originalCT;
            const warningMessage = game.i18n.format("SFRPG.StarshipSheet.Damage.CrossedCriticalThreshold", {name: this.name, crossedThresholds: crossedThresholds});
            ui.notifications.warn(warningMessage);
        }

        const promise = this.update(actorUpdate);
        return promise;
    }
};
