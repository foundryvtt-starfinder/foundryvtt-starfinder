import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateStarshipCriticalStatus", (fact, context) => {
        const data = fact.data;

        const critMods = {
            nominal: 0,
            glitching: -2,
            malfunctioning: -4,
            wrecked: -4
        };

        if (!data.attributes.systems) {
            data.attributes.systems = {
                lifeSupport: {
                    value: "nominal",
                    mod: 0
                },
                sensors: {
                    value: "nominal",
                    mod: 0
                },
                weaponsArray: {
                    value: "nominal",
                    mod: 0
                },
                engines: {
                    value: "nominal",
                    mod: 0
                },
                powerCore: {
                    value: "nominal",
                    mod: 0
                }
            };
        }

        for (const [key, systemData] of Object.entries(data.attributes.systems)) {
            const modifier = critMods[systemData.value];
            systemData.mod = modifier;
        }

        if (data.attributes.systems.powerCore.value === "malfunctioning") {
            data.attributes.systems.lifeSupport.mod -= 2;
            data.attributes.systems.sensors.mod -= 2;
            data.attributes.systems.weaponsArray.mod -= 2;
            data.attributes.systems.engines.mod -= 2;
        } else if (data.attributes.systems.powerCore.value === "wrecked") {
            data.attributes.systems.lifeSupport.mod -= 4;
            data.attributes.systems.sensors.mod -= 4;
            data.attributes.systems.weaponsArray.mod -= 4;
            data.attributes.systems.engines.mod -= 4;
        }
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}