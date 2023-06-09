import { TraitSelectorSFRPG } from "../trait-selector.js";

export class ActorTraitSelectorSFRPG extends TraitSelectorSFRPG {
    constructor(actor, options) {
        super(actor, options);
        super.getData();
    }

    /**
     * Parses Actor Trait data into a format that the form can accept
     *
     * @param {Object} traitData The data from the actor to parse
     * @returns {Object}
     */
    _getTraitChoices(traitData) {

        // create the array of choices
        const choices = duplicate(this.options.choices);
        console.log(choices, traitData);

        for (const [k, v] of Object.entries(choices)) {
            choices[k] = {
                label: v,
                isSelected: traitData.value.includes(k)
            };
        }
        return {
            choices: choices,
            custom: traitData.custom
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
        const selected = [];

        // Push custom values first, then others, ignoring options not in the list of choices
        // key is the specific language, proficiency, etc.
        // value is true or false, or the name of a custom trait
        for (const [key, value] of Object.entries(formData)) {
            if (validChoices.includes(key)) {
                if (value) selected.push(key);
            }
        }

        // Build the updated data to pass back to the parent object
        const updateData = {
            [`${this.options.location}.value`]: selected,
            [`${this.options.location}.custom`]: formData.custom
        };

        return updateData;
    }
}
