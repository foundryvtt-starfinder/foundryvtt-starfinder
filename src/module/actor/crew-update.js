Hooks.on('afterClosureProcessed', (closure, fact) => {
    if (!game?.actors) {
        return;
    }

    if (fact.type === "character" || fact.type === "npc" || fact.type === "npc2" || fact.type === "drone") {
        /** Iterate through crewed actors to see if they need to update after a character or NPC updated */
        for (const actor of game.actors.contents) {
            if (actor.type === "starship" || actor.type === "vehicle") {
                const role = actor.getCrewRoleForActor(fact.actorId);
                if (role) {
                    actor.prepareData();
                    try {
                        if (actor.sheet?.rendered) {
                            actor.sheet?.clearTooltips();
                            actor.sheet?.render(false);
                        }
                    } catch {}
                }
            }
        }
    }
});

Hooks.on('deleteActor', async (entity, options, userId) => {
    if (entity.type === "character" || entity.type === "npc" || entity.type === "npc2" || entity.type === "drone") {
        /** Iterate through crewed actors to see if they need to remove a deleted character or NPC from their crew */
        for (const actor of game.actors.contents) {
            if (actor.type === "starship" || actor.type === "vehicle") {
                const actorUpdated = await actor.removeFromCrew(entity.id);
                if (actorUpdated) {
                    actor.prepareData();
                    try {
                        if (actor.sheet?.rendered) {
                            actor.sheet?.clearTooltips();
                            actor.sheet?.render(false);
                        }
                    } catch {}
                }
            }
        }
    }
});