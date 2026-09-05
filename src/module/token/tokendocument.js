import { baseSquaresForFrame, scaledTokenSize, snapResolution } from "./token-scale.js";

export default class SFRPGTokenDocument extends foundry.documents.TokenDocument {
    async _preCreate(data, options, user) {
        const updates = {};

        if (this.actor) {
            // Override the token's movement to "crawl" when placed if the actor has the prone condition
            if (CONFIG.SFRPG.actorsCharacterScale.includes(this.actor.type) && this.hasStatusEffect("prone")) {
                updates.movementAction = "crawl";
            }

            // Size the token to the scene's scale, so that a Huge mech dropped on a
            // 10 ft grid takes one square rather than three. A mech goes by the frame it
            // has equipped; everything else goes by the squares its token was drawn at.
            if (game.settings.get("sfrpg", "scaleTokensToGrid")) {
                const gridDistance = this.parent?.grid?.distance;
                const options = { isMech: this.actor.type === "mech" };
                const frameSquares = baseSquaresForFrame(this.actor);
                const prototype = this.actor.prototypeToken;

                updates.width = scaledTokenSize(frameSquares ?? prototype?.width ?? this.width, gridDistance, options);
                updates.height = scaledTokenSize(frameSquares ?? prototype?.height ?? this.height, gridDistance, options);
            }
        }

        this.updateSource(updates);
        return super._preCreate(data, options, user);
    }

    /**
     * @override to snap a token that does not fill whole squares to the 5 ft steps it moves in.
     * Foundry rounds a token's size to the nearest half square before snapping, which leaves a
     * third-of-a-square token stepping in quarters and stopping short of the square's far edge.
     */
    getSnappedPosition(data = {}) {
        const grid = this.parent?.grid;
        if (!grid?.isSquare) return super.getSnappedPosition(data);

        const resolutionX = snapResolution(data.width ?? this.width, grid.distance);
        const resolutionY = snapResolution(data.height ?? this.height, grid.distance);
        if (!resolutionX && !resolutionY) return super.getSnappedPosition(data);

        const snapped = super.getSnappedPosition(data);
        const point = { x: data.x ?? this.x, y: data.y ?? this.y };
        const mode = CONST.GRID_SNAPPING_MODES.VERTEX;

        return {
            x: resolutionX ? grid.getSnappedPoint(point, { mode, resolution: resolutionX }).x : snapped.x,
            y: resolutionY ? grid.getSnappedPoint(point, { mode, resolution: resolutionY }).y : snapped.y,
            elevation: snapped.elevation
        };
    }

    // When a linked token's base actor is updated, check if the movement action is correct
    async _onRelatedUpdate(update = {}, operation = {}) {
        if (this.actor) {
            await this.updateMovement(this.actor);
        }
        return super._onRelatedUpdate(update, operation);
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
        const attribute = alternative || (barName ? this[barName].attribute : null);
        if ( !attribute || !this.actor ) return null;
        const system = this.actor.system;
        const isSystemDataModel = system instanceof foundry.abstract.DataModel;
        const templateModel = game.model.Actor[this.actor.type];

        // Get the current attribute value
        const data = foundry.utils.getProperty(system, attribute);
        if ( (data === null) || (data === undefined) ) return null;

        // Single values
        if ( Number.isNumeric(data) ) {
            let editable = foundry.utils.hasProperty(templateModel, attribute);
            if ( isSystemDataModel ) {
                const field = system.schema.getField(attribute);
                if ( field ) editable = field instanceof foundry.data.fields.NumberField;
            }
            return {
                type: "value",
                attribute: attribute,
                value: Number(data),
                editable: editable
            };
        }

        // Attribute objects
        else if ( ("value" in data) && ("max" in data) ) {
            let editable = foundry.utils.hasProperty(templateModel, `${attribute}.value`);
            if ( isSystemDataModel ) {
                const field = system.schema.getField(`${attribute}.value`);
                if ( field ) editable = field instanceof foundry.data.fields.NumberField;
            }
            let value = parseInt(data.value || 0);
            let max = parseInt(data.max || 0);

            if (attribute === "attributes.hp") {
                value += parseInt(data.temp || 0);
                max += parseInt(data.tempmax || 0);
            }

            return {
                type: "bar",
                attribute: attribute,
                value: value,
                max: max,
                editable: editable
            };
        }

        // Otherwise null
        return null;
    }

    /**
     * Updates the default and available movement types based on the actor speed settings and
     * whether or not the token has the "prone" condition.
     */
    async updateMovement(actor) {
        const mainMovement = actor.system.attributes.speed.mainMovement;
        let update = {};
        if (this.hasStatusEffect("prone") && this.movementAction !== "crawl") {
            update = {_id: this._id, movementAction: "crawl"};
        } else if (!this.hasStatusEffect("prone") && this.movementAction === "crawl") {
            update = {_id: this._id, movementAction: CONFIG.SFRPG.movementOptions[mainMovement]};
        } else {
            return null;
        }
        console.log('Token conditions changed, updating movement actions.');
        await this.update(update);
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
