import Engine from '../../../../engine/engine.js';
/**
 * Calculates the hit points for mechs.
 * 
 * @param {Engine} engine The SFRPG rules engine
 */
export default function (engine) {
    engine.closures.add('calculateMechHitPoints', (fact, context) => {
        const frame = fact.mechFrame;
        const upperLimbs = fact.mechUpperLimbs;
        const lowerLimbs = fact.mechLowerLimbs;
        const data = fact.data;
        const tier = data?.details?.tier ?? 0;

        const baseHp = (frame?.hp?.base ?? 0) + (upperLimbs?.hp?.base ?? 0) + (lowerLimbs?.hp?.base ?? 0);
        const advancement = (frame?.hp?.advancement ?? 0) + (upperLimbs?.hp?.advancement ?? 0) + (lowerLimbs?.hp?.advancement ?? 0);

        data.attributes.hp.max = baseHp + (advancement * tier);

        return fact;
        
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}