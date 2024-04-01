import { SFRPG } from "../../config.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGMech extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        foundry.utils.mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "mech"],
            width: 715
        });

        return options;
    }

    get template() {
        return 'systems/sfrpg/templates/actors/mech-sheet-full.hbs';
    }

    async getData() {
        const data = await super.getData();

        const tier = parseFloat(data.system.details.tier || 0);
        data.labels["tier"] = tier >= 1 ? String(tier) : "0";

        return data;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HMTL object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);
    }

    _prepareItems(data) { }
}
