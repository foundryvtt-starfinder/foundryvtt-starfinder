import { Closure } from './closure';
import { raise, nowOrThen } from '../util';

const reduceStrategies = {
    and: (prev, next) => prev && next,
    or: (prev, next) => prev || next,
    last: (_, next) => next
};

/**
 * This is a closure composite that will reduce the fact execution through
 * a list of component closures. The result of each losure execution will
 * be used as a fact for the next closure.
 * 
 * @type {ClosureReducer}
 */
export class ClosureReducer extends Closure {
    constructor(name, closures, options) {
        super(name, options);
        this.closures = closures || raise(`Cannot build closure reduce [${name}] without closre chain`);
    }

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