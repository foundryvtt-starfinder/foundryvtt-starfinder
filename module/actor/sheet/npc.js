class ActorSheetStarfinderNPC extends ActorSheetStarfinder {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['starfinder', 'actor', 'npc-sheet']),
            width: 650,
            height: 680,
            showUnpreparedSpells: true
        });

        return options;
    }

    get template() {
        const path = "public/systems/starfinder/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "npc-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        let cr = sheetData.data.details.cr;
        let crs = {0: "0", 0.125: "1/8", 0.25: "1/4", 0.5: "1/2"};
        cr["str"] = cr.value >= 1 ? String(cr.value) : crs[cr.value] || 0;

        return sheetData;
    }
    
    _prepareItems(sheetData) {
        const actorData = sheetData.actor;

        const features = {
            weapons: { label: "Weapons", items: [], type: "weapon" },
            actions: { label: "Actions", items: [], type: "feat" },
            passive: { label: "Features", items: [], type: "feat" },
            equipment: { label: "Equipment", items: [], type: "equipment" }
        };

        const spellbook = {};

        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === "spell") this._prepareSpell(actorData, spellbook, i);

            else if (i.type === "weapon") features.weapons.items.push(i);
            else if (i.type === "feat") {
                if (i.data.featType.value === "passive") features.passive.items.push(i);
                else features.actions.items.push(i);
            }
            else if (["equipment", "consumable", "goods"].includes(i.type)) features.equipment.items.push(i);
        }

        actorData.features = features;
        actorData.spellbook = spellbook;
    }

    _updateObject(event, formData) {
        if (this.actor.data.type === "npc") {
            let cr = formData["data.details.cr.value"];
            if (cr) {
                let crs = {"1/8": 0.125, "1/4": 0.25, "1/2": 0.5};
                formData['data.details.cr.value'] = crs[cr] || parseInt(cr);
            }
        }

        super._updateObject(event, formData);
    }
}

Actors.registerSheet("starfinder", ActorSheetStarfinderNPC, {
    types: ["npc"],
    makeDefault: true
});
