export default function (engine) {
    engine.closures.add("calculateVehiclePassengers", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        const crewData = mergeObject(data.crew ?? {}, {
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

        for (const [key, crewRoleData] of Object.entries(crewData)) {
            if (key === "useNPCCrew") {
                continue;
            }

            if (!crewRoleData.actorIds) {
                crewRoleData.actorIds = []
            }

            const deadActors = [];
            for (const crewRoleMemberActorId of crewRoleData.actorIds) {
                const foundCrewMember = game?.actors?.get(crewRoleMemberActorId);
                if (game?.actors && !foundCrewMember) {
                    deadActors.push(crewRoleMemberActorId);
                    continue;
                }

                crewActors[key].actors.push(foundCrewMember);
            }

            if (deadActors.length > 0) {
                console.log(`Found ${deadActors.length} non-existent actors for vehicle '${fact.actor?.name ?? fact.actorId}', crew type: ${key}`);
                for (const deadActorId of deadActors) {
                    const deadActorIndex = crewRoleData.actorIds.indexOf(deadActorId);
                    if (deadActorIndex > -1) {
                        crewRoleData.actorIds.splice(deadActorIndex, 1);
                    }
                }
            }
        }

        actor.computed.crew = crewActors;

        return fact;
    });
}