import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateStarshipFrame", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;
        const frames = fact.frames;
        
        const maneuverabilityMap = {
            "clumsy" : -2,
            "poor"   : -1,
            "average": 0,
            "good"   : 1,
            "perfect": 2
        };

        if (!data.crew) {
            data.crew = {
                captain: {
                    limit: 1,
                    actors: []
                },
                chiefMate: {
                    limit: -1,
                    actors: []
                },
                engineer: {
                    limit: -1,
                    actors: []
                },
                gunner: {
                    limit: 0,
                    actors: []
                },
                magicOfficer: {
                    limit: -1,
                    actors: []
                },
                passenger: {
                    limit: -1,
                    actors: []
                },
                pilot: {
                    limit: 1,
                    actors: []
                },
                scienceOfficer: {
                    limit: -1,
                    actors: []
                }
            };
        }

        if (!frames || frames.length === 0) {
            data.frame = {
                name: ""
            };

            data.details.frame = "";
            data.details.size = "n/a";
            data.attributes.maneuverability = "average";
            data.attributes.damageThreshold = {
                value: 0,
                tooltip: []
            };
            data.attributes.expansionBays = {
                value: 0,
                tooltip: []
            };
            data.attributes.complement.min = 0;
            data.attributes.complement.max = 0;

            data.attributes.hp.increment = 0;
            data.attributes.hp.max = 0;
            data.crew.gunner.limit = 0;
        } else {
            const frame = frames[0];
            //console.log([data, frame]);

            data.frame = frame;

            data.details.frame = frame.name;
            data.details.size = frame.data.size;
            data.attributes.maneuverability = frame.data.maneuverability;
            data.attributes.damageThreshold = {
                value: frame.data.damageThreshold.base,
                tooltip: []
            };
            data.attributes.expansionBays = {
                value: frame.data.expansionBays,
                tooltip: []
            };
            data.attributes.complement.min = frame.data.crew.minimum;
            data.attributes.complement.max = frame.data.crew.maximum;

            data.attributes.hp.increment = frame.data.hitpoints.increment;
            data.attributes.hp.max = frame.data.hitpoints.base + Math.floor(data.details.tier / 4) * frame.data.hitpoints.increment;
            data.crew.gunner.limit = frame.data.weaponMounts.forward.lightSlots + frame.data.weaponMounts.forward.heavySlots + frame.data.weaponMounts.forward.capitalSlots
                + frame.data.weaponMounts.aft.lightSlots + frame.data.weaponMounts.aft.heavySlots + frame.data.weaponMounts.aft.capitalSlots
                + frame.data.weaponMounts.port.lightSlots + frame.data.weaponMounts.port.heavySlots + frame.data.weaponMounts.port.capitalSlots
                + frame.data.weaponMounts.starboard.lightSlots + frame.data.weaponMounts.starboard.heavySlots + frame.data.weaponMounts.starboard.capitalSlots
                + frame.data.weaponMounts.turret.lightSlots + frame.data.weaponMounts.turret.heavySlots + frame.data.weaponMounts.turret.capitalSlots;
        }

        /** Ensure pilotingBonus exists. */
        if (!data.attributes.pilotingBonus) {
            data.attributes.pilotingBonus = {value: 0};
        }
        data.attributes.pilotingBonus.value = maneuverabilityMap[data.attributes.maneuverability];

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}