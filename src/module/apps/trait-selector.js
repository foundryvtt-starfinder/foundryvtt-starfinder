/**
 * A specialized form used to select damage or condition types which appl to an Actor
 *
 * @type {FormApplication}
 */
export class TraitSelectorSFRPG extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;

        options.id = "trait-selector";
        options.classes = ["sfrpg"];
        options.title = "Trait Selection";
        options.template = "systems/sfrpg/templates/apps/trait-selector-new.hbs";
        options.width = 480;
        options.height = "auto";

        return options;
    }

    /**
     * Provide data to the HTML template for rendering
     *
     * @returns {Object}
     */
    getData() {
        console.log(this);

        // Initialize variables for easy access
        const dataFormat = this.options.format;
        const dataLocation = this.options.location;
        const traitData = getProperty(this.object, dataLocation);

        // Choose the appropriate data parser to create the form
        switch (dataFormat) {
            case "actorTraits":
                return this._getActorTraitChoices(traitData);

            case "weaponProperties":
                console.log('Selecting Weapon Properties');
                return true;

            default:
                console.log(`dataFormat ${dataFormat} not found`);
                break;
        }
    }

    /**
     * Choose the appropriate update method for updating the data
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     * @private
     */
    _updateObject(event, formData) {

        // Get the data format
        const dataFormat = this.options.format;

        switch (dataFormat) {
            case 'actorTraits':
                console.log('Setting Actor Traits');
                this._setActorTraits(formData);
                break;

            default:
                console.log('Setting nothing.');
                break;
        }
    }

    /**
     * Parses Actor Trait data into a format that the form can accept
     *
     * @param {Object} traitData The data from the actor to parse
     * @returns {Object}
     */
    _getActorTraitChoices(traitData) {

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
     * Update an Actor trait data processed from the form
     *
     * @param {Object} formData The data from the form
     * @private
     */
    _setActorTraits(formData) {

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

        // update parent object with the appropriate data
        this.object.update({
            [`${this.options.location}.value`]: selected,
            [`${this.options.location}.custom`]: formData.custom
        });
    }

    /**
     * Filter the displayed traits based on search input
     *
     * @param {Array} li An array of all the traits displayed on the form
     * @private
     */
    async filterTraits(li) {
        li.hide();

        for (const trait of li) {
            if (this.searchMatch(trait)) {
                $(trait).show();
            }
        }
    }

    /**
     * Check if a displayed item matches the search string
     *
     * @param {String} trait The localized trait name
     * @private
     */
    searchMatch(trait) {
        const searchTerm = this.searchTerm;

        if (searchTerm !== '') {
            const strings = this.searchTerm.split(',');

            for (const string of strings) {
                const textToSearch = $(trait).find('input')[0].nextSibling.data.toLowerCase().trim();
                if (textToSearch.indexOf(string.toLowerCase().trim()) === -1) {
                    return false;
                }
            }
        }

        return true;
    }

    activateListeners(html) {

        // activating or deactivating filters
        html.on('change keyup paste', 'input[name=textFilter]', ev => {
            this.searchTerm = ev.target.value;
            this.filterTraits(html.find('li'));
        });

    }
}
