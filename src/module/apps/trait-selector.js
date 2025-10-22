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

        // footer html (for searching)
        const footer = html.find(".trait-footer");

        // activating or deactivating filters
        html.on('change keyup paste', 'input[name=textFilter]', ev => {
            this.searchTerm = ev.target.value;
            this.filterTraits(footer.find('li'));
        });

        // Shuffle all checkboxes around based on whether or not they're checked
        html.on('change', 'input[type=checkbox]', async ev => {

            // Get relevant data
            const formData = foundry.utils.expandObject(this._getSubmitData());
            const propertyElement = ev.target.parentElement.parentElement;
            const key = propertyElement.id;
            const label = propertyElement.innerText.trim();
            const selectedList = document.getElementById("selected");
            const unselectedList = document.getElementById("unselected");

            // The list which the changed list item is currently not in
            const newList = propertyElement.parentElement === selectedList ? unselectedList : selectedList;

            // Sort the list items by their text labels (localized names)
            let targetListItem = null;
            for (const listItem of newList.children) {
                const itemLabel = listItem.innerText.trim();
                if (label.localeCompare(itemLabel) <= 0) {
                    targetListItem = listItem;
                    break;
                }
            }

            // Move the list item to the correct location in the new list
            newList.insertBefore(propertyElement, targetListItem);

            // If the box has been newly checked, append the text box and isObject data if needed
            if (formData[key].needsTextExtension === 'true' && newList === selectedList) {
                const extensionTextBox = document.createElement("input");
                extensionTextBox.type = "text";
                extensionTextBox.className = "extension";
                extensionTextBox.name = `${key}.extension`;
                extensionTextBox.value = "";
                propertyElement.appendChild(extensionTextBox);
            }

            // Remove the extension text box if it's being unchecked and it's needed
            if (formData[key].needsTextExtension && newList === unselectedList) {
                for (const child of propertyElement.children) {
                    if (child.className === 'extension') {
                        child.remove();
                    }
                }
            }
        });

    }
}
