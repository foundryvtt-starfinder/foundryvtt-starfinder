import { ItemBrowserSFRPG } from './item-browser.js';
import { SFRPG } from "../config.js"

const equipmentTypes = {
    "augmentation" : "SFRPG.Items.Categories.Augmentations",
    "consumable"   : "SFRPG.Items.Categories.Consumables",
    "container"    : "SFRPG.Items.Categories.Containers",
    "equipment"    : "SFRPG.Items.Categories.Equipment",
    "fusion"       : "SFRPG.Items.Categories.WeaponFusions",
    "goods"        : "SFRPG.Items.Categories.Goods",
    "hybrid"       : "SFRPG.Items.Categories.HybridItems",
    "magic"        : "SFRPG.Items.Categories.MagicItems",
    "shield"       : "SFRPG.Items.Categories.Shields",
    "technological": "SFRPG.Items.Categories.TechnologicalItems",
    "upgrade"      : "SFRPG.Items.Categories.ArmorUpgrades",
    "weapon"       : "SFRPG.Items.Categories.Weapons"
};

class EquipmentBrowserSFRPG extends ItemBrowserSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.format("SFRPG.Browsers.EquipmentBrowser.Title");
        return options;
    }

    getConfigurationProperties() {
        return {
          label: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.Title"),
          settings: "equipmentBrowser"
        };
    }

    getPacksToLoad() {
        return Object.entries(this.settings);
    }

    allowedItem(item) {
        let keys = Object.keys(equipmentTypes);
        return (keys.includes(item.type));
    }

    getSortingMethods() {
        let sortingMethods = super.getSortingMethods();
        sortingMethods["level"] = {
            name: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.BrowserSortMethodLevel"),
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
            equipmentTypes: {
                label: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.ItemType"),
                content: equipmentTypes,
                filter: (element, filters) => { return this._filterItemType(element, filters); },
                activeFilters: this.filters?.equipmentTypes?.activeFilters || []
            }
        };

        if ((this.filters?.equipmentTypes?.activeFilters || []).includes("weapon")) {
            filters.weaponTypes = {
                label: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.WeaponType"),
                content: CONFIG.SFRPG.weaponTypes,
                filter: (element, filters) => { return this._filterWeaponType(element, filters); },
                activeFilters: this.filters.weaponTypes?.activeFilters || []
            }

            filters.weaponCategories = {
                label: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.WeaponCategories"),
                content: CONFIG.SFRPG.weaponCategories,
                filter: (element, filters) => { return this._filterWeaponCategory(element, filters); },
                activeFilters: this.filters.weaponCategories?.activeFilters || []
            }
        }

        if ((this.filters?.equipmentTypes?.activeFilters || []).includes("equipment")) {
            filters.armorTypes = {
                label: game.i18n.format("SFRPG.Browsers.EquipmentBrowser.EquipmentType"),
                content: CONFIG.SFRPG.armorTypes,
                filter: (element, filters) => { return this._filterArmorType(element, filters); },
                activeFilters: this.filters.armorTypes?.activeFilters || []
            }
        }

        return filters;
    }

    onFiltersUpdated(html) {
        this.refreshFilters = true;
        super.onFiltersUpdated(html);
    }

    _filterItemType(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && filters.includes(item.type);
    }

    _filterWeaponType(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && (item.type !== "weapon" || filters.includes(item.data.weaponType));
    }

    _filterWeaponCategory(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && (item.type !== "weapon" || filters.includes(item.data.weaponCategory || "uncategorized"));
    }

    _filterArmorType(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && (item.type !== "equipment" || filters.includes(item.data.armor?.type));
    }

    openSettings() {
        // Generate HTML for settings menu
        // Item Browser
        let content = '<h2>Equipment Browser</h2>';
        content += '<p>Which compendium should be loaded? Uncheck each compendium that contains no items.</p>';
    
        for (const key in this.settings) {
            content += `<div><input type=checkbox data-browser-type="item" name="${key}" ${this.settings[key].load ? 'checked=true' : ''}><label>${this.settings[key].name}</label></div>`;
        }
    
        const d = new Dialog({
            title: 'Equipment Browser settings',
            content: `${content}<br>`,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: html => {}
                }
            },
            default: 'save',
            close: html => {
                const inputs = html.find('input');
        
                for (const input of inputs) {
                    const browserType = $(input).attr('data-browser-type');
                    if (browserType === 'item') this.settings[input.name].load = input.checked;
                }
        
                console.log('SFRPG System | Equipment Browser | Saving new Settings'); // write Item Browser settings
        
                game.settings.set('sfrpg', "equipmentBrowser", JSON.stringify(this.settings)); // write Item Browser settings
                this.forceReload = true;
            }
        }, {
            width: '300px'
        });
        d.render(true);
    }
}

let _equipmentBrowser = null;
export function getEquipmentBrowser() {
    if (!_equipmentBrowser) {
        _equipmentBrowser = new EquipmentBrowserSFRPG();
    }
    return _equipmentBrowser;
}

Hooks.on('ready', e => {
    let browser = getEquipmentBrowser();
    browser.initializeSettings();
});
