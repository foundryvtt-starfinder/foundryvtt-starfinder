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
                },
                npcData: {}
            };
        }

        if (!data.crew.npcData) {
            data.crew.npcData = {};
        }

        /** Ensure NPC data is properly populated. */
        data.crew.npcData = mergeObject(data.crew.npcData, {
            captain: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            engineer: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            chiefMate: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            gunner: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            magicOfficer: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            pilot: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },
            scienceOfficer: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            }
        }, {overwrite: false});

        for (let [key, crew] of Object.entries(data.crew)) {
            if (key === "npcData") {
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