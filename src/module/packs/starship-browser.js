import { DocumentBrowserSFRPG } from './document-browser.js';
import { SFRPG } from "../config.js"

const starshipComponentTypes = {
    "starshipAblativeArmor": "SFRPG.Items.Categories.StarshipAblativeArmors",
    "starshipArmor": "SFRPG.Items.Categories.StarshipArmors",
    "starshipComputer": "SFRPG.Items.Categories.StarshipComputers",
    "starshipCrewQuarter": "SFRPG.Items.Categories.StarshipCrewQuarters",
    "starshipDefensiveCountermeasure": "SFRPG.Items.Categories.StarshipDefensiveCountermeasures",
    "starshipDriftEngine": "SFRPG.Items.Categories.StarshipDriftEngine",
    "starshipExpansionBay": "SFRPG.Items.Categories.StarshipExpansionBays",
    "starshipFortifiedHull": "SFRPG.Items.Categories.StarshipFortifiedHulls",
    "starshipFrame": "SFRPG.Items.Categories.StarshipFrames",
    "starshipOtherSystem": "SFRPG.Items.Categories.StarshipOtherSystems",
    "starshipPowerCore": "SFRPG.Items.Categories.StarshipPowerCores",
    "starshipReinforcedBulkhead": "SFRPG.Items.Categories.StarshipReinforcedBulkheads",
    "starshipSecuritySystem": "SFRPG.Items.Categories.StarshipSecuritySystems",
    "starshipSensor": "SFRPG.Items.Categories.StarshipSensors",
    "starshipShield": "SFRPG.Items.Categories.StarshipShields",
    "starshipThruster": "SFRPG.Items.Categories.StarshipThrusters",
    "starshipWeapon": "SFRPG.Items.Categories.StarshipWeapons"
};

class StarshipBrowserSFRPG extends DocumentBrowserSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.format("SFRPG.Browsers.StarshipBrowser.Title");
        return options;
    }

    getConfigurationProperties() {
        return {
          label: game.i18n.format("SFRPG.Browsers.StarshipBrowser.Title"),
          settings: "starshipBrowser"
        };
    }

    getPacksToLoad() {
        return Object.entries(this.settings);
    }

    allowedItem(item) {
        let keys = Object.keys(starshipComponentTypes);
        return (keys.includes(item.type));
    }

    getSortingMethods() {
        let sortingMethods = super.getSortingMethods();
        sortingMethods["pcu"] = {
            name: game.i18n.format("SFRPG.Browsers.StarshipBrowser.BrowserSortMethodPCU"),
            method: this._sortByPCU
        };
        sortingMethods["bp"] = {
            name: game.i18n.format("SFRPG.Browsers.StarshipBrowser.BrowserSortMethodBP"),
            method: this._sortByBP
        };
        return sortingMethods;
    }

    _sortByPCU(elementA, elementB) {
        const rawValA = $(elementA).find('input[name=pcu]').val();
        const rawValB = $(elementB).find('input[name=pcu]').val();

        let aVal = parseInt(rawValA);
        if (Number.isNaN(aVal)) {
            aVal = -1;
        }

        let bVal = parseInt(rawValB);
        if (Number.isNaN(bVal)) {
            bVal = -1;
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

    _sortByBP(elementA, elementB) {
        const rawValA = $(elementA).find('input[name=cost]').val();
        const rawValB = $(elementB).find('input[name=cost]').val();

        let aVal = parseInt(rawValA);
        if (Number.isNaN(aVal)) {
            aVal = -1;
        }

        let bVal = parseInt(rawValB);
        if (Number.isNaN(bVal)) {
            bVal = -1;
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

    getFilters() {
        let filters = {
            starshipComponentTypes: {
                label: game.i18n.format("SFRPG.Browsers.StarshipBrowser.ComponentType"),
                content: starshipComponentTypes,
                filter: (element, filters) => { return this._filterComponentType(element, filters); },
                activeFilters: this.filters?.starshipComponentTypes?.activeFilters || []
            }
        };

        if ((this.filters?.starshipComponentTypes?.activeFilters || []).includes("starshipWeapon")) {
            filters.starshipWeaponTypes = {
                label: game.i18n.format("SFRPG.Browsers.StarshipBrowser.WeaponType"),
                content: SFRPG.starshipWeaponTypes,
                filter: (element, filters) => { return this._filterWeaponType(element, filters); },
                activeFilters: this.filters.starshipWeaponTypes?.activeFilters || []
            }

            filters.starshipWeaponClass = {
                label: game.i18n.format("SFRPG.Browsers.StarshipBrowser.WeaponClass"),
                content: SFRPG.starshipWeaponClass,
                filter: (element, filters) => { return this._filterWeaponClass(element, filters); },
                activeFilters: this.filters.starshipWeaponClass?.activeFilters || []
            }
        }

        return filters;
    }

    getTags() {
        return {
            pcu: {
                name: game.i18n.localize("SFRPG.Browsers.StarshipBrowser.BrowserSortMethodPCU"),
                dataKey: "pcu",
                sortValue: "pcu"
            },
            bp: {
                name: game.i18n.localize("SFRPG.Browsers.StarshipBrowser.BrowserSortMethodBP"),
                dataKey: "cost",
                sortValue: "bp"
            }
        };
    }

    onFiltersUpdated(html) {
        this.refreshFilters = true;
        super.onFiltersUpdated(html);
    }

    _filterComponentType(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && filters.includes(item.type);
    }

    _filterWeaponType(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && (item.type !== "starshipWeapon" || filters.includes(item.data.weaponType));
    }

    _filterWeaponClass(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && (item.type !== "starshipWeapon" || filters.includes(item.data.class));
    }

    openSettings() {
        // Generate HTML for settings menu
        // Item Browser
        let content = '<h2>Starship Browser</h2>';
        content += '<p>Which compendium should be loaded? Uncheck each compendium that contains no items.</p>';
    
        for (const key in this.settings) {
            content += `<div><input type=checkbox data-browser-type="item" name="${key}" ${this.settings[key].load ? 'checked=true' : ''}><label>${this.settings[key].name}</label></div>`;
        }
    
        const d = new Dialog({
            title: 'Starship Browser settings',
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
        
                console.log('SFRPG System | Starship Browser | Saving new Settings'); // write Item Browser settings
        
                game.settings.set('sfrpg', "starshipBrowser", JSON.stringify(this.settings)); // write Item Browser settings
                this.forceReload = true;
            }
        }, {
            width: '300px'
        });
        d.render(true);
    }
}

let _starshipBrowser = null;
export function getStarshipBrowser() {
    if (!_starshipBrowser) {
        _starshipBrowser = new StarshipBrowserSFRPG();
    }
    return _starshipBrowser;
}
