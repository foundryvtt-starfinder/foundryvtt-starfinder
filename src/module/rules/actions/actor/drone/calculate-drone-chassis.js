import { SFRPG } from "../../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneChassis", (fact, context) => {
        const data = fact.data;

        // We only care about the first chassis
        let activeChassis = null;
        for (const chassis of fact.chassis) {
            activeChassis = chassis;
            break;
        }

        if (activeChassis) {
            const chassisData = activeChassis.data.data;

            const movementType = chassisData.speed.movementType || "land";
            
            data.traits.size = SFRPG.actorSizes[chassisData.size];
            if (movementType !== "special") {
                data.attributes.speed[movementType].base = chassisData.speed.value;
            }
            data.attributes.speed.mainMovement = movementType;
            data.attributes.speed.special = chassisData.speed.special;

            let droneLevel = chassisData.levels;
            droneLevel = Math.max(1, Math.min(droneLevel, 20));

            data.details.level.value = droneLevel;
            data.attributes.hp.max = SFRPG.droneHitpointsPerLevel[droneLevel - 1];
            data.attributes.rp.max = SFRPG.droneResolveMethod(droneLevel); // Upgraded Power Core (Ex)
            data.attributes.baseAttackBonus = {
                value: SFRPG.droneBABBonusPerLevel[droneLevel - 1],
                rolledMods: [],
                tooltip: [game.i18n.format("SFRPG.BABTooltip", {
                    class: activeChassis.name,
                    bonus: SFRPG.droneBABBonusPerLevel[droneLevel - 1].signedString()
                })]
            };

            let abilityIncreaseStats = [chassisData.abilityIncreaseStats.first, chassisData.abilityIncreaseStats.second];
            let abilityIncreases = SFRPG.droneAbilityScoreIncreaseLevels.filter(x => x <= droneLevel).length;

            data.abilities.str.base = chassisData.abilityScores.str + (abilityIncreaseStats.includes("str") ? abilityIncreases : 0);

            data.abilities.dex.base = chassisData.abilityScores.dex + (abilityIncreaseStats.includes("dex") ? abilityIncreases : 0);

            data.abilities.con.value = chassisData.abilityScores.con;
            data.abilities.con.mod = 0;

            data.abilities.int.base = chassisData.abilityScores.int + (abilityIncreaseStats.includes("int") ? abilityIncreases : 0);

            data.abilities.wis.base = chassisData.abilityScores.wis + (abilityIncreaseStats.includes("wis") ? abilityIncreases : 0);
            
            data.abilities.cha.base = chassisData.abilityScores.cha + (abilityIncreaseStats.includes("cha") ? abilityIncreases : 0);
        } else {
            data.abilities.str.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.dex.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.con.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.int.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.wis.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.cha.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));

            data.attributes.baseAttackBonus = {
                value: 0,
                rolledMods: [],
                tooltip: []
            };
        }

        // Clear out skills, this and future closures will enable them again
        let skillkeys = Object.keys(SFRPG.skills);
        for (let skill of skillkeys) {
            data.skills[skill].enabled = false;
            data.skills[skill].value = 0;
            data.skills[skill].ranks = 0;
            data.skills[skill].mod = 0;
            data.skills[skill].tooltip = [];
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}