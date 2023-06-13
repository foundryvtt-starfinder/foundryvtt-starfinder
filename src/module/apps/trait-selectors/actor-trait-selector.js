import { TraitSelectorSFRPG } from "../trait-selector.js";

export class ActorTraitSelectorSFRPG extends TraitSelectorSFRPG {
    constructor(actor, options) {
        super(actor, options);
        super.getData();

        // Add extra text fields if needed
        foundry.utils.mergeObject(this.options, {
            needsTextExtension: false,
            needsCustomField: true
        });
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
        // console.log(this, choices, traitData);

        // define options that can't be chosen
        const locked = this._getLockedTraits();

        for (const [k, v] of Object.entries(choices)) {
            choices[k] = {
                label: v,
                isSelected: traitData.value.includes(k),
                isLocked: Object.keys(locked).includes(k)
            };
        }

        return {
            choices: choices,
            custom: traitData.custom,
            locked: locked,
            needsTextExtension: this.options.needsTextExtension,
            needsCustomField: this.options.needsCustomField
        };
    }

    /**
     * Checks the parent actor for class items and makes options defined by them not toggleable
     *
     */
    _getLockedTraits() {
        const items = this.object.items;
        const classes = [];
        const locked = {};

        // store the actor's class items
        for (const item of items) {
            if (item.type === "class") classes.push(item);
        }

        // Exclude the proficiencies defined by the class
        for (const cls of classes) {
            const classData = cls.system;

            if (this.options.dataType === "weaponProficiencies") {
                for (const [key, value] of Object.entries(classData.proficiencies.weapon)) {
                    if (value) {
                        locked[key] = value;
                    }
                }
            } else if (this.options.dataType === "armorProficiencies") {
                for (const [key, value] of Object.entries(classData.proficiencies.armor)) {
                    if (value) {
                        locked[key] = value;
                    }
                }
            }
        }

        return locked;
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
        const values = [];

        // Ignoring options not in the list of choices, push values marked true to the updateData
        // key is the specific language, proficiency, etc.
        // value is true or false, or the name of a custom trait
        for (const [key, value] of Object.entries(formData)) {
            if (validChoices.includes(key)) {
                if (value) {
                    values.push(key);
                }
            }
        }

        // Build the updated data to pass back to the parent object
        const updateData = {
            [`${this.options.location}.value`]: values,
            [`${this.options.location}.custom`]: formData.custom
        };

        return updateData;
    }
}
