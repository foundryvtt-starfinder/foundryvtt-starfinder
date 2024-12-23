/**
 * @typedef {Object} RollData
 * An object containing relevant data of a document, to be used at roll-time to resolve `@tags` in formulas.
 *
 * ```js
 * const rollData = {
 *   abilities: {
 *     str: {
 *       mod: 2
 *       }
 *     }
 * }
 * ```
 * `@abilities.str.mod` will resolve to 2
 */
/**
 * @typedef {`@${string}`} FormulaKey
 * A string containing an object lookup key
 */

/**
 * A class to create and manipulate RollContext data.
 *
 * RollContexts are lookup objects used to resolve formulas with @tags such as `@abilities.con.mod` or `@item.level`.
 *
 * A given roll context can be made up of various contexts, such as `@owner`, `@item`, `@gunner` etc.
 */
export default class RollContext {
    constructor() {
        this.allContexts = {};
        this.mainContext = null;
        this.selectors = [];
    }

    /**
     * Add a new context to this RollContext
     * @param {String} name The name with which this context's data will be accessible in roll data.
     * @param {ActorSFRPG|ItemSFRPG} entity The document this context refers to
     * @param {Object} [data] An arbitrary data object, to be used instead of `entity.system`
     */
    addContext(name, entity, data = null) {
        this.allContexts[name] = {entity: entity, data: data ?? entity.system};
    }

    addSelector(target, options) {
        this.selectors.push({target: target, options: options});
    }

    /**
     * Sets a given sub-context as the main context. When transformed to roll data, the Main context's data is spread across the root of the object,
     * in addition to being accessible under a @prefix.
     * @param {Context} mainContext
     */
    setMainContext(mainContext) {
        this.mainContext = mainContext;
    }

    isValid() {
        /** Check if all contexts are valid. */
        for (const [key, context] of Object.entries(this.allContexts)) {
            if (!context.entity || !context.data) {
                console.error([`Context for entity ${key}:${context.entity?.name} is invalid (${context.data}).`, context, this.allContexts]);
                return false;
            }
        }

        /** Check if the main context is valid. */
        if (this.mainContext && !this.allContexts[this.mainContext]) {
            console.error([`Main context is invalid.`, this.mainContext]);
            return false;
        }

        /** Check if selector options are valid. */
        for (const selector of this.selectors) {
            for (const option of selector.options) {
                if (!this.allContexts[option]) {
                    console.error([`Selector ${selector.name} has an invalid option ${option}.`, selector, option]);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Given a formula `@tag`, read a value from this RollFormula.
     * @param {FormulaKey} variable
     * @returns {*|Null} The value, or null if not found
     */
    getValue(variable) {
        if (!variable) return null;

        const [context, key] = this.getContextForVariable(variable);

        let result = RollContext._readValue(context.data, key);
        if (!result) {
            result = RollContext._readValue(context.entity.data, key);
        }

        return result;
    }

    /**
     * Given a formula `@tag`, return the context in which that data resides.
     * @param {FormulaKey} variable A formula `@tag`, e.g `@classes.mystic.levels`
     * @returns {[Context, FormulaKey]} An array containing the context of the variable, and the variable
     */
    getContextForVariable(variable) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (this.allContexts[firstToken]) {
            // console.log(["getContextForVariable", variable, contexts, contexts.allContexts[firstToken]]);
            return [this.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (this.mainContext ? this.allContexts[this.mainContext] : null);
        // console.log(["getContextForVariable", variable, contexts, context]);
        return [context, variable];
    }

    /**
     * Transform a RollContext into a standardised object lookup format for use at roll-time.
     *
     * Contexts are placed into the object as objects by name,
     * The main context is additionally spread into the root of the object, making it accessible without use of a prefix.
     * @returns {RollData} A roll-data object
     */
    getRollData() {
        let obj = {};
        for (const [context, data] of Object.entries(this.allContexts)) {
            if (context === this.mainContext) {
                obj = foundry.utils.mergeObject(obj, data.data);
            }

            obj[context] = data.data;
        }

        return obj;
    }

    hasMultipleSelectors() {
        for (const [key, value] of Object.entries(this.selectors)) {
            if (value.options?.length > 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Given a formula `@tag`, resolve the formula using the object as roll data.
     * @param {RollData} object An object to be used for lookup.
     * @param {FormulaKey} key The formula to be used as a key on the object.
     * @returns {*|Null} The data residing at the formula's location in the object, or null if not found.
     */
    static _readValue(object, key) {
        // console.log(["_readValue", key, object]);
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }

    /**
     * A factory method to quickly create a RollContext with a given actor's data
     * @param {ActorSFRPG} actor An actor document
     * @param {Object} dataOptions
     * @param {ActorSFRPG.system} dataOptions.actorData If the actor's data isn't in `actor.system`, specifiy it here.
     * @param {String} dataOptions.actorKey The @tag prefix to use to refer to the actor in roll formulas. This prefix is set as the main context
     * @returns {RollContext}
     */
    static createActorRollContext(actor, dataOptions = {actorData: null, actorKey: "actor"}) {
        const rollContext = new RollContext();
        if (actor) {
            rollContext.addContext(dataOptions?.actorKey ?? "actor", actor, dataOptions?.actorData);
            rollContext.setMainContext(dataOptions?.actorKey ?? "actor");
            actor.setupRollContexts(rollContext);
        }
        return rollContext;
    }

    /**
     * A factory method to quickly create a RollContext with a given actor's data
     * @param {ItemSFRPG} item An item document
     * @param {ActorSFRPG} itemOwningActor The item's owning actor
     * @param {Object} dataOptions
     * @param {ActorSFRPG.system} dataOptions.ownerData If the owner's data isn't in `actor.system`, specifiy it here.
     * @param {String} dataOptions.ownerKey The @tag prefix to use to refer to the actor in roll formulas.
     * @returns {RollContext} A new RollContext for the provided item, with the owning actor as the main context
     */
    static createItemRollContext(item, itemOwningActor, dataOptions = {itemData: null, ownerData: null, ownerKey: "owner"}) {
        const rollContext = new RollContext();

        rollContext.addContext("item", item, dataOptions?.itemData);
        rollContext.setMainContext("item");

        if (itemOwningActor) {
            if (itemOwningActor.system) {
                rollContext.addContext(dataOptions?.ownerKey ?? "owner", itemOwningActor, dataOptions?.ownerData);
                rollContext.setMainContext(dataOptions?.ownerKey ?? "owner");
            }

            itemOwningActor.setupRollContexts(rollContext);
        }

        return rollContext;
    }
}
