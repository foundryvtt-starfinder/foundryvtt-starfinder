import { SFRPG } from "../../../../config.js";

export default function(engine) {
    engine.closures.add("calculateDroneDefense", (fact) => {
        const data = fact.data;

        if (!data.attributes.cmd) data.attributes.cmd = {value: 0};
        if (!data.attributes.eac) data.attributes.eac = {value: 0};
        if (!data.attributes.kac) data.attributes.kac = {value: 0};

        // We only care about the first chassis
        const activeChassis = fact.chassis && fact.chassis.length > 0 ? fact.chassis[0] : null;

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
