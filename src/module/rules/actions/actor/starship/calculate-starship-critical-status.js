import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add( "calculateStarshipCriticalStatus", (fact, context) => {
        const data = fact.data;

        const critMods = {
            nominal: 0,
            glitching: -2,
            malfunctioning: -4,
            wrecked: -4
        };

        const critModsOther = {
            nominal: 0,
            glitching: 0,
            malfunctioning: -2,
            wrecked: -4
        };

        /** Ensure Critical Status data is properly populated. */
        if (!data.attributes.systems) {
            data.attributes.systems = {};
        }

        data.attributes.systems = mergeObject(data.attributes.systems, {
            lifeSupport: {
                value: "nominal",
                affectedRoles: {
                    captain: true
                },
                mod: 0
            },
            sensors: {
                value: "nominal",
                affectedRoles: {
                    scienceOfficer: true
                },
                mod: 0
            },
            weaponsArrayForward: {
                value: "nominal",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayPort: {
                value: "nominal",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayStarboard: {
                value: "nominal",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayAft: {
                value: "nominal",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            engines: {
                value: "nominal",
                affectedRoles: {
                    pilot: true
                },
                mod: 0
            },
            powerCore: {
                value: "nominal",
                affectedRoles: {
                    captain: true,
                    pilot: true,
                    gunner: true,
                    engineer: true,
                    scienceOfficer: true,
                    magicOfficer: true,
                    chiefMate: true,
                    openCrew: true,
                    minorCrew: true
                },
                mod: 0
            }
        }, {overwrite: false});

        for (const [key, systemData] of Object.entries(data.attributes.systems)) {
            const modifier = critMods[systemData.value];
            systemData.mod = modifier;
            systemData.modOther = (key === "powerCore") ? critModsOther[systemData.value] : 0;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}
