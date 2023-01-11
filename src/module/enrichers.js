import { getAlienArchiveBrowser } from "./packs/alien-archive-browser.js";
import { getEquipmentBrowser } from "./packs/equipment-browser.js";
import { getSpellBrowser } from "./packs/spell-browser.js";
import { getStarshipBrowser } from "./packs/starship-browser.js";

const browserTypes = ["spell", "equipment", "starship", "alien"];

export default function setupEnrichers() {
    const browserLink = {
        pattern: /(@Browser)\[(.+?)\](?:{(.+?)})?/gm,
        enricher: (match, options) => {

            const args = match[2].split("|");
            let name = match[3];

            const argObj = args.reduce((obj, i) => {
                const split = i.split(":");
                obj[split[0]] = split[1];
                return obj;
            }, {});

            if (!browserTypes.includes(argObj.type)) {
                const strong = document.createElement("strong");
                strong.innerText = `${match[1]} parsing failed! Type is invalid.`;
                return strong;
            }

            if (!name) {
                name = argObj.type.capitalize() + " Browser";
            }

            const a = document.createElement("a");
            a.dataset.action = argObj.type;
            a.classList.add("enriched-link");
            a.draggable = false;
            a.innerHTML = `<i class="fas fa-book"></i>${name}`;
            return a;

        }
    };

    CONFIG.TextEditor.enrichers.push(browserLink);

}

Hooks.on("renderJournalPageSheet", (app, html, options) => {
    for (const type of browserTypes) {
        html[2].querySelectorAll(`a[data-action=${type}]`)
            .forEach(i => {
                i.addEventListener("click", (ev) => _browserOnClick(ev, i.dataset.action));
            });

    }
});

function _browserOnClick(ev, action) {
    let browser;
    switch (action) {
    case "spell":
        browser = getSpellBrowser();
        break;
    case "equipment":
        browser = getEquipmentBrowser();
        break;
    case "starship":
        browser = getStarshipBrowser();
        break;
    case "alien":
        browser = getAlienArchiveBrowser();
        break;
    }

    if (!browser._element) {
        browser.render(true);
    }
}

