import Engine from "../../../../engine/engine.js";
import { SFRPG } from "../../../../config.js";

/**
 * Calculate a mechs EAC and KAC.
 * 
 * @param {Engine} engine The SFRPG rules engine.
 */
export default function (engine) {
    engine.closures.add('calculateMechAc', (fact, context) => {
        const data = fact.data;
        const frame = fact.mechFrame;
        const upperLimbs = fact.mechUpperLimbs;
        const lowerLimbs = fact.mechLowerLimbs;
        const tier = data?.details?.tier ?? 0;
        const baseAc = SFRPG.mechStatisticsByTier[tier].baseAc;

        data.attributes.eac.value = baseAc + (frame?.eac ?? 0) + (upperLimbs?.eac ?? 0) + (lowerLimbs?.eac ?? 0);
        data.attributes.kac.value = baseAc + (frame?.kac ?? 0) + (upperLimbs?.kac ?? 0) + (lowerLimbs?.kac ?? 0);

        return fact;
    });
}