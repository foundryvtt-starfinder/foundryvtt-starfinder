import { getAlienArchiveBrowser } from './alien-archive-browser.js';
import { getEquipmentBrowser } from './equipment-browser.js';
import { getSpellBrowser } from './spell-browser.js';
import { getStarshipBrowser } from './starship-browser.js';

Hooks.on('renderCompendiumDirectory', (app, html, data) => {
    // Browser Buttons
    const grouping = $('<div class="flexcol browser-group"></div>');

    const alienArchiveBrowserButton = $(`<button class="alien-archive-browser-btn"><i class="fas fa-spaghetti-monster-flying"></i>${game.i18n.format("SFRPG.Browsers.AlienArchiveBrowser.Button")}</button>`);
    const spellBrowserButton = $(`<button class="spell-browser-btn"><i class="fas fa-wand-magic-sparkles"></i>${game.i18n.format("SFRPG.Browsers.SpellBrowser.Button")}</button>`);
    const equipmentBrowserButton = $(`<button class="equipment-browser-btn"><i class="fas fa-gun"></i>${game.i18n.format("SFRPG.Browsers.EquipmentBrowser.Button")}</button>`);
    const starshipBrowserButton = $(`<button class="starship-browser-btn"><i class="fas fa-rocket"></i>${game.i18n.format("SFRPG.Browsers.StarshipBrowser.Button")}</button>`);

    const footer = html.find('.directory-footer').append(grouping);
    html.find('.browser-group').append(alienArchiveBrowserButton);
    html.find('.browser-group').append(spellBrowserButton);
    html.find('.browser-group').append(equipmentBrowserButton);
    html.find('.browser-group').append(starshipBrowserButton);

    footer.css("padding", "0");

    // Handle button clicks
    alienArchiveBrowserButton.click(ev => {
        ev.preventDefault();
        const browser = getAlienArchiveBrowser();
        browser.render(true);
    });

    spellBrowserButton.click(ev => {
        ev.preventDefault();
        const browser = getSpellBrowser();
        browser.render(true);
    });

    equipmentBrowserButton.click(ev => {
        ev.preventDefault();
        const browser = getEquipmentBrowser();
        browser.render(true);
    });

    starshipBrowserButton.click(ev => {
        ev.preventDefault();
        const browser = getStarshipBrowser();
        browser.render(true);
    });
});

export function initializeBrowsers() {
    const equipmentBrowser = getEquipmentBrowser();
    equipmentBrowser.initializeSettings(["equipment"]);

    const spellBrowser = getSpellBrowser();
    spellBrowser.initializeSettings(["spells"]);

    const starshipBrowser = getStarshipBrowser();
    starshipBrowser.initializeSettings(["starship-components"]);
}
