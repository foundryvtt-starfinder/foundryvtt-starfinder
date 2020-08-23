import { SFRPG } from "../../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneChassis", (fact, context) => {
        const data = fact.data;

        // We only care about the first chassis
        let activeChassis = null;
        for (const chassis of fact.classes) {
            activeChassis = chassis;
            break;
        }

        if (activeChassis) {
            data.traits.size = SFRPG.actorSizes[activeChassis.data.size];
            data.attributes.speed.value = activeChassis.data.speed.value;
            data.attributes.speed.special = activeChassis.data.speed.special;

            let droneLevel = activeChassis.data.levels;
            droneLevel = Math.max(1, Math.min(droneLevel, 20));

            data.details.level.value = droneLevel;
            data.attributes.hp.max = SFRPG.droneHitpointsPerLevel[droneLevel - 1];
            data.attributes.rp.max = SFRPG.droneResolveMethod(droneLevel); // Upgraded Power Core (Ex)
            data.attributes.bab = SFRPG.droneBABBonusPerLevel[droneLevel - 1];
            
            let abilityIncreaseStats = [activeChassis.data.abilityIncreaseStats.first, activeChassis.data.abilityIncreaseStats.second];
            let abilityIncreases = SFRPG.droneAbilityScoreIncreaseLevels.filter(x => x <= droneLevel).length;

            data.abilities.str.base = activeChassis.data.abilityScores.str + (abilityIncreaseStats.includes("str") ? abilityIncreases : 0);

            data.abilities.dex.base = activeChassis.data.abilityScores.dex + (abilityIncreaseStats.includes("dex") ? abilityIncreases : 0);

            data.abilities.con.value = activeChassis.data.abilityScores.con;
            data.abilities.con.mod = 0;

            data.abilities.int.base = activeChassis.data.abilityScores.int + (abilityIncreaseStats.includes("int") ? abilityIncreases : 0);

            data.abilities.wis.base = activeChassis.data.abilityScores.wis + (abilityIncreaseStats.includes("wis") ? abilityIncreases : 0);
            
            data.abilities.cha.base = activeChassis.data.abilityScores.cha + (abilityIncreaseStats.includes("cha") ? abilityIncreases : 0);
        } else {
            data.abilities.str.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.dex.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.con.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.int.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.wis.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
            data.abilities.cha.tooltip.push(game.i18n.format("SFRPG.DroneSheet.Chassis.NotInstalled"));
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