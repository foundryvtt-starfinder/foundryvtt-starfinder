import Engine from "../../../../engine/engine.js";

/**
 * Sets up the details for a mech based on the selected frame and limbs (upper and lower).
 * 
 * @param {Engine} engine The SFRPG rules engine
 */
export default function (engine) {
    engine.closures.add('setupMechDetails', (fact, context) => {
        const data = fact.data;
        const frame = fact.mechFrame;
        const lowerLimbs = fact.lowerLimbs;
        const upperLimbs = fact.upperLimbs;
        const powercore = fact.mechPowerCore;

        data.details.frame = frame.name;
        data.details.lowerLimbs = lowerLimbs.name;
        data.details.upperLimbs = upperLimbs.name;
        data.details.powerCore = powercore.name;

        return fact;
    });
}
