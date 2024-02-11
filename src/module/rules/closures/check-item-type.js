import { Closure } from '../../engine/closure/closure.js';

/**
 * Check that an item is a specific type.
 */
export default class CheckItemType extends Closure {
    /** @override */
    process(fact, context) {
        return fact.item.type === context.parameters.type;
    }
}
