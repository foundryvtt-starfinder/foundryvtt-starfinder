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
        console.log(options);

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
        const attr = getProperty(this.object, this.attribute);
        if (typeof attr.value === "string") attr.value = this.constructor._backCompat(attr.value, this.options.choices);

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

    async filterItems(li) {
        let counter = 0;
        li.hide();

        for (const item of li) {
            if (this.getFilterResult(item)) {
                $(item).show();

                if (++counter % 20 === 0) {
                    // Yield to the browser to render what it has
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        }
    }

    getFilterResult(element) {
        if (this.sorters.text !== '') {
            const strings = this.sorters.text.split(',');

            for (const string of strings) {
                if (string.indexOf(':') === -1) {
                    if ($(element).find('.item-name a')[0].innerHTML.toLowerCase().indexOf(string.toLowerCase().trim()) === -1) {
                        return false;
                    }
                } else {
                    const targetValue = string.split(':')[1].trim();
                    const targetStat = string.split(':')[0].trim();

                    if ($(element).find(`input[name=${targetStat}]`)
                        .val()
                        .toLowerCase()
                        .indexOf(targetValue) === -1) {
                        return false;
                    }
                }
            }
        }

        if (this.sorters.castingtime !== 'null') {
            const castingtime = $(element).find('input[name=time]')
                .val()
                .toLowerCase();

            if (castingtime !== this.sorters.castingtime) {
                return false;
            }
        }

        for (const availableFilter of Object.values(this.filters)) {
            if (availableFilter.type === 'multi-select') {
                if (availableFilter.activeFilters && availableFilter.activeFilters.length > 0) {
                    if (!availableFilter.filter(element, availableFilter.activeFilters)) {
                        return false;
                    }
                }
            } else if (availableFilter.type === "range") {
                if (!availableFilter.filter(element, availableFilter.content)) {
                    return false;
                }
            } else if (availableFilter.type === "value") {
                if (!availableFilter.filter(element, availableFilter.content)) {
                    return false;
                }
            }
        }

        return true;
    }

    activateListeners(html) {

        // activating or deactivating filters
        html.on('change paste', 'input[name=textFilter]', ev => {
            this.sorters.text = ev.target.value;
            this.filterItems(html.find('li'));
        });

    }
}
