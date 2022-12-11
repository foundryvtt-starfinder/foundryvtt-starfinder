export default function (engine) {
    engine.closures.add("calculateVehiclePassengers", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        data.crew = mergeObject(data.crew ?? {}, {
            complement: {
                limit: 0,
                actorIds: []
            },
            passenger: {
                limit: 0,
                actorIds: []
            },
            pilot: {
                limit: 1,
                actorIds: []
            },
            useNPCCrew: true
        }, {overwrite: false});

        const crewActors = {
            complement: {
                actors: []
            },
            passenger: {
                actors: []
            },
            pilot: {
                actors: []
            }
        };

        for (const [key, crew] of Object.entries(data.crew)) {
            if (key === "useNPCCrew") {
                continue;
            }

            if (!crew.actorIds) {
                crew.actorIds = []
            }

            const deadActors = [];
            for (const crewActorId of crew.actorIds) {
                const foundCrew = game?.actors?.get(crewActorId);
                if (game?.actors && !foundCrew) {
                    deadActors.push(crewActorId);
                    continue;
                }

                crewActors[key].actors.push(foundCrew);
            }

            if (deadActors.length > 0) {
                console.log(`Found ${deadActors.length} non-existent actors for vehicle '${fact.actor?.name || fact.actorId}', crew type: ${key}`);
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