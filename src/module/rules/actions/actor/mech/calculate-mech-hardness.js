import Engine from "../../../../engine/engine.js";
import { SFRPG } from "../../../../config.js";

/**
 * Calculate the hardness for a mech.
 * 
 * @param {Engine} engine The SFRPG rules engine.
 */
export default function (engine) {
    engine.closures.add('calculateMechHardness', (fact, context) => {
        const data = fact.data;
        const frame = fact.mechFrame;
        const tier = data?.details?.tier ?? 0;

        data.attributes.hardness.value = (frame?.hardness ?? 0) + SFRPG.mechStatisticsByTier[tier].hardness;

        return fact;
    });
}