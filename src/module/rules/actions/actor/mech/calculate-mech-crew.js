export default function(engine) {
    engine.closures.add("calculateMechCrew", (fact) => {
        const data = fact.data;
        const actor = fact.actor;
        const items = fact.items;

        // Determine operator limit from frame
        const frame = items.find(i => i.type === "mechFrame");
        const operatorMax = frame?.system.operatorsMax || 2;

        data.crew = foundry.utils.mergeObject(data.crew ?? {}, {
            operator: {
                limit: operatorMax,
                actorIds: []
            },
            useNPCCrew: false
        }, {overwrite: false});

        // Update operator limit from frame (in case frame changed)
        data.crew.operator.limit = operatorMax;

        const crewActors = {
            operator: {
                actors: []
            }
        };

        for (const [key, crew] of Object.entries(data.crew)) {
            if (key === "useNPCCrew") {
                continue;
            }

            if (!crew.actorIds) {
                crew.actorIds = [];
            }

            const deadActors = [];
            for (const crewActorId of crew.actorIds) {
                const foundCrew = game?.actors?.get(crewActorId);
                if (game?.actors && !foundCrew) {
                    deadActors.push(crewActorId);
                    continue;
                }

                if (crewActors[key]) {
                    crewActors[key].actors.push(foundCrew);
                }
            }

            if (deadActors.length > 0) {
                console.log(`Found ${deadActors.length} non-existent actors for mech '${fact.actor?.name || fact.actorId}', crew type: ${key}`);
                for (const deadActorId of deadActors) {
                    const deadActorIndex = crew.actorIds.indexOf(deadActorId);
                    if (deadActorIndex > -1) {
                        crew.actorIds.splice(deadActorIndex, 1);
                    }
                }
            }
        }

        actor.crew = crewActors;

        return fact;
    });
}
