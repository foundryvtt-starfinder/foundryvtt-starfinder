/**
 * A closure that is identified by a name. All closures expose the method
 * process(fact, context) that allows them to operate as predicates or 
 * transformers of a certain fact.
 * 
 * @type {Closure}
 */
export class Closure {
    constructor(name, options) {
        this.name = name;
        this.options = options || {};
    }

    get named() {
        return !!this.name;
    }

    static get closureType() { return true; }

    /**
     * Evaluates the closure against a certain fact
     * 
     * @param {Ojbect} fact               a fact
     * @param {Context} context           an execution context.
     * @param {Object} context.parameters the execution parameters, if any
     * @param {Engine} context.engine     the rules engine.
     * 
     * @returns {Object|Promise}          the result or a promise of such a result
     */
    process(fact, context) {
        throw new Error("This is an abstract closure, how did you get to instantiate this?");
    }

    /**
     * Binds this closure to a set of parameters, This will return a new Closure then
     * when invoked it will ALWAYS pass the given parameters as a fields inside the
     * context.parameters object.
     * 
     * @param {String} name       The name, if specified, of the resulting bounded closure
     * @param {Object} parameters The parameters to bound to the closure
     * @param {Engine} engine     The rules engine instance
     * 
     * @returns {Closure}         A new bounded closure
     */
    bind(name, parameters, engine) {
        if (!Object.keys(parameters).length) {
            return this;
        }

        if (this.options.closureParameters) {
            this.options.closureParameters.forEach(parameter => {
                parameters[parameter] = engine.closures.parseOrValue(parameters[parameter]);
            });
        }

        return new BoundClosure(name, this, parameters);
    }
}

class BoundClosure extends Closure {
    constructor(name, closure, parameters) {
        super(name);
        this.closure = closure;
        this.parameters = parameters || {};
    }

    process(fact, context) {
        const newContext = context.bindParameters(this.parameters);
        return this.closure.process(fact, newContext);
    }
}
