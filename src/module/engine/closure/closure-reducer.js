import { Closure } from './closure.js';
import { raise, nowOrThen } from '../util.js';

// Strategies define how we merge what every fact returns.
const reduceStrategies = {
    and: (prev, next) => prev && next,
    or: (prev, next) => prev || next,
    // This strategy requires the previous fact, while the other require the original to process conditions
    last: (_, next) => next
};

/**
 * This is a closure composite that will reduce the fact execution through
 * a list of component closures. The result of each losure execution will
 * be used as a fact for the next closure.
 * 
 * @param {String} name The name of the closure
 * @param {Array} closures An array of closures
 * @param {Object} options Any options used by the closure
 * 
 * @type {ClosureReducer}
 */
export class ClosureReducer extends Closure {
    constructor(name, closures, options) {
        super(name, options);
        this.closures = closures || raise(`Cannot build closure reducer [${name}] without closure chain`);
    }

    /** @override */
    process(fact, context) {
        return this.reduce(0, fact, context);
    }

    reduce(index, fact, context) {
        if (this.closures.length <= index) {
            return fact;
        }

        return nowOrThen(this.closures[index].process(fact, context), newFact => {
            if (this.options.matchOnce && context.currentRuleFlowActivated) {
                return newFact;
            }

            if (this.options.strategy && this.options.strategy !== "last") {
                const reduceStrategy = reduceStrategies[this.options.strategy];
                return this.closures.length <= index + 1
                    ? newFact
                    : reduceStrategy(newFact, this.reduce(index + 1, fact, context));
            }

            return reduceStrategies.last(newFact, this.reduce(index + 1, newFact, context));
        });
    }
}