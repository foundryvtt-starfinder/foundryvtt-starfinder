import { Closure } from "../../engine/closure/closure.js";

/**
 * Check that a modifier is of a particular bonus type.
 */
export default class CheckModifierType extends Closure {
    process(fact, context) {
        return fact.type === context.parameters.type;
    }
}