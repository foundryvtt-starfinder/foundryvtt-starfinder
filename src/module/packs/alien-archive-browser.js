import { DocumentBrowserSFRPG } from './document-browser.js';
import { SFRPG } from "../config.js"
import { packLoader } from './pack-loader.js';

class AlienArchiveBrowserSFRPG extends DocumentBrowserSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.Title");
        return options;
    }

    get entityType() {
        return "Actor";
    }

    getConfigurationProperties() {
        return {
            label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.Title"),
            settings: "alienArchiveBrowser"
        };
    }

    getPacksToLoad() {
        return Object.entries(this.settings);
    }

    allowedItem(item) {
        const allowedTypes = ['npc', 'npc2'];
        return allowedTypes.includes(item.type);
    }

    async loadItems() {
        console.log('Starfinder | Compendium Browser | Started loading actors');
        const items = [];

        for await (const {pack, content} of packLoader.loadPacks(this.entityType, this._loadedPacks)) {
            console.log(`Starfinder | Compendium Browser | ${pack.metadata.label} - ${content.length} entries found`);

            for (const item of content) {

                const itemData = item.data;
                itemData.compendium = pack.collection;

                // Used for sorting and displaying
                itemData.data.cr = itemData.data.details.cr;
                itemData.data.hp = itemData.data.attributes.hp.max;

                // 1/3 and 1/2 CR aliens have special strings used to describe their CR rather than using the float value
                if (itemData.data.details.cr == (1/3)) {
                    itemData.data.crDisplay = "1/3";
                }
                else if (itemData.data.details.cr == (1/2)) {
                    itemData.data.crDisplay = "1/2";
                }
                else {
                    itemData.data.crDisplay = itemData.data.details.cr;
                }

                if (this.allowedItem(itemData)) {
                    items.push(itemData);
                }
            }
        }

        console.log('Starfinder | Compendium Browser | Finished loading actors');
        return items;
    }

    getSortingMethods() {
        let sortingMethods = super.getSortingMethods();
        sortingMethods["cr"] = {
            name: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserSortMethodCR"),
            method: this._sortByCR
        };
        sortingMethods["hp"] = {
            name: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserSortMethodHP"),
            method: this._sortByHP
        };
        return sortingMethods;
    }

    _sortByCR(elementA, elementB) {
        const aVal = parseFloat($(elementA).find('input[name=cr]').val());
        const bVal = parseFloat($(elementB).find('input[name=cr]').val());
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;

        if (aVal == bVal) {
            const aName = $(elementA).find('.item-name a')[0].innerHTML;
            const bName = $(elementB).find('.item-name a')[0].innerHTML;
            if (aName < bName) return -1;
            if (aName > bName) return 1;
            return 0;
        }
    }

    _sortByHP(elementA, elementB) {
        const aVal = parseFloat($(elementA).find('input[name=hp]').val());
        const bVal = parseFloat($(elementB).find('input[name=hp]').val());
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;

        if (aVal == bVal) {
            const aName = $(elementA).find('.item-name a')[0].innerHTML;
            const bName = $(elementB).find('.item-name a')[0].innerHTML;
            if (aName < bName) return -1;
            if (aName > bName) return 1;
            return 0;
        }
    }

    getFilters() {
        let filters = {
            cr: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterCR"),
                content: {min: 0, max: 25},
                filter: (element, filters) => { return this._filterCR(element, filters); },
                reset: (filter) => { filter.content = {min: 0, max: 25}; },
                type: "range"
            },
            hp: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterHP"),
                content: {min: 0, max: 0},
                filter: (element, filters) => { return this._filterHP(element, filters); },
                reset: (filter) => { filter.content = {min: 0, max: 0}; },
                type: "range"
            },
            organizationSize: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterOrganizationSize"),
                content: {value: 1},
                range: {min: 1, max: null},
                filter: (element, filters) => { return this._filterOrganizationSize(element, filters); },
                reset: (filter) => { filter.content = {value: 1}; },
                type: "value"
            },
            size: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterSize"),
                content: SFRPG.actorSizes,
                filter: (element, filters) => { return this._filterSizes(element, filters); },
                type: "multi-select"
            },
            type: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterType"),
                content: SFRPG.npctypes,
                filter: (element, filters) => { return this._filterTypes(element, filters); },
                type: "multi-select"
            },
            alignment: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterAlignment"),
                content: SFRPG.alignmentsNPC,
                filter: (element, filters) => { return this._filterAlignment(element, filters); },
                type: "multi-select"
            }
        };
        return filters;
    }

    getTags() {
        return {
            level: {
                name: game.i18n.localize("SFRPG.Browsers.AlienArchiveBrowser.BrowserSortMethodCR"),
                dataKey: "crDisplay",
                sortValue: "cr"
            },
            hitpoints: {
                name: game.i18n.localize("SFRPG.Browsers.AlienArchiveBrowser.BrowserSortMethodHP"),
                dataKey: "hp",
                sortValue: "hp"
            }
        };
    }

    _filterCR(element, range) {
        const compendium = element.dataset.entryCompendium;
        const itemId = element.dataset.entryId;
        const alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        const alienCR = alien.data.cr;
        
        if (range.max >= range.min) {
            return range.min <= alienCR && alienCR <= range.max;
        } else {
            return range.min <= alienCR;
        }
    }

    _filterHP(element, range) {
        const compendium = element.dataset.entryCompendium;
        const itemId = element.dataset.entryId;
        const alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        const alienHP = alien.data.attributes.hp.max;

        if (range.max > range.min) {
            return range.min <= alienHP && alienHP <= range.max;
        } else {
            return range.min <= alienHP;
        }
    }

    _filterOrganizationSize(element, filterData) {
        const compendium = element.dataset.entryCompendium;
        const itemId = element.dataset.entryId;
        const alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        const alienOrganizationSize = alien.data.details.organizationSize || {min: 1, max: null};

        if (alienOrganizationSize.max > alienOrganizationSize.min) {
            return alienOrganizationSize.min <= filterData.value && filterData.value <= alienOrganizationSize.max;
        } else {
            return alienOrganizationSize.min <= filterData.value;
        }
    }

    _filterSizes(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        let alienSize = alien ? alien.data.traits.size : "null";
        return alien && filters.includes(alienSize);
    }

    _filterTypes(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        let alienType = alien ? alien.data.details.type.toLowerCase() : "null";

        var found = false;
        for (let filter in filters) {
            let filterValue = filters[filter];
            if(alienType.includes(filterValue)) {
                found = true;
                break;
            }
        }

        return alien && found;
    }

    _filterAlignment(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let alien = this.items.find(x => x.compendium === compendium && x._id === itemId);
        let alienAlignment = alien?.data?.details?.alignment?.toLowerCase();
        return alien && filters.includes(alienAlignment);
    }
}

let _alienArchiveBrowser = null;
export function getAlienArchiveBrowser() {
    if (!_alienArchiveBrowser) {
        _alienArchiveBrowser = new AlienArchiveBrowserSFRPG();
    }
    return _alienArchiveBrowser;
}

Hooks.on('ready', e => {
    let browser = getAlienArchiveBrowser();

    const defaultAllowedCompendiums = ["alien-archives"];
    browser.initializeSettings(defaultAllowedCompendiums);
});
