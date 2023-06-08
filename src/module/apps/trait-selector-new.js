/**
 * A specialized form used to select damage or condition types which appl to an Actor
 *
 * @type {FormApplication}
 */
export class TraitSelectorNew extends FormApplication {
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

    _setActorTraits() {
        return true;
    }

    /**
     * Update the Actor object with new trait data processed from the form
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     * @private
     */
    _updateObject(event, formData) {
        console.log(this);

        // Initialize variables for easy access
        const dataFormat = this.options.format;
        const dataLocation = this.options.location;
        const traitData = getProperty(this.object, dataLocation);

        switch (dataFormat) {
            case 'actorTraits':
                console.log('Setting Actor Traits');
                break;

            default:
                console.log('Setting nothing.');
                break;
        }

        let choices = [];

        if (this.attribute !== "system.traits.dr") {
            for (const [k, v] of Object.entries(formData)) {
                if ((k !== 'custom') && v) choices.push(k);
            }
        } else {
            let resistances = Object.entries(formData).filter(e => e[0].startsWith("er"));
            resistances = resistances.reduce((obj, entry) => {
                const [type, i] = entry[0].split('.').slice(1);

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

    async filterTraits(li) {
        li.hide();

        for (const trait of li) {
            if (this.searchMatch(trait)) {
                $(trait).show();
            }
        }
    }

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
