export default function (engine) {
    engine.closures.add("calculateStarshipCrew", (fact, context) => {
        const data = fact.data;

        if (!data.crew) {
            data.crew = {
                captain: {
                    limit: 1,
                    actorIds: []
                },
                chiefMate: {
                    limit: -1,
                    actorIds: []
                },
                engineer: {
                    limit: -1,
                    actorIds: []
                },
                gunner: {
                    limit: 0,
                    actorIds: []
                },
                magicOfficer: {
                    limit: -1,
                    actorIds: []
                },
                passenger: {
                    limit: -1,
                    actorIds: []
                },
                pilot: {
                    limit: 1,
                    actorIds: []
                },
                scienceOfficer: {
                    limit: -1,
                    actorIds: []
                }
            };
        }

        for (let [key, crew] of Object.entries(data.crew)) {
            if (!crew.actorIds) {
                crew.actorIds = []
            }

            crew.actors = [];
            for (let crewActorId of crew.actorIds) {
                crew.actors.push(game?.actors?.get(crewActorId));
            }
        }

        return fact;
    });
}