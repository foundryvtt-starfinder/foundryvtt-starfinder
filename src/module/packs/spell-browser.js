import { ItemBrowserSFRPG } from './item-browser.js';
import { SFRPG } from "../config.js"

class SpellBrowserSFRPG extends ItemBrowserSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.format("SFRPG.Browsers.SpellBrowser.Title");
        return options;
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
                filter: (element, filters) => { return this._filterLevels(element, filters); }
            },
            classes: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterClass"),
                content: SFRPG.allowedClasses,
                filter: (element, filters) => { return this._filterClasses(element, filters); }
            },
            schools: {
                label: game.i18n.format("SFRPG.Browsers.SpellBrowser.BrowserFilterSchool"),
                content: SFRPG.spellSchools,
                filter: (element, filters) => { return this._filterSchools(element, filters); }
            }
        };
        return filters;
    }

    _filterLevels(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        let itemLevel = item ? JSON.stringify(item.data.level) : "null";
        return item && filters.includes(itemLevel);
    }

    _filterClasses(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        if (!item) return false;

        for (let allowedClass of filters) {
            if (item.data.allowedClasses[allowedClass]) {
                return true;
            }
        }
        return false;
    }

    _filterSchools(element, filters) {
        let compendium = element.dataset.entryCompendium;
        let itemId = element.dataset.entryId;
        let item = this.items.find(x => x.compendium === compendium && x._id === itemId);
        return item && filters.includes(item.data.school);
    }

    openSettings() {
        // Generate HTML for settings menu
        // Item Browser
        let content = '<h2>Compendium Browser</h2>';
        content += '<p>Which compendium should be loaded? Uncheck each compendium that contains no items.</p>';
    
        for (const key in this.settings) {
            content += `<div><input type=checkbox data-browser-type="item" name="${key}" ${this.settings[key].load ? 'checked=true' : ''}><label>${this.settings[key].name}</label></div>`;
        }
    
        const d = new Dialog({
            title: 'Compendium Browser settings',
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
        
                console.log('SFRPG System | Compendium Browser | Saving new Settings'); // write Item Browser settings
        
                game.settings.set('sfrpg', "spellBrowser", JSON.stringify(this.settings)); // write Item Browser settings
                this.forceReload = true;
            }
        }, {
            width: '300px'
        });
        d.render(true);
    }
}

let _spellBrowser = null;
export function getSpellBrowser() {
    if (!_spellBrowser) {
        _spellBrowser = new SpellBrowserSFRPG();
    }
    return _spellBrowser;
}

Hooks.on('ready', e => {
    // creating game setting container
    let spellBrowser = getSpellBrowser();

    game.settings.register('sfrpg', 'spellBrowser', {
        name: 'Spell Browser Settings',
        hint: 'Settings to exclude packs from loading',
        default: '',
        type: String,
        scope: 'world',
        onChange: settings => {
            spellBrowser.settings = JSON.parse(settings);
        }
    }); // load settings from container

    let settings = game.settings.get('sfrpg', 'spellBrowser');
    if (settings == '') {
        // if settings are empty create the settings data
        console.log('SFRPG | Spell Browser | Creating settings');
        settings = {};

        for (const compendium of game.packs) {
            if (compendium.metadata.entity == 'Item') {
                settings[compendium.collection] = {
                    load: true,
                    name: `${compendium.metadata.label} (${compendium.collection})`
                };
            }
        }

        game.settings.set('sfrpg', 'spellBrowser', JSON.stringify(settings));
    } else {
        // if settings do exist, reload and apply them to make sure they conform with current compendium
        console.log('SFRPG | Spell Browser | Loading settings');
        const loadedSettings = JSON.parse(settings);
        settings = {};

        for (const compendium of game.packs) {
            if (compendium.metadata.entity == 'Item') {
                settings[compendium.collection] = {
                    // add entry for each item compendium, that is turned on if no settings for it exist already
                    load: loadedSettings[compendium.collection] == undefined ? true : loadedSettings[compendium.collection].load,
                    name: compendium.metadata.label
                };
            }
        }
    }

    spellBrowser.settings = settings;
    spellBrowser.forceReload = false;
});
