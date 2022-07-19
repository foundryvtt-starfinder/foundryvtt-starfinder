export default function (engine) {
    engine.closures.add("calculateStarshipCrew", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        const crewData = mergeObject(data.crew, {
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

        if (!crewData.npcData) {
            crewData.npcData = {};
        }

        /** Ensure NPC data is properly populated. */
        crewData.npcData = mergeObject(crewData.npcData, {
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

        for (const [key, crewRoleData] of Object.entries(crewData)) {
            if (key === "npcData" || key === "useNPCCrew") {
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
                console.log(`Found ${deadActors.length} non-existent actors for starship '${fact.actor?.name ?? fact.actorId}', crew type: ${key}`);
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