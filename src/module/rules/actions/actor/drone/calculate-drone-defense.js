import { SFRPG } from "../../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneDefense", (fact, context) => {
        const data = fact.data;

        // We only care about the first chassis
        let activeChassis = null;
        for (const chassis of fact.chassis) {
            activeChassis = chassis;
            break;
        }

        if (activeChassis) {
            const chassisData = activeChassis.system;

            let droneLevel = chassisData.levels;
            droneLevel = Math.max(1, Math.min(droneLevel, 20));

            data.attributes.eac.value = chassisData.eac + SFRPG.droneACBonusPerLevel[droneLevel - 1];
            data.attributes.kac.value = chassisData.kac + SFRPG.droneACBonusPerLevel[droneLevel - 1];
        }

        data.attributes.eac.value += data.abilities.dex.mod;
        data.attributes.kac.value += data.abilities.dex.mod;
        data.attributes.cmd.value = data.attributes.kac.value + 8;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}