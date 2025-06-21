export default class SFRPGTokenDocument extends TokenDocument {
    async _preCreate(data, options, user) {
        if (this.actor) {
            // Set the prototype token's movement type to the main movement defined in the actor's speed
            const mainMovementAction = CONFIG.SFRPG.movementOptions[this.actor.system.attributes.speed.mainMovement] ?? null;
            const updates = {};
            if (this.actor.type === "starship") {
                updates.movementAction = "fly";
            } else if (CONFIG.SFRPG.actorsCharacterScale.includes(this.actor.type)) {
                updates.movementAction = this.hasStatusEffect("prone") ? "crawl" : mainMovementAction;
            }

            this.updateSource(updates);
        }
        return super._preCreate(data, options, user);
    }

    async _onUpdateBaseActor(data, options, user) {
        if (this.actor) {
            this.updateMovement(this.actor);
        }
        return super._onUpdate(data, options, user);
    }

    /**
     * Hijack Token health bar rendering to include temporary and temp-max health in the bar display
     *
     * @param {string} barName The name of the bar attribute to target.
     * @param {object} [optional] Optional parameters that can be passed into the method.
     * @param {string} [optional.alternative] An alternative attribute path to get instead of the default one
     * @returns
     */
    getBarAttribute(barName, {alternative} = {}) {
        const attr = alternative || (barName ? this[barName].attribute : null);
        if ( !attr || !this.actor ) return null;
        const data = foundry.utils.getProperty(this.actor.system, attr);
        if ( (data === null) || (data === undefined) ) return null;
        const model = game.model.Actor[this.actor.type];

        // Single values
        if ( Number.isNumeric(data) ) {
            return {
                type: "value",
                attribute: attr,
                value: Number(data),
                editable: foundry.utils.hasProperty(model, attr)
            };
        }

        // Attribute objects
        else if ( ("value" in data) && ("max" in data) ) {
            let value = parseInt(data.value || 0);
            let max = parseInt(data.max || 0);

            if (attr === "attributes.hp") {
                value += parseInt(data.temp || 0);
                max += parseInt(data.tempmax || 0);
            }

            return {
                type: "bar",
                attribute: attr,
                value: value,
                max: max,
                editable: foundry.utils.hasProperty(model, `${attr}.value`)
            };
        }

        // Otherwise null
        return null;
    }

    /**
     * Updates the default and available movement types based on the actor speed settings and
     * whether or not the token has the "prone" condition.
     */
    updateMovement(actor) {
        const mainMovement = actor.system.attributes.speed.mainMovement;
        if (this.hasStatusEffect("prone")) {
            this.update({movementAction: "crawl"});
        } else {
            this.update({movementAction: this.movementAction !== "crawl" ? this.movementAction : CONFIG.SFRPG.movementOptions[mainMovement]});
        }
    }

    /**
     * @override to test against actor conditions too
     * @param {string} statusId     The status effect ID as defined in CONFIG.statusEffects
     * @returns {boolean}           Does the Token have this status effect?
     */
    hasStatusEffect(statusId) {
        if (this.actor?.system?.conditions?.[statusId]) return true;

        return super.hasStatusEffect(statusId);
    }
}
