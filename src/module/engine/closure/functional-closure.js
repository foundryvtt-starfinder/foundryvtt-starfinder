import { Closure } from './closure.js';

/**
 * A simple closure that's implemented through a function that is defined
 * in beforehand.
 * 
 * @param {String}   name    The name of the closure.
 * @param {Function} fn      A function providing an implementation for this closure.
 * @param {Object}   options Any options for the closure.
 *
 * @type {FunctionalClosure}
 */
export class FunctionalClosure extends Closure {
    constructor(name, fn, options) {
        super(name, options);
        if (typeof(fn) !== "function") {
            throw new TypeError(`Implementation for provided closure '${name}' is not a function`);
        }

        this.fn = fn;
    }

    /**
	 * Evaluates the block against a fact promise
	 * @param {Object} fact 			A fact
	 * @param {Context} context		    An execution context.
	 * @param {Context} context.engine	The rules engine
	 *
	 * @return {Object|Promise}         A promise that will be resolved to some result
	 */
    process(fact, context) {
        return this.fn.call(this, fact, context);
    }
}