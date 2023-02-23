/**
 * DocumentBrowserSFRPG forked from ItemBrowserPF2e by Felix Miller aka syl3r86
 */
import { packLoader } from './pack-loader.js';

export class DocumentBrowserSFRPG extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = 'systems/sfrpg/templates/packs/document-browser.hbs';
        options.classes = options.classes.concat(['sfrpg', 'document-browser-window']);
        options.title = game.i18n.format("SFRPG.Browsers.ItemBrowser.Title");
        options.width = 800;
        options.height = 700;
        return options;
    }

    get entityType() {
        return "Item";
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM) {
            buttons = [
                {
                    label: "Settings",
                    class: "configure-sheet",
                    icon: "fas fa-cog",
                    onclick: ev => this.openSettings()
                }
            ].concat(buttons);
        }
        return buttons;
    }

    activateListeners(html) {
        this.resetFilters(html, !!this.filters);
        html.on('click', '.clear-filters', ev => {
            this.resetFilters(html);
            this.filterItems(html.find('li'));
        });

        // show item card
        html.on('click', '.item-edit', async (ev) => {
            const itemUuid = $(ev.currentTarget).parents('.item')
                .attr('data-entry-uuid');
            const doc = await fromUuid(itemUuid);
            doc.sheet.render(true);
        });

        // show actor card
        html.on('click', '.actor-edit', async (ev) => {
            const actorId = $(ev.currentTarget).parents('.item')
                .attr('data-entry-uuid');
            const doc = await fromUuid(actorId);
            doc.sheet.render(true);
        });

        // make draggable
        html.on('click', '.item-sort-link', ev => {
            const sortKey = $(ev.currentTarget).attr('data-key');
            const sortingControl = $(".sortingControl");
            sortingControl.val(sortKey);
            sortingControl.trigger('change');
        });

        html.find('.draggable').each((i, li) => {
            li.setAttribute('draggable', true);
            li.addEventListener('dragstart', event => {
                this._onDragStart(event, li);
            }, false);
        });

        // toggle visibility of filter containers
        html.on('click', '.filtercontainer h3', ev => {
            $(ev.target.nextElementSibling).toggle(100);
        });

        // toggle hints
        html.on('mousedown', 'input[name=textFilter]', ev => {
            if (event.which == 3) {
                $(html.find('.hint')).toggle(100);
            }
        });

        // sort item list
        html.on('change', 'select[name=sortorder]', ev => {
            const itemList = html.find('li');
            const sortedList = this.sortItems(itemList, ev.target.value);

            const ol = $(html.find('.item-list'));
            ol[0].innerHTML = [];
            for (const element of sortedList) {
                ol[0].append(element);
            }
        });

        // activating or deactivating filters
        html.on('change paste', 'input[name=textFilter]', ev => {
            this.sorters.text = ev.target.value;
            this.filterItems(html.find('li'));
        });
        html.on('change', '#timefilter select', ev => {
            this.sorters.castingtime = ev.target.value;
            this.filterItems(html.find('li'));
        });

        html.on('click', 'input[type=checkbox]', ev => {
            const filterSplit = ev.target.name.split(/-/);
            const filterType = filterSplit[0];
            const filterTarget = filterSplit[1];
            const filterValue = ev.target.checked;

            this.filters[filterType].activeFilters = this.filters[filterType].activeFilters || [];
            if (filterValue) {
                if (!this.filters[filterType].activeFilters.find(x => x === filterTarget)) {
                    this.filters[filterType].activeFilters.push(filterTarget);
                }
            } else {
                this.filters[filterType].activeFilters = this.filters[filterType].activeFilters.filter(x => x !== filterTarget);
            }

            this.filterItems(html.find('li'));

            this.onFiltersUpdated(html);
        });

        html.on('change paste', 'input[class=rangeFilter]', ev => {
            const filterSplit = ev.target.name.split(/-/);
            const filterType = filterSplit[0];
            const filterTarget = filterSplit[1];
            let filterValue = ev.target.value;
            if (filterValue.includes("/")) {
                const slashSplit = filterValue.split("/");
                filterValue = Number(slashSplit[0] / slashSplit[1]);
            } else {
                filterValue = Number(filterValue);
            }

            if (Number.isNaN(filterValue)) {
                filterValue = 0;
            }

            const filter = this.filters[filterType];
            if (filter) {
                filter.content[filterTarget] = filterValue;
            }

            this.filterItems(html.find('li'));

            this.onFiltersUpdated(html);
        });

        html.on('change paste', 'input[class=valueFilter]', ev => {
            const filterSplit = ev.target.name.split(/-/);
            const filterType = filterSplit[0];
            let filterValue = ev.target.value;
            if (!filterValue.includes("/")) {
                filterValue = Number(filterValue);
            }
            if (Number.isNaN(filterValue)) {
                filterValue = 0;
            }
            const originalValue = filterValue;

            const filter = this.filters[filterType];
            if (filter) {
                if (filter.range) {
                    filterValue = Math.max(filter.range.min, filterValue);
                    if (filter.range.max > filter.range.min) {
                        filterValue = Math.min(filter.range.max, filterValue);
                    }
                }
                filter.content.value = filterValue;
            }

            if (filterValue != originalValue) {
                html.find(`input[name=${filterType}-value]`).val(filterValue);
            }

            this.filterItems(html.find('li'));

            this.onFiltersUpdated(html);
        });
    }

    _onDragStart(event, li) {
        const itemUuid = $(event.currentTarget).attr('data-entry-uuid');

        const rawData = {
            type: this.entityType,
            uuid: itemUuid
        };

        const data = JSON.stringify(rawData);

        event.dataTransfer.setData('text/plain', data);
    }

    async getData() {
        if (this.items == undefined || this.forceReload == true) {
            // spells will be stored locally to not require full loading each time the browser is opened
            this.items = await this.loadItems();
            this.forceReload = false;
            this.sortingMethods = this.getSortingMethods();
        }

        if (!this.filters || this.refreshFilters) {
            this.refreshFilters = false;
            this.filters = this.getFilters();
        }

        const data = {};
        data.defaultSortMethod = this.getDefaultSortMethod();
        data.tags = this.getTags();
        data.items = this.items;
        data.sortingMethods = this.sortingMethods;
        data.filters = this.filters;
        return data;
    }

    getDefaultSortMethod() {
        return "name";
    }

    getSortingMethods() {
        let sortingMethods = {
            name: {
                name: game.i18n.format("SFRPG.Browsers.ItemBrowser.BrowserSortMethodName"),
                selected: true,
                method: this._sortByName
            }
        };
        return sortingMethods;
    }

    _sortByName(elementA, elementB) {
        const aName = $(elementA).find('.item-name a')[0].innerHTML;
        const bName = $(elementB).find('.item-name a')[0].innerHTML;

        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
    }

    getFilters() {
        return {};
    }

    getTags() {
        return {};
    }

    allowedItem(item) {
        return true;
    }

    async loadItems() {
        console.log('Starfinder | Compendium Browser | Started loading items');
        const items = [];

        for await (const {pack, content} of packLoader.loadPacks(this.entityType, this._loadedPacks)) {
            console.log(`Starfinder | Compendium Browser | ${pack.metadata.label} - ${content.length} entries found`);

            for (let item of content) {
                const itemData = {
                    uuid: `Compendium.${pack.collection}.${item._id}`,
                    img: item.img,
                    name: item.name,
                    system: item.system,
                    type: item.type
                };

                if (this.allowedItem(item)) {
                    items.push(itemData);
                }
            }
        }

        console.log('Starfinder | Compendium Browser | Finished loading items');
        return items;
    }

    sortItems(list, sortType) {
        list.sort(this.sortingMethods[sortType].method);
        return list;
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
        if (this.sorters.text != '') {
            const strings = this.sorters.text.split(',');

            for (const string of strings) {
                if (string.indexOf(':') == -1) {
                    if ($(element).find('.item-name a')[0].innerHTML.toLowerCase().indexOf(string.toLowerCase().trim()) == -1) {
                        return false;
                    }
                } else {
                    const targetValue = string.split(':')[1].trim();
                    const targetStat = string.split(':')[0].trim();

                    if ($(element).find(`input[name=${targetStat}]`)
                        .val()
                        .toLowerCase()
                        .indexOf(targetValue) == -1) {
                        return false;
                    }
                }
            }
        }

        if (this.sorters.castingtime != 'null') {
            const castingtime = $(element).find('input[name=time]')
                .val()
                .toLowerCase();

            if (castingtime != this.sorters.castingtime) {
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

    clearObject(obj) {
        const newObj = {};

        for (const key in obj) {
            if (obj[key] == true) {
                newObj[key] = true;
            }
        }

        return newObj;
    }

    resetFilters(html, updateFilters = true) {
        this.sorters = {
            text: '',
            castingtime: 'null'
        };
        for (const [filterKey, filter] of Object.entries(this.filters)) {
            if (filter.type === "multi-select") {
                filter.activeFilters = [];
            } else if (filter.type === "range") {
                filter.reset(filter);
                html.find(`input[name=${filterKey}-min]`).val(filter.content.min);
                html.find(`input[name=${filterKey}-max]`).val(filter.content.max);
            } else if (filter.type === "value") {
                filter.reset(filter);
                html.find(`input[name=${filterKey}-value]`).val(filter.content.value);
            } else {
                filter.reset(filter);
            }
        }
        html.find('input[name=textFilter]').val('');
        html.find('input[name=timefilter]').val('null');
        html.find('input[type=checkbox]').prop('checked', false);

        if (updateFilters) {
            this.onFiltersUpdated(html);
        }
    }

    onFiltersUpdated(html) {
        if (this.refreshFilters) {
            const filterContainers = html.find('.filtercontainer');
            const filterParent = filterContainers[0]?.parentElement;

            for (const filterContainer of filterContainers) {
                filterContainer.remove();
            }

            this.filters = this.getFilters();
            for (const filterKey of Object.keys(this.filters)) {
                const filter = this.filters[filterKey];
                const generatedHTML = this.generateFilterHTML(filterKey, filter);
                filterParent.insertAdjacentHTML('beforeend', generatedHTML);
            }

            this.filterItems(html.find('li'));
        }
    }

    /**
     * @param {filterObjectEquipment|
     *         filterObjectSpell    |
     *         filterObjectAlien    |
     *         filterObjectStarship} filterObject An object containing valid filters for one of the browser types.
     */
    async renderWithFilters(filterObject = {}) {

        if (!this._element) {
            this.render(true);
        }

        await this._waitForElem(`#app-${this.appId}`);
        const html = this.element;
        this.resetFilters(html);

        if (filterObject.search !== undefined && filterObject.search !== null) {
            this.sorters.text = String(filterObject.search).trim();
            html.find("input[name='textFilter']").val(this.sorters.text);
            delete filterObject.search;
            this.onFiltersUpdated(html);
        }

        for (const [filterKey, currentFilter] of Object.entries(filterObject)) {
            let browserFilter = this.filters[filterKey];
            if (!browserFilter) {
                return ui.notifications.error("Invalid filter.");
            }

            browserFilter.activeFilters = currentFilter instanceof Array ? currentFilter : [currentFilter];
            this.refreshFilters = true;
            this.onFiltersUpdated(html);
        }

    }

    _waitForElem(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    generateFilterHTML(filterKey, filter) {
        const header = `<div class="filtercontainer" id="classfilter">\n
            <h3>${filter.label}</h3>\n
            <dl>\n`;

        let body = "";
        for (let settingKey of Object.keys(filter.content)) {
            const checked = filter.activeFilters ? filter.activeFilters.includes(settingKey) : false;
            body += `<dt><input type="checkbox" name="${filterKey}-${settingKey}" ${checked ? "checked" : ""} /></dt><dd>${game.i18n.format(filter.content[settingKey])}</dd>\n`;
        }

        const footer = `</dl>\n</div>\n`;

        return header + body + footer;
    }

    /* -------------------------------------------- */
    getConfigurationProperties() {
        return {
            label: "Compendium Browser",
            settings: "itemBrowser"
        };
    }

    initializeSettings(defaultAllowedCompendiums = null) {
        const configuration = this.getConfigurationProperties();
        const entityType = this.entityType;

        game.settings.register('sfrpg', configuration.settings, {
            name: `${configuration.label} Settings`,
            hint: 'Settings to exclude packs from loading',
            default: '',
            type: String,
            scope: 'world',
            onChange: settings => {
                this.settings = JSON.parse(settings);
            }
        }); // load settings from container

        let settings = game.settings.get('sfrpg', configuration.settings);
        if (settings == '') {
            // if settings are empty create the settings data
            console.log(`Starfinder | [READY] ${configuration.label} | Creating settings`);
            settings = {};

            for (const compendium of game.packs) {
                if (compendium.documentName === entityType) {
                    settings[compendium.collection] = {
                        load: !defaultAllowedCompendiums || defaultAllowedCompendiums.includes(compendium.metadata.name),
                        name: compendium.metadata.label
                    };
                }
            }

            game.settings.set('sfrpg', configuration.settings, JSON.stringify(settings));
        } else {
            // if settings do exist, reload and apply them to make sure they conform with current compendium
            console.log(`Starfinder | [READY] ${configuration.label} | Loading settings`);
            const loadedSettings = JSON.parse(settings);
            settings = {};

            for (const compendium of game.packs) {
                if (compendium.documentName === entityType) {
                    settings[compendium.collection] = {
                        // add entry for each item compendium, that is turned on if no settings for it exist already
                        load: loadedSettings[compendium.collection] == undefined ? true : loadedSettings[compendium.collection].load,
                        name: compendium.metadata.label
                    };
                }
            }
        }

        this.settings = settings;
        this.forceReload = false;
    }

    openSettings() {
        const configuration = this.getConfigurationProperties();

        // Generate HTML for settings menu
        // Item Browser
        let content = `<h2>${configuration.label}</h2>`;
        content += '<p>Which compendium should be loaded? Uncheck each compendium that contains no items.</p>';

        for (const key in this.settings) {
            content += `<div><input type=checkbox data-browser-type="item" name="${key}" ${this.settings[key].load ? 'checked=true' : ''}><label>${this.settings[key].name}</label></div>`;
        }

        const d = new Dialog({
            title: `${configuration.label} settings`,
            content: `${content}<br>`,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: html => {
                    }
                }
            },
            default: 'save',
            close: html => {
                const inputs = html.find('input');

                for (const input of inputs) {
                    const browserType = $(input).attr('data-browser-type');
                    if (browserType === 'item') {
                        this.settings[input.name].load = input.checked;
                    }
                }

                console.log(`SFRPG System | ${configuration.label} | Saving new Settings`); // write Item Browser settings

                game.settings.set('sfrpg', configuration.settings, JSON.stringify(this.settings)); // write Item Browser settings
                this.forceReload = true;
            }
        }, {
            width: '300px'
        });
        d.render(true);
    }

    getPacksToLoad() {
        return [];
    }

    get _loadedPacks() {
        return this.getPacksToLoad().flatMap(([collection, {
            load
        }]) => {
            return load ? [collection] : [];
        });
    }
}
