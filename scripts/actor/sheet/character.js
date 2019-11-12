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

        return sheetData;
    }
}

Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, {
    types: ["character"],
    makeDefault: true
});
