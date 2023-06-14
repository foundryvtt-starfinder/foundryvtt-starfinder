import { TraitSelectorSFRPG } from "../trait-selector.js";

export class WeaponPropertySelectorSFRPG extends TraitSelectorSFRPG {
    constructor(item, options) {
        super(item, options);
        super.getData();

        // Add extra text fields if needed
        foundry.utils.mergeObject(this.options, {
            needsTextExtension: true,
            needsCustomField: false
        });
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
        // console.log(this, choices, traitData);

        for (const [key, displayName] of Object.entries(choices)) {
            choices[key] = {
                label: displayName,
                tooltip: this.options.tooltips[key],
                isSelected: traitData[key]?.['value'],
                extension: traitData[key]?.['extension']
            };
        }

        return {
            choices: choices,
            needsTextExtension: this.options.needsTextExtension,
            needsCustomField: this.options.needsCustomField
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
        const selectedValues = {value: {}, extension: {}};
        console.log(formData);

        // Ignoring options not in the list of choices
        // key is the specific language, proficiency, etc.
        // value is true or false, or the name of a custom trait
        for (const [key, value] of Object.entries(formData)) {
            if (validChoices.includes(key)) {
                selectedValues[key] = {};
                selectedValues[key].value = value;
                selectedValues[key].extension = '';
            }
        }

        // Build the updated data to pass back to the parent object
        const updateData = {
            [`${this.options.location}`]: selectedValues
        };

        return updateData;
    }
}
