/**
 * Setup the roll contexts for an entity.
 * 
 * @param {Engine} engine The starfinder rules engine
 */
export default function (engine) {
    engine.closures.add("setupRollContext", (fact, context) => {
        /** @type {RollContext} */
        const rollContext = fact.rollContext;

        return fact;
    });
}