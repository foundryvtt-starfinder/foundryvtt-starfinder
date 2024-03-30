import Engine from "../../../../engine/engine.js";
import { SFRPG } from "../../../../config.js";

/**
 * Calculate a mech's strength modifier.
 * 
 * @param {Engine} engine The SFRPG rules engine.
 */
export default function (engine) {
    engine.closures.add('calculateMechStrengthMod', (fact, context) => {
        const data = fact.data;
        const frame = fact.mechFrame;
        const tier = data?.details?.tier ?? 0;
        const baseStrength = SFRPG.mechStatisticsByTier[tier].strength;

        data.attributes.strength.mod = baseStrength + (frame?.strength ?? 0);

        return fact;
    });
}
