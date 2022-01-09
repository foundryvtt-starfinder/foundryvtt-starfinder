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

            for (let item of content) {

                item = item.data;
                item.compendium = pack.collection;
                // Used for sorting and displaying CR
                item.data.cr = item.data.details.cr;
                // 1/3 and 1/2 CR aliens have special strings used to describe their CR rather than using the float value
                if (item.data.details.cr == (1/3)) {
                    item.data.crDisplay = "1/3";
                }
                else if (item.data.details.cr == (1/2)) {
                    item.data.crDisplay = "1/2";
                }
                else {
                    item.data.crDisplay = item.data.details.cr;
                }

                if (this.allowedItem(item)) {
                    items.push(item);
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

    getFilters() {

        let filters = {
            size: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterSize"),
                content: SFRPG.actorSizes,
                filter: (element, filters) => { return this._filterSizes(element, filters); }
            },
            type: {
                label: game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.BrowserFilterType"),
                content: SFRPG.npctypes,
                filter: (element, filters) => { return this._filterTypes(element, filters); }
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
            }
        };
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
