/**
 * ItemBrowserSFRPG forked from ItemBrowserPF2e by Felix Miller aka syl3r86
 * @author Fabien Dey
 * @version 0.1
 */
export class ItemBrowserSFRPG extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes = options.classes.concat(['sfrpg', 'item-browser-window']);
    options.title = 'Add an Item';
    options.width = 800;
    options.height = 700;
    return options;
  }

  activateListeners(html) {
    this.resetFilters(html);
    html.on('click', '.clear-filters', ev => {
      this.resetFilters(html);
      this.filterItems(html.find('li'));
    }); // show item card

    html.on('click', '.item-edit', ev => {
      const itemId = $(ev.currentTarget).parents('.item').attr('data-entry-id');
      const itemCategory = $(ev.currentTarget).parents('.item').attr('data-item-category');
      const items = this[itemCategory];
      let item = items[itemId];
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
      const byName = ev.target.value == 'true';
      const sortedList = this.sortItems(itemList, byName);
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
    }); // filters for level, class and school

    html.on('click', 'input[type=checkbox]', ev => {
      const filterType = ev.target.name.split(/-(.+)/)[0];
      const filterTarget = ev.target.name.split(/-(.+)/)[1];
      const filterValue = ev.target.checked;

      if (Object.keys(this.filters).includes(filterType)) {
        this.filters[filterType][filterTarget] = filterValue;
        this.filters[filterType] = this.clearObject(this.filters[filterType]);
      }

      this.filterItems(html.find('li'));
    });
  }

  sortItems(list, byName) {
    if (byName) {
      list.sort((a, b) => {
        const aName = $(a).find('.item-name a')[0].innerHTML;
        const bName = $(b).find('.item-name a')[0].innerHTML;

        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });
    } else {
      list.sort((a, b) => {
        const aVal = parseInt($(a).find('input[name=level]').val());
        const bVal = parseInt($(b).find('input[name=level]').val());
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;

        if (aVal == bVal) {
          const aName = $(a).find('.item-name a')[0].innerHTML;
          const bName = $(b).find('.item-name a')[0].innerHTML;
          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        }
      });
    }

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

    for (let filter of Object.keys(this.filters)) {

      if (Object.keys(this.filters[filter]).length > 0) {
          let hide = true;
        /*
         * Filter for allowedClasses for item item
         */
        if(filter == 'allowedClasses'){
            let current = this.filters[filter];

            //Todo make more dynamic
            let filterMystString = "allowedClasses.myst";
            let filterTechString = "allowedClasses.tech";
            let filterWyshString = "allowedClasses.wysh";
            let filteredMystElements = $(element).find(`input[name="${filterMystString}"]`).val();
            let filteredTechElements = $(element).find(`input[name="${filterTechString}"]`).val();
            let filteredWyshElements = $(element).find(`input[name="${filterWyshString}"]`).val();

           //Check for mystic class
            if(current.myst && filteredMystElements === 'true'){
               hide = false;
               continue;
            }

            //Check for technomancer class
            if(current.tech && filteredTechElements === 'true'){
                hide = false;
                continue;
            }

            //Check for wyshmaster class
            if(current.wysh && filteredWyshElements === 'true'){
                hide = false;
                continue;
            }

            if (hide) return false;
        }else{
            const filteredElements = $(element).find(`input[name=${filter}]`).val();
            let hide = true;

            if (filteredElements != undefined) {
                for (const e of filteredElements.split(',')) {
                    if (this.filters[filter][e.trim()] == true) {
                        hide = false;
                        break;
                    }
                }
            }
            if (hide) return false;
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

  resetFilters(html) {
    this.sorters = {
      text: '',
      castingtime: 'null'
    };
    this.filters = {
      level: {},
      allowedClasses: {},
      school: {},
      group: {},
      source: {},
    };
    html.find('input[name=textFilter]').val('');
    html.find('input[name=timefilter]').val('null');
    html.find('input[type=checkbox]').prop('checked', false);
  }
  /* -------------------------------------------- */

  get _loadedPacks() {
    return Object.entries(this.settings).flatMap(([collection, {
      load
    }]) => {
      return load ? [collection] : [];
    });
  }

  openSettings(saveName) {
    // Generate HTML for settings menu
    // Item Browser
    let content = '<h2>Item Browser</h2>';
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

        game.settings.set('sfrpg', saveName, JSON.stringify(this.settings)); // write Item Browser settings
        this.settingsChanged = true;
      }
    }, {
      width: '300px'
    });
    d.render(true);
  }
}
