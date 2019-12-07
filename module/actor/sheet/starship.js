import { ActorSheetStarfinder } from "../sheet/base.js";

/**
 * An Actor sheet for a starship in the Starfinder system.
 * @type {ActorSheetStarfinder}
 */
export class ActorSheetStarfinderStarship extends ActorSheetStarfinder {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["starfinder", "sheet", "actor", "starship"],
            witdh: 600,
            height: 800
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/starfinder/templates/actors/limited-starship-sheet.html";
        return "systems/starfinder/templates/actors/starship-sheet.html";
    }

    getData() {
        const data = super.getData();

        this._prepareStarshipSystems(data.actor.data.details.systems);

        return data;
    }

    /**
     * Prepare the details for this starship.
     * @param {Object} detials The details about this ship
     */
    _prepareStarshipSystems(details) {
        

        const systemsMap = {
            "bays": CONFIG.STARFINDER.expansionBaySystems,
            "security": CONFIG.STARFINDER.securitySystems
        };

        for (let [t, choices] of Object.entries(systemsMap)) {
            const detail = details[t];
            if (!detail) continue;
            let values = [];
            if (detail.value) {
                values = detail.value instanceof Array ? detail.value : [detail.value];
            }
            detail.selected = values.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            if (detail.custom) {
                detail.custom.split(';').forEach((c, i) => detail.selected[`custom${i + 1}`] = c.trim());
            }
            detail.cssClass = !isObjectEmpty(detail.selected) ? "" : "inactive";
        }
    }
}