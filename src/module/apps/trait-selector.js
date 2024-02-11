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
    async _updateObject(event, formData) {
        await this.object.update(this._setTraitChoices(formData));
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

        if (this.attribute !== "system.traits.dr") {
            for (let [k, v] of Object.entries(formData)) {
                if ((k !== 'custom') && v) choices.push(k);
            }
        } else {
            let resistances = Object.entries(formData).filter(e => e[0].startsWith("er"));
            resistances = resistances.reduce((obj, entry) => {
                let [type, i] = entry[0].split('.').slice(1);

                if (!obj[type]) obj[type] = {};
                obj[type][i] = entry[1];

                return obj;
            }, {});

            choices = Object.entries(resistances).filter(e => e[1][0])
                .reduce((arr, resistance) => {
                    arr.push({[resistance[0]]: resistance[1][1]});

                    return arr;
                }, []);
        }

        this.object.update({
            [`${this.attribute}.value`]: choices,
            [`${this.attribute}.custom`]: formData.custom
        });
    }
}
