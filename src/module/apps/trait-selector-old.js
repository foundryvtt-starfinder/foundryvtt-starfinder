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
     * Return a reference to the target attribute
     *
     * @type {String}
     */
    get attribute() {
        return this.options.name;
    }

    /**
     * Provide data to the HTML template for rendering
     *
     * @returns {Object}
     */
    getData() {
        console.log(this);
        const attr = getProperty(this.object, this.attribute);
        if (typeof attr.value === "string") {
            attr.value = this.constructor._backCompat(attr.value, this.options.choices);
        }

        const choices = duplicate(this.options.choices);
        const isEnergyResistance = this.attribute === "data.traits.dr";
        if (!isEnergyResistance) {
            for (const [k, v] of Object.entries(choices)) {
                choices[k] = {
                    label: v,
                    chosen: attr.value.includes(k)
                };
            }
        } else {
            for (const [k, v] of Object.entries(choices)) {
                choices[k] = {
                    label: v,
                    chosen: false,
                    resistanceValue: 0
                };
            }

            for (const value of attr.value) {
                for (const [type, resistance] of Object.entries(value)) {
                    choices[type].chosen = true;
                    choices[type].resistanceValue = resistance;
                }
            }
        }

        this.searchTerm = '';

        return {
            choices: choices,
            custom: attr.custom,
            isEnergyResistance
        };
    }

    /**
     * Support backwards compatability for old-style string separated traits
     *
     * @param {String} current The current value
     * @param {Array} choices The choices
     * @returns {Array}
     * @private
     */
    static _backCompat(current, choices) {
        if (!current || current.length === 0) return [];
        current = current.split(/[\s,]/).filter(t => !!t);
        return current.map(val => {
            for (const [k, v] of Object.entries(choices)) {
                if (val === v) return k;
            }
            return null;
        }).filter(val => !!val);
    }

    /**
     * Update the Actor object with new trait data processed from the form
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     * @private
     */
    _updateObject(event, formData) {
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

        // on Enter key press, filter based on search

    }
}