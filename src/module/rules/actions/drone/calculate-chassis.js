import { SFRPG } from "../../../config.js";

export default function (engine) {
    engine.closures.add("calculateChassis", (fact, context) => {
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

            data.attributes.eac.value = activeChassis.data.eac + SFRPG.droneACBonusPerLevel[droneLevel - 1];
            data.attributes.kac.value = activeChassis.data.kac + SFRPG.droneACBonusPerLevel[droneLevel - 1];
            data.attributes.cmd.value = data.attributes.kac.value + 8;

            data.attributes.fort.bonus = activeChassis.data.fort == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];
            data.attributes.reflex.bonus = activeChassis.data.ref == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];
            data.attributes.will.bonus = activeChassis.data.will == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];

            data.abilities.str.base = activeChassis.data.abilityScores.str + (abilityIncreaseStats.includes("str") ? abilityIncreases : 0);

            data.abilities.dex.base = activeChassis.data.abilityScores.dex + (abilityIncreaseStats.includes("dex") ? abilityIncreases : 0);

            data.abilities.con.value = activeChassis.data.abilityScores.con;
            data.abilities.con.mod = 0;

            data.abilities.int.base = activeChassis.data.abilityScores.int + (abilityIncreaseStats.includes("int") ? abilityIncreases : 0);

            data.abilities.wis.base = activeChassis.data.abilityScores.wis + (abilityIncreaseStats.includes("wis") ? abilityIncreases : 0);
            
            data.abilities.cha.base = activeChassis.data.abilityScores.cha + (abilityIncreaseStats.includes("cha") ? abilityIncreases : 0);
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