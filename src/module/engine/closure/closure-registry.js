import { FunctionalClosure } from "./functional-closure.js";
import { ClosureReducer } from "./closure-reducer.js";
import { RuleFlow } from "./rule-flow.js";
import { Rule } from "./rule.js";
import { raise } from "../util.js";

/**
 * ClosureRegistry is the main entry point for creating closure out of the
 * closure definition json.
 *
 * It also acts as a registry for name-closure implementations which need to
 * be provided before parsing any named-closures.
 *
 * @param {Engine} engine The rules engine instance
 *
 * @type {ClosureRegistry}
 */
export class ClosureRegistry {
    constructor(engine) {
        this.engine = engine;
        this.namedClosures = {};
    }

    /**
	 * Adds a closure to the registry by name hence becoming a
	 * NAMED closure.
	 *
	 * @param {String}           name                The name of the closure.
	 * @param {Closure|Function} closure             The `Closure` object or function implementation.
	 * @param {Object}           options             Closure registering options.
	 * @param {Boolean}          options.override    This method will fail if a closure with
	 * 				                                 the same name alrady exists, unless override is set to `true`.
	 *
	 * @returns {Closure}                             The closure added
	 */
    add(name, closure, options = {}) {
        name || raise("Cannot add anonymous closure");

        if (closure.closureType) {
            options.required = options.required || closure.required;
            options.closureParameters = options.closureParameters || closure.closureParameters;
            closure = new closure(name, options);
        }

        if (typeof closure === "function") {
            closure = new FunctionalClosure(name, closure, options);
        }

        if (this.namedClosures[name] && !options.override) {
            raise(`Already defined a closure with name '${name}'`);
        }

        this.namedClosures[name] = closure;
        return closure;
    }

    /**
     * Get a closure by name.
     *
     * @param {String} name The name of the closure to get
     *
     * @returns {Closure}   The named closure
     */
    get(name) {
        const closure = this.namedClosures[name];
        if (!closure) {
            raise(`Unexistent named closure [${name}]`);
        }

        return closure;
    }

    /**
	 * Creates a closure from its definition.
	 *
	 * If definition parameter is:
	 * - an array then a ClosureReducer will be created and each item in the array will be parsed as a closure.
	 * - an object with the property `rules` then it's interpreted as a rule flow (an special case of a ClosureReducer)
	 * - an object has either `when` or `then` properties it is assumed to be a Rule and it is created parsing both `when` and `then` definition as closures.
     *
     * - if it is a string a parameterless implementation for it will be looked up in the implementations registry.
	 * - if it is an object it will an implementation for `definition.closure` will be looked up in the implementation registry.
	 *
	 * @param  {Object|string|Object[]} definition The json defintion for the closure
     * @param  {Object}                 options    Options for the closure
     *
	 * @returns {Object}            		       A closure object (it will understand the
	 *                                             message process)
	 */
    parse(definition, options) {
        if (Array.isArray(definition)) {
            return this._createReducer(definition, options);
        } else if (definition.rules) {
            return this._createRuleFlow(definition);
        } else if (definition.when || definition.then) {
            return this._createRule(definition);
        } else if (definition.closureLibrary) {
            return this._createClosureLibrary(definition);
        } else {
            return this._createNamedClosure(definition);
        }
    }

    parseOrValue(definition) {
        // if it is exactly undefined: do nothing
        if (definition === undefined) {
            return definition;
        }

        // rule out the "value" case: if it is a falsy value, a number, an Array, or a String which is not the name of a registered closure
        // in such cases, I return a fixedValue closure for the give value
        if (!definition || typeof definition === "number" || Array.isArray(definition) || (typeof definition === "string" && !this.namedClosures[definition])) {
            return this.namedClosures["fixedValue"].bind(null, {value: definition}, null); // no engine needed
        }

        // it is a true definition
        return this.parse(definition);
    }

    _createReducer(definition, options) {
        const closures = definition.map(eachDefinition => this.parse(eachDefinition));
        return new ClosureReducer(definition.name, closures, options);
    }

    _createRule(definition) {
        if (!definition.when) raise(`Rule '${definition.name}' must define a valid when clause`);
        if (!definition.then) raise(`Rule '${definition.name}' must define a valid then clause`);

        const condition = this.parse(definition.when, { strategy: definition.conditionStrategy || "and" });
        const action =  this.parse(definition.then);
        return new Rule(definition.name, condition, action);
    }

    _createRuleFlow(definition) {
        const closures = definition.rules.map(eachDefinition => this.parse(eachDefinition));
        return new RuleFlow(definition.name, closures, { matchOnce: definition.matchOnce });
    }

    _createClosureLibrary(definition) {
        return definition.closureLibrary.map(closureDefinition => this._createNamedClosure(closureDefinition));
    }

    _createNamedClosure(definition) {
        definition = typeof definition === "string" ? { closure: definition } : definition;
        const closure = this.get(definition.closure);

        const parameters = Object.assign({}, definition);
        delete parameters.closure;

        return closure.bind(definition.name, parameters, this.engine);
    }
}
