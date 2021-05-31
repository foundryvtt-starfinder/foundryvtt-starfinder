Hooks.on('afterClosureProcessed', (closure, fact) => {
    if (!game?.actors) {
        return;
    }

    if (fact.type === "character" || fact.type === "npc" || fact.type === "drone") {
        /** Iterate through crewed actors to see if they need to update after a character or NPC updated */
        for (const actor of game.actors.contents) {
            if (actor.data.type === "starship" || actor.data.type === "vehicle") {
                const role = actor.getCrewRoleForActor(fact.actorId);
                if (role) {
                    actor.prepareData();
                    try {
                        actor.sheet?.render(false);
                    } catch {}
                }
            }
        }
    }
});

Hooks.on('deleteActor', async (entity, options, userId) => {
    if (entity.data.type === "character" || entity.data.type === "npc" || entity.data.type === "drone") {
        /** Iterate through crewed actors to see if they need to remove a deleted character or NPC from their crew */
        for (const actor of game.actors.contents) {
            if (actor.data.type === "starship" || actor.data.type === "vehicle") {
                const actorUpdated = await actor.removeFromCrew(entity._id);
                if (actorUpdated) {
                    actor.prepareData();
                    try {
                        actor.sheet?.render(false);
                    } catch {}
                }
            }
        }
    }
});