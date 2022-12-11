import { DocumentBrowserSFRPG } from './document-browser.js';
import { SFRPG } from "../config.js"

class SpellBrowserSFRPG extends DocumentBrowserSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.format("SFRPG.Browsers.SpellBrowser.Title");
        return options;
    }

    getConfigurationProperties() {
        return {
          label: game.i18n.format("SFRPG.Browsers.SpellBrowser.Title"),
          settings: "spellBrowser"
        };
    }

    getPacksToLoad() {
        return Object.entries(this.settings);
    }

    allowedItem(item) {
        return (item.type === 'spell');
    }

    getSortingMethods() {
        let sortingMethods = super.getSortingMethods();
        sortingMethods["level"] = {
            name: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserSortMethodLevel"),
            method: this._sortByLevel
        };
        return sortingMethods;
    }

    _sortByLevel(elementA, elementB) {
        const aVal = parseInt($(elementA).find('input[name=level]').val());
        const bVal = parseInt($(elementB).find('input[name=level]').val());
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
            levels: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterLevel"),
                content: SFRPG.spellLevels,
                filter: (element, filters) => { return this._filterLevels(element, filters); },
                type: "multi-select"
            },
            classes: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterClass"),
                content: SFRPG.spellcastingClasses,
                filter: (element, filters) => { return this._filterClasses(element, filters); },
                type: "multi-select"
            },
            schools: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterSchool"),
                content: SFRPG.spellSchools,
                filter: (element, filters) => { return this._filterSchools(element, filters); },
                type: "multi-select"
            }
        };
        return filters;
    }

    getTags() {
        return {
            level: {
                name: game.i18n.localize("SFRPG.Browsers.SpellBrowser.BrowserSortMethodLevel"),
                dataKey: "level",
                sortValue: "level"
            }
        };
    }

    _filterLevels(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        let itemLevel = item ? JSON.stringify(item.system.level) : "null";
        return item && filters.includes(itemLevel);
    }

    _filterClasses(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        if (!item) return false;

        for (let allowedClass of filters) {
            if (item.system.allowedClasses[allowedClass]) {
                return true;
            }
        }
        return false;
    }

    _filterSchools(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && filters.includes(item.system.school);
    }
}

let _spellBrowser = null;
export function getSpellBrowser() {
    if (!_spellBrowser) {
        _spellBrowser = new SpellBrowserSFRPG();
    }
    return _spellBrowser;
}
