import { SFRPG } from "../../config.js"
import { ActorSheetSFRPG } from "./base.js"

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
        return 'systems/sfrpg/templates/actors/mech-sheet-full.html';
    }

    getData() {
        const data = super.getData();

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