import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateStarshipFrame", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;
        const frames = fact.frames;
        
        const maneuverabilityMap = {
            "clumsy" : { pilotingBonus: -2, turn: 4 },
            "poor"   : { pilotingBonus: -1, turn: 3 },
            "average": { pilotingBonus: 0, turn: 2 },
            "good"   : { pilotingBonus: 1, turn: 1 },
            "perfect": { pilotingBonus: 2, turn: 0 }
        };

        const sizeModifierMap = {
            "n/a": 0,
            "tiny": 1,
            "small": 2,
            "medium": 3,
            "large": 4,
            "huge": 5,
            "gargantuan": 6,
            "colossal": 7,
            "superColossal": 8
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

        const tierToBuildpoints = {
            "1/4": 25,
            "0.25": 25,
            "1/3": 30,
            "1/2": 40,
            "0.5": 40,
            "1": 55,
            "2": 75,
            "3": 95,
            "4": 115,
            "5": 135,
            "6": 155,
            "7": 180,
            "8": 205,
            "9": 230,
            "10": 270,
            "11": 310,
            "12": 350,
            "13": 400,
            "14": 450,
            "15": 500,
            "16": 600,
            "17": 700,
            "18": 800,
            "19": 900,
            "20": 1000
        };

        data.attributes.bp = {
            value: 0,
            max: tierToBuildpoints[data.details.tier],
            tooltip: []
        };

        data.attributes.power = {
            value: 0,
            max: 0,
            tooltip: []
        };

        data.attributes.speed = {
            value: 0,
            tooltip: []
        };

        data.attributes.turn = {
            value: 0,
            tooltip: []
        };

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
            const frame = frames[0].data;

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

            data.attributes.turn.value = maneuverabilityMap[data.attributes.maneuverability].turn;
            data.attributes.turn.tooltip.push(`${data.details.frame}: ${data.attributes.turn.value.signedString()}`);
        }

        /** Ensure pilotingBonus exists. */
        data.attributes.pilotingBonus = {
            value: maneuverabilityMap[data.attributes.maneuverability].pilotingBonus,
            tooltip: [game.i18n.format("SFRPG.StarshipSheet.Header.Movement.ManeuverabilityTooltip", {maneuverability: data.attributes.maneuverability})]
        };

        /** Ensure quadrants exist */
        if (!data.quadrants) {
            data.quadrants = {
                forward: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                port: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                starboard: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                aft: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                }
            };
        }

        /** Compute BP */
        const sizeModifier = sizeModifierMap[data.details.size] || 0;
        const starshipComponents = fact.items.filter(x => x.type.startsWith("starship"));
        for (const component of starshipComponents) {
            const bpCost = component.data.costMultipliedBySize ? sizeModifier * component.data.cost : component.data.cost;
            data.attributes.bp.value += bpCost;
            data.attributes.bp.tooltip.push(`${component.name}: ${bpCost}`);
        }
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}