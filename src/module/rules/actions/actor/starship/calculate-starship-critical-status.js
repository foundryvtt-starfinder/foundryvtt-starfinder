
export default function(engine) {
    engine.closures.add( "calculateStarshipCriticalStatus", (fact) => {
        const data = fact.data;

        const critMods = {
            nominal: 0,
            glitching: -2,
            malfunctioning: -4,
            wrecked: -4
        };

        const critModsHeldTogether = {
            nominal: 0,
            glitching: 0,
            malfunctioning: 0,
            wrecked: -2
        };

        const critModsPatched = {
            nominal: 0,
            glitching: 0,
            malfunctioning: -2,
            wrecked: -4
        };

        const critModsOther = {
            nominal: 0,
            glitching: 0,
            malfunctioning: -2,
            wrecked: -4
        };

        const critModsOtherHeldTogether = {
            nominal: 0,
            glitching: 0,
            malfunctioning: 0,
            wrecked: 0
        };

        const critModsOtherPatched = {
            nominal: 0,
            glitching: 0,
            malfunctioning: 0,
            wrecked: -2
        };

        /** Ensure Critical Status data is properly populated. */
        if (!data.attributes.systems) {
            data.attributes.systems = {};
        }

        data.attributes.systems = foundry.utils.mergeObject(data.attributes.systems, {
            lifeSupport: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    captain: true
                },
                mod: 0
            },
            sensors: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    scienceOfficer: true
                },
                mod: 0
            },
            weaponsArrayForward: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayPort: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayStarboard: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            weaponsArrayAft: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    gunner: true
                },
                mod: 0
            },
            engines: {
                value: "nominal",
                patch: "unpatched",
                affectedRoles: {
                    pilot: true
                },
                mod: 0
            },
            powerCore: {
                value: "nominal",
                patch: "unpatched",
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
            if (["patched", "robust"].includes(systemData.patch)) {
                systemData.mod = critModsPatched[systemData.value];
                systemData.modOther = (key === "powerCore") ? critModsOtherPatched[systemData.value] : 0;
            } else if (systemData.patch === "heldTogether") {
                systemData.mod = critModsHeldTogether[systemData.value];
                systemData.modOther = (key === "powerCore") ? critModsOtherHeldTogether[systemData.value] : 0;
            } else {
                systemData.mod = critMods[systemData.value];
                systemData.modOther = (key === "powerCore") ? critModsOther[systemData.value] : 0;
            }
        }

        data.attributes.systems.weaponsArrayTurret = {
            mod: Math.min(
                data.attributes.systems.weaponsArrayForward.mod,
                data.attributes.systems.weaponsArrayPort.mod,
                data.attributes.systems.weaponsArrayStarboard.mod,
                data.attributes.systems.weaponsArrayAft.mod
            )
        };

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}
