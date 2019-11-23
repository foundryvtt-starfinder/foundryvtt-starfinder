import { ActorSheetStarfinder } from "./base.js"

export class ActorSheetStarfinderCharacter extends ActorSheetStarfinder {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['starfinder', 'actor', 'character-sheet']),
            width: 650,
            height: 720
        });

        return options;
    }

    get template() {
        const path = "systems/starfinder/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        let res = sheetData.data.resources;
        if (res.primary && res.primary.value === 0) delete res.primary.value;
        if (res.primary && res.primary.max === 0) delete res.primary.max;
        if (res.secondary && res.secondary.value === 0) delete res.secondary.value;
        if (res.secondary && res.secondary.max === 0) delete res.secondary.max;

        sheetData["disableExperience"] = game.settings.get("starfinder", "disableExperienceTracking");

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        
        const actorData = data.actor;

        const inventory = {
            weapon: { label: "Weapons", items: [], dataset: { type: "weapon" } },
            equipment: { label: "Equipment", items: [], dataset: { type: "equipment" } },
            consumable: { label: "Consumables", items: [], dataset: { type: "consumable" } },
            goods: { label: "Goods", items: [], dataset: { type: "goods" } }
        };

        const spellbook = [];
        const feats = [];
        const classes = [];

        let totalWeight = 0;
        for (let i of data.items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (Object.keys(inventory).includes(i.type)) {
                i.data.quantity.value = i.data.quantity.value || 0;
                i.data.weight.value = i.data.weight.value || 0;
                i.totalWeight = Math.round(i.data.quantity.value * i.data.weight.value * 10) / 10;
                i.hasCharges = i.type === "consumable" && i.data.charges.max > 0;
                inventory[i.type].items.push(i);
                totalWeight += i.totalWeight;
            }
        }

        data.inventory = Object.values(inventory);
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
