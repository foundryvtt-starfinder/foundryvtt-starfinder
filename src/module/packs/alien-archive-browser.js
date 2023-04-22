import { SFRPG } from "../config.js";
import { DocumentBrowserSFRPG } from './document-browser.js';
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
        const items = new Map();

        for await (const {pack, content} of packLoader.loadPacks(this.entityType, this._loadedPacks)) {
            console.log(`Starfinder | Compendium Browser | ${pack.metadata.label} - ${content.length} entries found`);

            for (const item of content) {

                const itemData = {
                    uuid: `Compendium.${pack.collection}.${item._id}`,
                    img: item.img,
                    name: item.name,
                    system: item.system,
                    type: item.type
                };

                // Used for sorting and displaying
                itemData.system.cr = itemData.system.details?.cr;
                itemData.system.hp = itemData.system.attributes?.hp.max;

                // 1/3 and 1/2 CR aliens have special strings used to describe their CR rather than using the float value
                if (itemData.system.details?.cr == (1 / 3)) {
                    itemData.system.crDisplay = "1/3";
                } else if (itemData.system.details?.cr == (1 / 2)) {
                    itemData.system.crDisplay = "1/2";
                } else {
                    itemData.system.crDisplay = itemData.system.details?.cr;
                }

                if (this.allowedItem(item)) {
                    items.set(itemData.uuid, itemData);
                }
            }
        }

        console.log('Starfinder | Compendium Browser | Finished loading actors');
        return items;
    }

    getSortingMethods() {
        const sortingMethods = super.getSortingMethods();
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
        let aVal = $(elementA).find('input[name=cr]')
            .val();
        let bVal = $(elementB).find('input[name=cr]')
            .val();

        if (aVal.includes("/")) {
            const slashSplit = aVal.split("/");
            aVal = Number(slashSplit[0] / slashSplit[1]);
        } else {
            aVal = Number(aVal);
        }
        if (bVal.includes("/")) {
            const slashSplit = bVal.split("/");
            bVal = Number(slashSplit[0] / slashSplit[1]);
        } else {
            bVal = Number(bVal);
        }

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
        const aVal = parseFloat($(elementA).find('input[name=hp]')
            .val());
        const bVal = parseFloat($(elementB).find('input[name=hp]')
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
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienCR = alien.system.cr;

        if (range.max >= range.min) {
            return range.min <= alienCR && alienCR <= range.max;
        } else {
            return range.min <= alienCR;
        }
    }

    _filterHP(element, range) {
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienHP = alien.system.attributes.hp.max;

        if (range.max > range.min) {
            return range.min <= alienHP && alienHP <= range.max;
        } else {
            return range.min <= alienHP;
        }
    }

    _filterOrganizationSize(element, filterData) {
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienOrganizationSize = alien.system.details.organizationSize || {min: 1, max: null};

        if (alienOrganizationSize.max > alienOrganizationSize.min) {
            return alienOrganizationSize.min <= filterData.value && filterData.value <= alienOrganizationSize.max;
        } else {
            return alienOrganizationSize.min <= filterData.value;
        }
    }

    _filterSizes(element, filters) {
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienSize = alien ? alien.system.traits.size : "null";
        return alien && filters.includes(alienSize);
    }

    _filterTypes(element, filters) {
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienType = alien ? alien.system.details.type.toLowerCase() : "null";

        let found = false;
        for (const filter in filters) {
            const filterValue = filters[filter];
            if (alienType.includes(filterValue)) {
                found = true;
                break;
            }
        }

        return alien && found;
    }

    _filterAlignment(element, filters) {
        const itemUuid = element.dataset.entryUuid;
        const alien = this.items.get(itemUuid);
        const alienAlignment = alien?.system?.details?.alignment?.toLowerCase();
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
    const browser = getAlienArchiveBrowser();

    const defaultAllowedCompendiums = ["alien-archives"];
    browser.initializeSettings(defaultAllowedCompendiums);
});
