/**
 * ItemBrowserSFRPG forked from ItemBrowserPF2e by Felix Miller aka syl3r86
 * @author Fabien Dey
 * @version 0.1
 */
import { ItemBrowserSFRPG } from './item-browser.js';
import { packLoader } from './pack-loader.js';

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
            this.openSettings("spellBrowser");
          }
        });
      }
    });
  }

  async getData() {
    if (this.items == undefined || this.settingsChanged == true) {
      // spells will be stored locally to not require full loading each time the browser is opened
      this.items = await this.loadSpells();
      this.settingsChanged = false;
    }

    const data = {};
    data.items = this.items;
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

export const spellBrowser = new SpellBrowserSFRPG();