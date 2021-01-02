import { getSpellBrowser } from './spell-browser.js';
import { getEquipmentBrowser } from './equipment-browser.js';
import { getStarshipBrowser } from './starship-browser.js';

Hooks.on('renderCompendiumDirectory', (app, html, data) => {
    // Browser Buttons
    const grouping = $('<div class="flexcol browser-group"></div>');
    const spellBrowserButton = $(`<button class="spell-browser-btn"><i class="fas fa-fire"></i> ${game.i18n.format("SFRPG.Browsers.SpellBrowser.Button")}</button>`);
    const equipmentBrowserButton = $(`<button class="spell-browser-btn"><i class="fas fa-cog"></i> ${game.i18n.format("SFRPG.Browsers.EquipmentBrowser.Button")}</button>`);
    const starshipBrowserButton = $(`<button class="spell-browser-btn"><i class="fas fa-rocket"></i> ${game.i18n.format("SFRPG.Browsers.StarshipBrowser.Button")}</button>`);

    html.find('.directory-footer').append(grouping);
    html.find('.browser-group').append(spellBrowserButton);
    html.find('.browser-group').append(equipmentBrowserButton);
    html.find('.browser-group').append(starshipBrowserButton);
    
    // Handle button clicks
    spellBrowserButton.click(ev => {
        ev.preventDefault();
        let browser = getSpellBrowser();
        browser.render(true);
    });

    equipmentBrowserButton.click(ev => {
        ev.preventDefault();
        let browser = getEquipmentBrowser();
        browser.render(true);
    });

    starshipBrowserButton.click(ev => {
        ev.preventDefault();
        let browser = getStarshipBrowser();
        browser.render(true);
    });
});
