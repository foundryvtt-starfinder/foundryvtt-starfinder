
import { SFRPGEffectType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function(engine) {
    const processModifier = (bonus, data) => {
        let computedBonus = 0;
        try {
            const roll = Roll.create(bonus.modifier.toString(), data).evaluateSync({strict: false});
            computedBonus = roll.total;
        } catch (e) {
            console.error(e);
        }
        return computedBonus;
    };

    const applyStackedModifiers = (stackedModifiers, data) => {
        return Object.entries(stackedModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += processModifier(bonus, data);
                }
            } else {
                sum += processModifier(mod[1], data);
            }

            return sum;
        }, 0);
    };

    const applyHullPointModifiers = (fact, context, data) => {
        const hullPointModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_HULL_POINTS
        );

        if (hullPointModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                hullPointModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            data.attributes.hp.max += modifierBonus;
        }
    };

    const applyHullPointIncrementModifiers = (fact, context, data) => {
        const incrementModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_HULL_POINTS_INCREMENT
        );

        if (incrementModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                incrementModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            data.attributes.hp.increment += modifierBonus;
        }
    };

    const applyTurnDistanceModifiers = (fact, context, data) => {
        const turnModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_TURN_DISTANCE);

        if (turnModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                turnModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            data.attributes.turn.value = Math.max(0, data.attributes.turn.value + modifierBonus);

            if (modifierBonus !== 0) {
                const label = game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.MiscModifier") : "Misc Modifier";
                data.attributes.turn.tooltip.push(`${label}: ${modifierBonus.signedString()}`);
            }
        }
    };

    engine.closures.add( "calculateStarshipFrame", (fact, context) => {
        const data = fact.data;
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

        data.currency = foundry.utils.mergeObject(data.currency || {}, {
            upb: 0
        }, {overwrite: false});

        /** If galactic trade is enabled, allow starship sheets to track unspent BPs. */
        const isGalacticTradeEnabled = game.settings.get('sfrpg', 'enableGalacticTrade');
        if (isGalacticTradeEnabled) {
            data.currency = foundry.utils.mergeObject(data.currency, {
                bp: 0
            }, {overwrite: false});
        } else if (data.currency?.bp !== null) {
            delete data.currency.bp;
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

        /** If galactic trade is enabled, max spent BP per tier is 5% higher. */
        if (isGalacticTradeEnabled) {
            data.attributes.bp.max = Math.floor(data.attributes.bp.max * 1.05);
        }

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
            data.attributes.complement = {
                min: 0,
                max: 0
            };

            data.attributes.hp.increment = 0;
            data.attributes.hp.max = 0;
            data.crew.gunner.limit = 0;
        } else {
            const frame = frames[0];

            data.frame = frame;
            const maneuverability = frame.system.maneuverability;

            data.details.frame = frame.name;
            data.details.size = frame.system.size;
            data.attributes.maneuverability = maneuverability;
            data.attributes.damageThreshold = {
                value: frame.system.damageThreshold.base,
                tooltip: []
            };
            data.attributes.expansionBays = {
                value: frame.system.expansionBays,
                tooltip: []
            };
            data.attributes.complement = {
                min: frame.system.crew.minimum,
                max: frame.system.crew.maximum
            };

            data.attributes.hp.increment = frame.system.hitpoints.increment;
            applyHullPointIncrementModifiers(fact, context, data);
            data.attributes.hp.max = frame.system.hitpoints.base + Math.floor(data.details.tier / 4) * data.attributes.hp.increment;

            applyHullPointModifiers(fact, context, data);
            data.crew.gunner.limit = frame.system.weaponMounts.forward.lightSlots + frame.system.weaponMounts.forward.heavySlots + frame.system.weaponMounts.forward.capitalSlots
                + frame.system.weaponMounts.aft.lightSlots + frame.system.weaponMounts.aft.heavySlots + frame.system.weaponMounts.aft.capitalSlots
                + frame.system.weaponMounts.port.lightSlots + frame.system.weaponMounts.port.heavySlots + frame.system.weaponMounts.port.capitalSlots
                + frame.system.weaponMounts.starboard.lightSlots + frame.system.weaponMounts.starboard.heavySlots + frame.system.weaponMounts.starboard.capitalSlots
                + frame.system.weaponMounts.turret.lightSlots + frame.system.weaponMounts.turret.heavySlots + frame.system.weaponMounts.turret.capitalSlots;

            /** Get modifying armour. */
            const ablativeArmorItems = fact.items.filter(x => x.type === "starshipAblativeArmor");
            const armorItems = fact.items.filter(x => x.type === "starshipArmor");
            const armorTurnPenalty = armorItems[0]?.system?.turnDistancePenalty ?? 0;
            const ablativeArmorTurnPenalty = ablativeArmorItems[0]?.system?.turnDistancePenalty ?? 0;
            const turnManeuverability = maneuverabilityMap[maneuverability].turn;
            data.attributes.turn.tooltip.push(`${maneuverability} maneuverability: ${turnManeuverability.signedString()}`);

            if (armorTurnPenalty !== 0) {
                data.attributes.turn.tooltip.push(`${armorItems[0].name}: ${armorTurnPenalty.signedString()}`);
            }

            if (ablativeArmorTurnPenalty !== 0) {
                data.attributes.turn.tooltip.push(`${ablativeArmorItems[0].name}: ${ablativeArmorTurnPenalty.signedString()}`);
            }

            data.attributes.turn.value = Math.max(0, turnManeuverability + armorTurnPenalty + ablativeArmorTurnPenalty);
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
            const componentData = component.system;
            const bpCost = componentData.costMultipliedBySize ? sizeModifier * componentData.cost : componentData.cost;
            data.attributes.bp.value += bpCost;
            data.attributes.bp.tooltip.push(`${component.name}: ${bpCost}`);
        }

        // Apply turn distance modifiers
        applyTurnDistanceModifiers(fact, context, data);

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}
