import { SFRPG } from "../config.js";
import { DocumentBrowserSFRPG } from './document-browser.js';

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
        const sortingMethods = super.getSortingMethods();
        sortingMethods["level"] = {
            name: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserSortMethodLevel"),
            method: this._sortByLevel
        };
        return sortingMethods;
    }

    _sortByLevel(elementA, elementB) {
        const aVal = parseInt($(elementA).find('input[name=level]')
            .val());
        const bVal = parseInt($(elementB).find('input[name=level]')
            .val());
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
        const filters = {
            levels: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterLevel"),
                content: SFRPG.spellLevels,
                filter: (element, filters) => { return this._filterLevels(element, filters); },
                activeFilters: this.filters?.levels?.activeFilters || [],
                type: "multi-select"
            },
            classes: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterClass"),
                content: SFRPG.spellcastingClasses,
                filter: (element, filters) => { return this._filterClasses(element, filters); },
                activeFilters: this.filters?.classes?.activeFilters || [],
                type: "multi-select"
            },
            schools: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterSchool"),
                content: SFRPG.spellSchools,
                filter: (element, filters) => { return this._filterSchools(element, filters); },
                activeFilters: this.filters?.schools?.activeFilters || [],
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
        const itemUuid = element.dataset.entryUuid;
        const item = this.items.get(itemUuid);
        const itemLevel = item ? item?.system?.level.toString() : null;
        return item && filters.includes(itemLevel);
    }

    _filterClasses(element, filters) {
        const itemUuid = element.dataset.entryUuid;
        const item = this.items.get(itemUuid);
        if (!item) return false;

        for (const allowedClass of filters) {
            if (item.system?.allowedClasses[allowedClass]) {
                return true;
            }
        }
        return false;
    }

    _filterSchools(element, filters) {
        const itemUuid = element.dataset.entryUuid;
        const item = this.items.get(itemUuid);
        return item && filters.includes(item.system?.school);
    }

    /**
     * @typedef  {object} FilterObjectSpell
     * @property {string[]} levels Drawn from SFRPG.spellLevels
     * @property {string[]} classes Drawn from SFRPG.spellcastingClasses
     * @property {string[]} schools Drawn from SFRPG.spellSchools
     * @see {config.js}
     */
    /**
     * Prepare the filter object before calling the parent method
     * @param {FilterObjectSpell} filters A filter object
     */
    renderWithFilters(filters = {}) {
        const filterObject = filters;

        if (filters.classes) {
            const classesToFilters = {
                'mystic': 'myst',
                'precog': 'precog',
                'technomancer': 'tech',
                'witchwarper': 'wysh'
            };

            filters.classes = filters.classes instanceof Array ? filters.classes : [filters.classes];
            filters.classes = filters.classes.map(i => classesToFilters[i] || i);
        }

        if (filters.levels) {
            filters.levels = filters.levels instanceof Array ? filters.levels : [filters.levels];
            filters.levels = filters.levels.map(i => String(i));
        }

        if (filters.schools) {
            const schoolsToFilters = {
                "abjuration": "abj",
                "conjuration": "con",
                "divination": "div",
                "enchantment": "enc",
                "evocation": "evo",
                "illusion": "ill",
                "necromancy": "nec",
                "transmutation": "trs",
                "universal": "uni"
            };

            filters.schools = filters.schools instanceof Array ? filters.schools : [filters.schools];
            filters.schools = filters.schools.map(i => schoolsToFilters[i] || i);
        }

        return super.renderWithFilters(filterObject);
    }
}

let _spellBrowser = null;
export function getSpellBrowser() {
    if (!_spellBrowser) {
        _spellBrowser = new SpellBrowserSFRPG();
    }
    return _spellBrowser;
}
