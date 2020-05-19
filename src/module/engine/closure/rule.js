import { Closure } from "./closure";
import { raise, nowOrThen } from "../util";

/**
 * A rule is a named conditional closure. It understands the `process` message
 * but it will only fire its internal closure action if the provided fact matches
 * the associated conditional closure.
 *
 * @type {Rule}
 */
export class Rule extends Closure {
    constructor(name, condition, action) {
        super(name);
        this.condition = condition || raise(`Cannot build rule [${name}] without condition closure`);
        this.action = action || raise(`Cannot build rule [${name}] without action closure`);
    }

    /**
	 * Executes the actions associated with this rule over certain fact
	 * @param {Object}  fact 	   		A fact
	 * @param {Context} context 		An execution context
	 * @param {Context} context.engine	The rules engine
	 *
	 * @return {Object|Promise}        A promise that will be resolved to some result (typically
	 *                                 such result will be used as next's rule fact)
	 */
    process(fact, context) {
        return nowOrThen(this.evaluateCondition(fact, context), matches => {
            if (matches) {
                context.ruleFired(this);
                return this.action.process(fact, context);
            }

            return fact;
        });
    }

    /**
	 * Evaluates a condition
	 * @param  {Promise} fact 	a fact
	 * @param  {Context} engine	an execution context
	 * @return {Promise}		a Promise that will be resolved to a truthy/falsey
	 */
    evaluateCondition(fact, context) {
        return this.condition.process(fact, context);
    }
}