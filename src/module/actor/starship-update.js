Hooks.on('afterClosureProcessed', (closure, fact) => {
    if (!game?.actors) {
        return;
    }

    if (fact.type === "character" || fact.type === "npc" || fact.type === "drone") {
        /** Iterate through starships to see if they need to update after a character or NPC updated */
        for (let actor of game.actors.contents) {
            const actorData = actor.data;
            if (actorData.type === "starship") {
                const role = actor.getCrewRoleForActor(fact.actorId);
                if (role) {
                    actor.prepareData();
                    try {
                        if (actor.sheet) {
                            actor.sheet.render(false);
                        }
                    } catch {}
                }
            }
        }
    }
});