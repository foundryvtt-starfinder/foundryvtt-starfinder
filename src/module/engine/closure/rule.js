import { Closure } from "./closure.js";
import { raise, nowOrThen } from "../util.js";

/**
 * A rule is a named conditional closure. It understands the `process` message
 * but it will only fire its internal closure action if the provided fact matches
 * the associated conditional closure.
 *
 * @param {String}  name      The name of the rule.
 * @param {Closure} condition The closure that determines if this rule has met a condition
 * @param {Closure} action    The action to take if the condition is met.
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
	 * @return {Object|Promise}         A promise that will be resolved to some result (typically
	 *                                  such result will be used as the next fact)
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
	 * @param  {Promise} fact 	A fact
	 * @param  {Context} engine	An execution context
	 * @return {Promise}		A Promise that will be resolved to a truthy/falsey
	 */
    evaluateCondition(fact, context) {
        return this.condition.process(fact, context);
    }
}
