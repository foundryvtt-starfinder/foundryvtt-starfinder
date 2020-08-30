import { getSpellBrowser } from './spell-browser.js';
import { getEquipmentBrowser } from './equipment-browser.js';

Hooks.on('renderCompendiumDirectory', (app, html, data) => {
    // Spell Browser Buttons
    const grouping = $('<div class="flexcol browser-group"></div>');
    const importButton = $(`<button class="spell-browser-btn"><i class="fas fa-fire"></i> ${game.i18n.format("SFRPG.Browsers.SpellBrowser.Button")}</button>`);
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
        let browser = getEquipmentBrowser();
        browser.render(true);
    });

    if (game.user.isGM) {
        // only add settings click event if the button exists
        settingsButton.mousedown(ev => {
            const rightClick = ev.which === 3;

            if (rightClick) {
                getSpellBrowser().resetSettings();
            } else {
                getSpellBrowser().openSettings();
            }
        });
    }
});
