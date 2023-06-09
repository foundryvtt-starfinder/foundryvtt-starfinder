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
        options.template = "systems/sfrpg/templates/apps/trait-selector.hbs";
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
        const dataLocation = this.options.location;
        const traitData = getProperty(this.object, dataLocation);
        return this._getTraitChoices(traitData);
    }

    /**
     * Choose the appropriate update method for updating the data
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     */
    _updateObject(event, formData) {
        this.object.update(this._setTraitChoices(formData));
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

    /**
     * Act on inputs to the html
     *
     * @param {Object} html
     */
    activateListeners(html) {

        // activating or deactivating filters
        html.on('change keyup paste', 'input[name=textFilter]', ev => {
            this.searchTerm = ev.target.value;
            this.filterTraits(html.find('li'));
        });

    }
}
