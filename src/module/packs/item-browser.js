/**
 * ItemBrowserSFRPG forked from ItemBrowserPF2e by Felix Miller aka syl3r86
 * @author Fabien Dey
 * @version 0.1
 */
import { packLoader } from './pack-loader.js';

export class ItemBrowserSFRPG extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sfrpg/templates/packs/item-browser.html';
    options.classes = options.classes.concat(['sfrpg', 'item-browser-window']);
    options.title = game.i18n.format("SFRPG.Browsers.ItemBrowser.Title");
    options.width = 800;
    options.height = 700;
    return options;
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
    return buttons
  }

  activateListeners(html) {
    this.resetFilters(html, !!this.filters);
    html.on('click', '.clear-filters', ev => {
      this.resetFilters(html);
      this.filterItems(html.find('li'));
    }); // show item card

    html.on('click', '.item-edit', ev => {
      const itemId = $(ev.currentTarget).parents('.item').attr('data-entry-id');
      const itemCategory = $(ev.currentTarget).parents('.item').attr('data-item-category');
      const items = this[itemCategory];
      let item = items.find(x => x._id === itemId);
      const pack = game.packs.find(p => p.collection === item.compendium);
      item = pack.getEntity(itemId).then(item => {
        item.sheet.render(true);
      });
    }); //show actor card

    html.on('click', '.actor-edit', ev => {
      const actorId = $(ev.currentTarget).parents('.item').attr('data-entry-id');
      const actorCategory = $(ev.currentTarget).parents('.item').attr('data-actor-category');
      const actors = this[actorCategory];
      let actor = actors[actorId];
      const pack = game.packs.find(p => p.collection === actor.compendium);
      actor = pack.getEntity(actorId).then(npc => {
        npc.sheet.render(true);
      });
    }); // make draggable

    html.find('.draggable').each((i, li) => {
      li.setAttribute('draggable', true);
      li.addEventListener('dragstart', event => {
        const packName = li.getAttribute('data-entry-compendium');
        const pack = game.packs.find(p => p.collection === packName);

        if (!pack) {
          event.preventDefault();
          return false;
        }

        event.dataTransfer.setData('text/plain', JSON.stringify({
          type: pack.entity,
          pack: pack.collection,
          id: li.getAttribute('data-entry-id')
        }));
      }, false);
    }); // toggle visibility of filter containers

    html.on('click', '.filtercontainer h3', ev => {
      $(ev.target.nextElementSibling).toggle(100);
    }); // toggle hints

    html.on('mousedown', 'input[name=textFilter]', ev => {
      if (event.which == 3) {
        $(html.find('.hint')).toggle(100);
      }
    }); // sort item list

    html.on('change', 'select[name=sortorder]', ev => {
      const itemList = html.find('li');
      const sortedList = this.sortItems(itemList, ev.target.value);

      const ol = $(html.find('ul'));
      ol[0].innerHTML = [];
      for (const element of sortedList) {
        ol[0].append(element);
      }
    }); // activating or deactivating filters

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
    data.items = this.items;
    data.sortingMethods = this.sortingMethods;
    data.filters = this.filters;
    return data;
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

  allowedItem(item) {
    return true;
  }

  async loadItems() {
    console.log('SFRPG | Compendium Browser | Started loading items');
    const items = [];

    for await (const {pack, content} of packLoader.loadPacks('Item', this._loadedPacks)) {
      console.log(`SFRPG | Compendium Browser | ${pack.metadata.label} - ${content.length} entries found`);

      for (let item of content) {
        item = item.data;
        item.compendium = pack.collection;

        if (this.allowedItem(item)) {
          items.push(item);
        }
      }
    }

    console.log('SFRPG | Compendium Browser | Finished loading items');
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

          if ($(element).find(`input[name=${targetStat}]`).val().toLowerCase().indexOf(targetValue) == -1) {
            return false;
          }
        }
      }
    }

    if (this.sorters.castingtime != 'null') {
      const castingtime = $(element).find('input[name=time]').val().toLowerCase();

      if (castingtime != this.sorters.castingtime) {
        return false;
      }
    }

    for (let availableFilter of Object.values(this.filters)) {
      if (availableFilter.activeFilters && availableFilter.activeFilters.length > 0) {
        if (!availableFilter.filter(element, availableFilter.activeFilters)) {
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

  resetFilters(html, updateFilters=true) {
    this.sorters = {
      text: '',
      castingtime: 'null'
    };
    for (let filterKey of Object.keys(this.filters)) {
      this.filters[filterKey].activeFilters = [];
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
      let filterContainers = html.find('.filtercontainer');
      let filterParent = filterContainers[0]?.parentElement;

      for (let filterContainer of filterContainers) {
        filterContainer.remove();
      }

      this.filters = this.getFilters();
      for (let filterKey of Object.keys(this.filters)) {
        let filter = this.filters[filterKey];
        let generatedHTML = this.generateFilterHTML(filterKey, filter);
        filterParent.insertAdjacentHTML('beforeend', generatedHTML);
      }

      this.filterItems(html.find('li'));
    }
  }

  generateFilterHTML(filterKey, filter) {
    let header = `<div class="filtercontainer" id="classfilter">\n
      <h3>${filter.label}</h3>\n
      <dl>\n`;

    let body = "";
    for (let settingKey of Object.keys(filter.content)) {
      let checked = filter.activeFilters ? filter.activeFilters.includes(settingKey) : false;
      body += `<dt><input type="checkbox" name="${filterKey}-${settingKey}" ${checked ? "checked": ""} /></dt><dd>${game.i18n.format(filter.content[settingKey])}</dd>\n`;
    }
    
    let footer = `</dl>\n
    </div>\n`;

    return header + body + footer;
  }

  /* -------------------------------------------- */
  getConfigurationProperties() {
    return {
      label: "Compendium Browser",
      settings: "itemBrowser"
    };
  }

  initializeSettings() {
    let configuration = this.getConfigurationProperties();

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
        console.log(`SFRPG | ${configuration.label} | Creating settings`);
        settings = {};

        for (const compendium of game.packs) {
            if (compendium.metadata.entity == 'Item') {
                settings[compendium.collection] = {
                    load: true,
                    name: `${compendium.metadata.label} (${compendium.collection})`
                };
            }
        }

        game.settings.set('sfrpg', configuration.settings, JSON.stringify(settings));
    } else {
        // if settings do exist, reload and apply them to make sure they conform with current compendium
        console.log(`SFRPG | ${configuration.label} | Loading settings`);
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

    this.settings = settings;
    this.forceReload = false;
  }

  openSettings() {
    let configuration = this.getConfigurationProperties();

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
