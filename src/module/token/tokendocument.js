export default class SFRPGTokenDocument extends TokenDocument {
    /**
     * Hijack Token health bar rendering to include temporary and temp-max health in the bar display
     * 
     * @param {string} barName The name of the bar attribute to target.
     * @param {object} [optional] Optional parameters that can be passed into the mehtod.
     * @param {string} [optional.alternative] An alternative attribute path to get instead of the default one
     * @returns 
     */
    getBarAttribute(barName, {alternative}={}) {
        const attr = alternative || (barName ? this.data[barName].attribute : null);
        if ( !attr || !this.actor ) return null;
        let data = foundry.utils.getProperty(this.actor.data.data, attr);
        if ( (data === null) || (data === undefined) ) return null;
        const model = game.system.model.Actor[this.actor.type];

        // Single values
        if ( Number.isNumeric(data) ) {
            return {
                type: "value",
                attribute: attr,
                value: Number(data),
                editable: foundry.utils.hasProperty(model, attr)
            }
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
            }
        }

        // Otherwise null
        return null;
    }
}