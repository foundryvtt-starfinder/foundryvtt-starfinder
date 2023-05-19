import { SFRPG } from "../config.js";

/**
 * A simple form to set weapon properties
 * @extends {DocumentSheet}
 */
export class WeaponPropertyConfig extends DocumentSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sfrpg"],
            template: "systems/sfrpg/templates/apps/weapon-properties.hbs",
            width: 600,
            height: "auto",
            closeOnSubmit: true
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get title() {
        return game.i18n.format("SFRPG.Items.Weapon.Properties", {name: this.document.name});
    }

    /* -------------------------------------------- */

    /** @override */
    getData(options) {
        const sourceProperties = foundry.utils.getProperty(this.document._source, "system.properties") || {};
        const data = {
            properties: sourceProperties,
            config: CONFIG.SFRPG
        };
        return data;
    }

    /**
     * Update the Item object with the new data.
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     */
    _updateObject(event, formData) {
        console.log(formData);
        // return this._updateModifierData(formData);
    }

    async _updateModifierData(formData) {
        const modifiers = duplicate(this.actor.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === this.modifier._id);

        const formula = formData['modifier'];
        if (formula) {
            try {
                const roll = Roll.create(formula, this.owningActor?.system || this.actor.system);
                modifier.max = await roll.evaluate({maximize: true}).total;
            } catch (err) {
                ui.notifications.error(err);
            }

        } else {
            modifier.max = 0;
        }

        mergeObject(modifier, formData);

        return this.actor.update({'system.modifiers': modifiers});
    }
}
