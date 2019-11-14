class ActorSheetStarfinderCharacter extends ActorSheetStarfinder {
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
        const path = "public/systems/starfinder/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "actor-sheet.html";
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
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;
    }
}

Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, {
    types: ["character"],
    makeDefault: true
});
