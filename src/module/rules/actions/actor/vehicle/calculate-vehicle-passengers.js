export default function (engine) {
    engine.closures.add("calculateVehiclePassengers", (fact, context) => {
        const data = fact.data;

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