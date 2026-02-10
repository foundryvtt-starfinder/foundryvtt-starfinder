/**
 * A constructor function type.
 * @typedef {new (...args: any[]) => any} Constructor
 */

/**
 * A mixin function that wraps a class.
 * @typedef {(superclass: Constructor) => Constructor} MixinFunction
 */

/**
 * Helper class to apply mixins to a superclass.
 * @template {Constructor} T
 */
class MixinBuilder {
    /** @param {T} superclass */
    constructor(superclass) {
        this.superclass = superclass;
    }

    /**
     * Applies a list of mixins to the superclass.
     * @param {...MixinFunction} mixins - The mixins to apply.
     * @returns {T} The resulting class (actually T & mixed-in methods).
     */
    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass);
    }
}

/**
 * Starts the mixin composition chain.
 * @template {Constructor} T
 * @param {T} superclass - The base class to extend.
 * @returns {MixinBuilder<T>}
 */
export const Mix = (superclass) => new MixinBuilder(superclass);
