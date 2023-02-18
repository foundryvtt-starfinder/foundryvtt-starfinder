import { getAlienArchiveBrowser } from "../../packs/alien-archive-browser.js";
import { getEquipmentBrowser } from "../../packs/equipment-browser.js";
import { getSpellBrowser } from "../../packs/spell-browser.js";
import { getStarshipBrowser } from "../../packs/starship-browser.js";
import BaseEnricher from "./base.js";

export default class BrowserEnricher extends BaseEnricher {
    // E.g @Browser[type:equipment|filters:{"equipmentTypes":"weapon","weaponTypes":"smallA","weaponCategories":"cryo","search":"Big Gun"}]
    // @Browser[type:spell|filters:{"classes":["mystic","technomancer"],"levels":[0,1,2],"schools":"conjuration"}]{Some cool spells}
    // @Browser[type:starship|filters:{"starshipComponentTypes":["starshipWeapon"], "starshipWeaponTypes":"ecm","starshipWeaponClass":"heavy"}]

    constructor() {
        super();
    }

    /** @inheritdoc */
    get enricherType() {
        return "Browser";
    }

    /** @inheritdoc */
    get validTypes() {
        return ["spell", "equipment", "starship", "alien"];
    }

    /** @inheritdoc */
    get icons() {
        return {
            equipment: "fa-gun",
            spell: "fa-sparkles",
            starship: "fa-rocket",
            alien: "fa-alien"
        };
    }

    /**
     * @extends BaseEnricher
     * @returns {HTMLAnchorElement} */
    createElement() {
        const a = super.createElement();

        if (this.args.filters) a.dataset.filters = JSON.stringify(this.args.filters);

        a.innerHTML = `<i class="fas ${this.icons[this.args.type]}"></i>${this.name}`;

        return a;

    }

    static hasListener = true;

    static listener(ev, data) {
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
            default:
                ui.notifications.error("Invalid type.");
        }
        if (browser) browser.renderWithFilters(filters);
    }

}
