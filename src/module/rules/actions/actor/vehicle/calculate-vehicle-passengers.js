export default function (engine) {
    engine.closures.add("calculateVehiclePassengers", (fact, context) => {
        const data = fact.data;

        // Ensure that all vehicles have a crew
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

        // Ensures that all vehicles have hangar bays
        data.hangarBay = mergeObject(data.hangarBay ?? {}, {
                limit: 0,
                actorIds: []
        }, {overwrite: false});

        //
        for (let [key, crew] of Object.entries(data.crew)) {
            if (key === "useNPCCrew") {
                continue;
            }

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