import Engine from "../../../../engine/engine.js";
import { SFRPG } from "../../../../config.js";

/**
 * Calculates the shield points for a mech.
 * 
 * @param {Engine} engine The SFRPG rules engine
 */
export default function (engine) {
    engine.closures.add('calculateMechShieldPoints', (fact, context) => {
        const data = fact.data;
        const tier = data?.details?.tier ?? 0;

        data.sp.max = SFRPG.mechStatisticsByTier[tier].sp;

        return fact;
    });
}