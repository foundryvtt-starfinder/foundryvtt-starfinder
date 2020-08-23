import { SFRPG } from "../../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneSaves", (fact, context) => {
        const data = fact.data;

        // We only care about the first chassis
        let activeChassis = null;
        for (const chassis of fact.classes) {
            activeChassis = chassis;
            break;
        }

        data.attributes.fort.bonus = 0;
        data.attributes.reflex.bonus = 0;
        data.attributes.will.bonus = 0;
        
        if (activeChassis) {
            let droneLevel = activeChassis.data.levels;
            droneLevel = Math.max(1, Math.min(droneLevel, 20));

            data.attributes.fort.bonus = activeChassis.data.fort == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];
            data.attributes.reflex.bonus = activeChassis.data.ref == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];
            data.attributes.will.bonus = activeChassis.data.will == "slow" ? SFRPG.droneBadSaveBonusPerLevel[droneLevel - 1] : SFRPG.droneGoodSaveBonusPerLevel[droneLevel - 1];
        }

        data.attributes.fort.bonus += data.abilities.con.mod;
        data.attributes.reflex.bonus += data.abilities.dex.mod;
        data.attributes.will.bonus += data.abilities.wis.mod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}