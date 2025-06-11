export default function(engine) {
    engine.closures.add("calculateStarshipCrew", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        data.crew = foundry.utils.mergeObject(data.crew, {
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
        }, {overwrite: false});

        if (!data.crew.npcData) {
            data.crew.npcData = {};
        }

        /** Ensure NPC data is properly populated. */
        data.crew.npcData = foundry.utils.mergeObject(data.crew.npcData, {
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

        const crewActors = {
            captain: {
                actors: []
            },
            chiefMate: {
                actors: []
            },
            engineer: {
                actors: []
            },
            gunner: {
                actors: []
            },
            magicOfficer: {
                actors: []
            },
            passenger: {
                actors: []
            },
            pilot: {
                actors: []
            },
            scienceOfficer: {
                actors: []
            }
        };

        for (const [key, crew] of Object.entries(data.crew)) {
            if (key === "npcData" || key === "useNPCCrew") {
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

                crewActors[key].actors.push(foundCrew);
            }

            if (deadActors.length > 0) {
                console.log(`Found ${deadActors.length} non-existent actors for starship '${fact.actor?.name || fact.actorId}', crew type: ${key}`);
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
