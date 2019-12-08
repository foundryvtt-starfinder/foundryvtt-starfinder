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
            height: 800,
            title: "This is only a test"
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

    /**
     * Organize and classify items for starship sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        console.log("Starfinder | In ActorSheetStarfinderStarshp._prepareItems", data);

        const arcs = {
            foward: { label: "Foward", items: [], dataset: { type: "starshipWeapon" }},
            starboard: { label: "Starboard", items: [], dataset: { type: "starshipWeapon" }},
            aft: { label: "Aft", items: [], dataset: { type: "starshipWeapon" }},
            port: { label: "Port", items: [], dataset: { type: "starshipWeapon" }},
            turret: { label: "Turret", items: [], dataset: { type: "starshipWeapon" }},
            unmounted: { label: "Not Mounted", items: [], dataset: { type: "starshipWeapon" }}
        };

        let [forward, starboard, aft, port, turret, unmounted] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.data.mount.arc === "forward") arr[0].push(item);
            else if (item.data.mount.arc === "starboard") arr[1].push(item);
            else if (item.data.mount.arc === "aft") arr[2].push(item);
            else if (item.data.mount.arc === "port") arr[3].push(item);
            else if (item.data.mount.arc === "turret") arr[4].push(item);
            else arr[5].push(item);

            return arr;
        }, [[], [], [], [], [], []]);

        arcs.foward.items = forward;
        arcs.starboard.items = starboard;
        arcs.aft.items = aft;
        arcs.port.items = port;
        arcs.turret.items = turret;
        arcs.unmounted.items = unmounted;

        data.arcs = Object.values(arcs);
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;
        

    }
}