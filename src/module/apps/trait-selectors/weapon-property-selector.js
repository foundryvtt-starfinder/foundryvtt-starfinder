import { TraitSelectorSFRPG } from "../trait-selector.js";

export class WeaponPropertySelectorSFRPG extends TraitSelectorSFRPG {
    constructor(item, options) {
        super(item, options);
        super.getData();
    }

    /**
     * Parses Item Weapon Property data into a format that the form can accept
     *
     * @param {Object} traitData The data from the item to parse
     * @returns {Object}
     */
    _getTraitChoices(traitData) {

        // create the array of choices
        const choices = duplicate(this.options.choices);
        console.log(this, choices, traitData);

        for (const [key, value] of Object.entries(choices)) {
            choices[key] = {
                label: value,
                tooltip: this.options.tooltips[key],
                isSelected: traitData[key]
            };
        }

        return {
            choices: choices
        };
    }

    /**
     * Choose the appropriate update method for updating the data
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     */
    _setTraitChoices(formData) {

        // get a list of valid choices and initialize array
        const validChoices = Object.keys(this.options.choices);
        const selectedValues = {};

        // Ignoring options not in the list of choices
        // key is the specific language, proficiency, etc.
        // value is true or false, or the name of a custom trait
        for (const [key, value] of Object.entries(formData)) {
            if (validChoices.includes(key)) {
                selectedValues[key] = value;
            }
        }

        // Build the updated data to pass back to the parent object
        const updateData = {
            [`${this.options.location}`]: selectedValues
        };

        return updateData;
    }
}
