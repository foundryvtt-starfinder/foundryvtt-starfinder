import { TraitSelectorSFRPG } from "../trait-selector.js";

export class WeaponPropertySelectorSFRPG extends TraitSelectorSFRPG {
    constructor(item, options) {
        super(item, options);

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
                tooltip: this.options.tooltips[key]
            };
            // Maintain backward compatibility with the previous data structure
            if (typeof traitData[key] === 'object') {
                choices[key].isObject = true;
                choices[key].isSelected = traitData[key]?.['value'];
                choices[key].extension = traitData[key]?.['extension'];
            } else {
                choices[key].isObject = false;
                choices[key].isSelected = traitData[key];
                choices[key].extension = '';
            }
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

        // Expand the formData object
        formData = foundry.utils.expandObject(formData);

        // get a list of valid choices and initialize array
        const validChoices = Object.keys(this.options.choices);
        const selectedValues = {};

        // Ignoring options not in the list of choices
        // key is the specific language, proficiency, etc. and property is the property object
        // We must set all properties to allow them to be selected and deselected
        for (const [key, property] of Object.entries(formData)) {
            if (validChoices.includes(key)) {
                selectedValues[key] = property;
                delete selectedValues[key].isObject;
                delete selectedValues[key].needsTextExtension;
            }
        }

        // Build the updated data to pass back to the parent object
        const updateData = {
            [`${this.options.location}`]: selectedValues
        };

        return updateData;
    }
}
