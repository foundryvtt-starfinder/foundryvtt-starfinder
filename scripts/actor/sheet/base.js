class ActorSheetStarfinder extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }

    getData() {
        const sheetData = super.getData();

        return sheetData;
    }
}