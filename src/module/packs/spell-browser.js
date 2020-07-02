/**
 * ItemBrowserSFRPG forked from ItemBrowserPF2e by Felix Miller aka syl3r86
 * @author Fabien Dey
 * @version 0.1
 */
import Progress from '../progress.js';

class ItemBrowserSFRPG extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes = options.classes.concat(['sfrpg', 'spell-browser-window']);
    options.title = 'Add an Item';
    options.width = 800;
    options.height = 700;
    return options;
  }

  activateListeners(html) {
    this.resetFilters(html);
    html.on('click', '.clear-filters', ev => {
      this.resetFilters(html);
      this.filterSpells(html.find('li'));
    }); // show spell card

    html.on('click', '.item-edit', ev => {
      const itemId = $(ev.currentTarget).parents('.spell').attr('data-entry-id');
      const itemCategory = $(ev.currentTarget).parents('.spell').attr('data-item-category');
      const items = this[itemCategory];
      let item = items[itemId];
      const pack = game.packs.find(p => p.collection === item.compendium);
      item = pack.getEntity(itemId).then(spell => {
        spell.sheet.render(true);
      });
    }); //show actor card

    html.on('click', '.actor-edit', ev => {
      const actorId = $(ev.currentTarget).parents('.spell').attr('data-entry-id');
      const actorCategory = $(ev.currentTarget).parents('.spell').attr('data-actor-category');
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
    }); // sort spell list

    html.on('change', 'select[name=sortorder]', ev => {
      const spellList = html.find('li');
      const byName = ev.target.value == 'true';
      const sortedList = this.sortSpells(spellList, byName);
      const ol = $(html.find('ul'));
      ol[0].innerHTML = [];

      for (const element of sortedList) {
        ol[0].append(element);
      }
    }); // activating or deactivating filters

    html.on('change paste', 'input[name=textFilter]', ev => {
      this.sorters.text = ev.target.value;
      this.filterSpells(html.find('li'));
    });
    html.on('change', '#timefilter select', ev => {
      this.sorters.castingtime = ev.target.value;
      this.filterSpells(html.find('li'));
    }); // filters for level, class and school

    html.on('click', 'input[type=checkbox]', ev => {
      const filterType = ev.target.name.split(/-(.+)/)[0];
      const filterTarget = ev.target.name.split(/-(.+)/)[1];
      const filterValue = ev.target.checked;

      if (Object.keys(this.filters).includes(filterType)) {
        this.filters[filterType][filterTarget] = filterValue;
        this.filters[filterType] = this.clearObject(this.filters[filterType]);
      }

      this.filterSpells(html.find('li'));
    });
  }

  sortSpells(list, byName) {
    if (byName) {
      list.sort((a, b) => {
        const aName = $(a).find('.spell-name a')[0].innerHTML;
        const bName = $(b).find('.spell-name a')[0].innerHTML;

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
          const aName = $(a).find('.spell-name a')[0].innerHTML;
          const bName = $(b).find('.spell-name a')[0].innerHTML;
          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        }
      });
    }

    return list;
  }

  async filterSpells(li) {
    let counter = 0;
    li.hide();

    for (const spell of li) {
      if (this.getFilterResult(spell)) {
        $(spell).show();

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
          if ($(element).find('.spell-name a')[0].innerHTML.toLowerCase().indexOf(string.toLowerCase().trim()) == -1) {
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
         * Filter for allowedClasses for spell item
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

  openSettings() {
    // Generate HTML for settings menu
    // Spell Browser
    let content = '<h2>Spell Browser</h2>';
    content += '<p>Which compendium should be loaded? Uncheck each compendium that contains no spells.</p>';

    for (const key in this.settings) {
      content += `<div><input type=checkbox data-browser-type="spell" name="${key}" ${spellBrowser.settings[key].load ? 'checked=true' : ''}><label>${spellBrowser.settings[key].name}</label></div>`;
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
          if (browserType === 'spell') spellBrowser.settings[input.name].load = input.checked;
        }

        console.log('SFRPG System | Compendium Browser | Saving new Settings'); // write Spell Browser settings

        game.settings.set('sfrpg', 'spellBrowser', JSON.stringify(spellBrowser.settings)); // write Feat Browser settings
        this.settingsChanged = true;
      }
    }, {
      width: '300px'
    });
    d.render(true);
  }

}

class SpellBrowserSFRPG extends ItemBrowserSFRPG {
  constructor(app) {
    super(app); // load settings

    Hooks.on('ready', e => {
      // creating game setting container
      game.settings.register('sfrpg', 'spellBrowser', {
        name: 'Spell Browser Settings',
        hint: 'Settings to exclude packs from loading',
        default: '',
        type: String,
        scope: 'world',
        onChange: settings => {
          this.settings = JSON.parse(settings);
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

      this.settings = settings;
      this.settingsChanged = false;
    });
    this.hookCompendiumList();
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sfrpg/templates/packs/spell-browser.html';

    options.title = 'Add a Spell';
    options.width = 800;
    options.height = 700;
    return options;
  }

  hookCompendiumList() {
    Hooks.on('renderCompendiumDirectory', (app, html, data) => {
      // Spell Browser Buttons
      const grouping = $('<div class="flexcol browser-group"></div>');
      const importButton = $(`<button class="spell-browser-btn"><i class="fas fa-fire"></i> Spell Browser</button>`);
      const settingsButton = $('<button class="spell-browser-settings-btn"><i class="fas fa-cog" title="Right click to reset settings."></i></button>');

      if (game.user.isGM) {
        html.find('.directory-footer').append(grouping);
        html.find('.browser-group').append(importButton);
        html.find('.browser-group').append(settingsButton);
      } else {
        // adding to directory-list since the footer doesn't exist if the user is not gm
        html.find('.directory-list').append(importButton);
      } // Handle button clicks


      importButton.click(ev => {
        ev.preventDefault();
        this.render(true);
      });

      if (game.user.isGM) {
        // only add settings click event if the button exists
        settingsButton.mousedown(ev => {
          const rightClick = ev.which === 3;

          if (rightClick) {
            this.resetSettings();
          } else {
            this.openSettings();
          }
        });
      }
    });
  }

  async getData() {
    if (this.spells == undefined || this.settingsChanged == true) {
      // spells will be stored locally to not require full loading each time the browser is opened
      this.spells = await this.loadSpells();
      this.settingsChanged = false;
    }

    const data = {};
    data.spells = this.spells;
    data.classes = this.classes;
    data.schools = this.schools;
    return data;
  }

  async loadSpells() {
    console.log('SFRPG | Spell Browser | Started loading spells');
    const foundSpells = '';
    const unfoundSpells = '';
    const spells = {};
    let classesArr = [];
    const traditionsArr = [];
    let schoolsArr = [];
    const timeArr = [];

    for await (const {
      pack,
      content
    } of packLoader.loadPacks('Item', this._loadedPacks)) {
      console.log(`SFRPG | Spell Browser | ${pack.metadata.label} - ${content.length} entries found`);

      for (let spell of content) {
        spell = spell.data;

        if (spell.type == 'spell') {
          // record the pack the spell was read from
          spell.compendium = pack.collection; // format spell level for display

          if (spell.data.allowedClasses !== undefined) {
              const classList = Object.keys(CONFIG.SFRPG.allowedClasses);
              const classIntersection = classList.filter(x => Object.keys(spell.data.allowedClasses).filter(x => spell.data.allowedClasses[x]).includes(x));

              if (classIntersection.length !== 0) {
                  for (let [t, choices] of Object.entries(classIntersection)) {
                      if (classesArr.includes(choices) === false) {
                          classesArr.push(choices)
                      }
                  }
              } // recording casting times
          }

          if (spell.data.school !== undefined) {
              if (schoolsArr.includes(spell.data.school) === false) {
                  schoolsArr.push(spell.data.school);
              }
          }

          spells[spell._id] = spell;
        }
      }
    }

    if (unfoundSpells !== '') {
      console.log('SFRPG | Spell Browser | List of Spells that don\'t have a class assosiated to them:');
      console.log(unfoundSpells);
    } //  sorting and assigning better class names


    const classesObj = {};
    classesArr = classesArr.sort();

    for (const classStr of classesArr) {
      // let fixedClassName = classStr.replace('revisited', ' revisited').toLowerCase().replace(/(^|\s)([a-z])/g, function (m, p1, p2) { return p1 + p2.toUpperCase(); });
      classesObj[classStr] = CONFIG.SFRPG.allowedClasses[classStr];
    } // sorting and assigning proper school names

    const schoolsObj = {};
    schoolsArr = schoolsArr.sort();

    for (const school of schoolsArr) {
      schoolsObj[school] = CONFIG.SFRPG.spellSchools[school];
    }

    this.classes = classesObj;
    this.schools = schoolsObj;


    console.log('SFRPG | Spell Browser | Finished loading spells');
    return spells;
  }

}

class PackLoader {
  constructor() {
    this.loadedPacks = {
      Actor: {},
      Item: {}
    };
  }

  async *loadPacks(entityType, packs) {
    if (!this.loadedPacks[entityType]) {
      this.loadedPacks[entityType] = {};
    } // TODO: i18n for progress bar


    const progress = new Progress({
      steps: packs.length
    });

    for (const packId of packs) {
      let data = this.loadedPacks[entityType][packId];

      if (!data) {
        const pack = game.packs.get(packId);
        progress.advance(`Loading ${pack.metadata.label}`);

        if (pack.metadata.entity === entityType) {
          const content = await pack.getContent();
          data = this.loadedPacks[entityType][packId] = {
            pack,
            content
          };
        } else {
          continue;
        }
      } else {
        const {
          pack
        } = data;
        progress.advance(`Loading ${pack.metadata.label}`);
      }

      yield data;
    }

    progress.close('Loading complete');
  }

}

const packLoader = new PackLoader();
export const spellBrowser = new SpellBrowserSFRPG();