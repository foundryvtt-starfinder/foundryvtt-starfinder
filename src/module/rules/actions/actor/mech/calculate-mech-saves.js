import Engine from "../../../../engine/engine.js";
import { SFRPG } from "../../../../config.js";

/**
 * Calculate a mechs saves.
 * 
 * @param {Engine} engine The SFRPG rules engine.
 */
export default function (engine) {
    engine.closures.add('calculateMechSaves', (fact, context) => {
        const data = fact.data;
        const frame = fact.mechFrame;
        const lowerLimbs = fact.mechLowerLimbs;
        const tier = data?.details?.tier ?? 0;
        const baseSave = SFRPG.mechStatisticsByTier[tier].baseSave;

        data.attributes.saves.fort.mod = baseSave + (frame?.saves?.fort ?? 0) + (lowerLimbs?.saves?.fort ?? 0);
        data.attributes.saves.reflex.mod = baseSave + (frame?.saves?.reflex ?? 0) + (lowerLimbs?.saves?.reflex ?? 0);

        return fact;
    });
}
