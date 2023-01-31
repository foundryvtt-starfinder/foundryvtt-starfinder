import { getAlienArchiveBrowser } from "./packs/alien-archive-browser.js";
import { getEquipmentBrowser } from "./packs/equipment-browser.js";
import { getSpellBrowser } from "./packs/spell-browser.js";
import { getStarshipBrowser } from "./packs/starship-browser.js";

const browserTypes = ["spell", "equipment", "starship", "alien"];
const icons = {
    equipment: "fa-gun",
    spell: "fa-sparkles",
    starship: "fa-rocket",
    alien: "fa-alien"
};

export default function setupEnrichers() {
    const browserLink = {
        // E.g @Browser[type:equipment|filters:{"equipmentTypes":"weapon","weaponTypes":"smallA","weaponCategories":"cryo","search":"Big Gun"}]

        pattern: /(@Browser)\[(.+?)\](?:{(.+?)})?/gm,
        enricher: (match, options) => {
            // Split each argument from the square brackets
            const args = match[2].split("|");
            // Capture the name from the curly brackets
            let name = match[3];

            const argObj = args.reduce((obj, i) => {
                // Split each arg into a key and a value
                // Matches a colon with a letter before, and either a letter or JSON after.
                // Set up as to not split colons in JSONs
                const split = i.match(/(\w+):(\w+|{.+})/);
                if (split?.length > 0) {
                    obj[split[1]] = split[2];
                }

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

            a.dataset.type = argObj.type;
            if (argObj.filters) a.dataset.filters = JSON.stringify(argObj.filters);

            a.classList.add("enriched-link");
            a.draggable = false;

            a.innerHTML = `<i class="fas ${icons[argObj.type]}"></i>${name}`;

            return a;

        }
    };

    CONFIG.TextEditor.enrichers.push(browserLink);

}

Hooks.on("renderJournalPageSheet", (app, html, options) => {
    for (const type of browserTypes) {
        html[2].querySelectorAll(`a[data-type=${type}]`)
            .forEach(i => {
                i.addEventListener("click", (ev) => _browserOnClick(ev, i.dataset));
            });

    }
});

function _browserOnClick(ev, data) {
    console.log(new BaseEnricher("browser"));
    let browser, filters;

    // Gotta double parse this to get rid of escape characters from the HTML.
    try {
        if (data.filters) filters = JSON.parse(JSON.parse(data.filters));
    } catch (err) {
        return ui.notifications.error(`Error parsing filters: ${err}`);
    }

    switch (data.type) {
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
    if (browser) browser.renderWithFilters(filters);
    else return ui.notifications.error("Invalid type.");
}

