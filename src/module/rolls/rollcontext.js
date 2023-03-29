export default class RollContext {
    constructor() {
        this.allContexts = {};
        this.mainContext = null;
        this.selectors = [];
    }

    addContext(name, entity, data = null) {
        this.allContexts[name] = {entity: entity, data: data ?? entity.system};
    }

    addSelector(target, options) {
        this.selectors.push({target: target, options: options});
    }

    setMainContext(mainContext) {
        this.mainContext = mainContext;
    }

    isValid() {
        /** Check if all contexts are valid. */
        for (const [key, context] of Object.entries(this.allContexts)) {
            if (!context.entity || !context.data) {
                console.log([`Context for entity ${key}:${context.entity?.name} is invalid (${context.data}).`, context, this.allContexts]);
                return false;
            }
        }

        /** Check if the main context is valid. */
        if (this.mainContext && !this.allContexts[this.mainContext]) {
            console.log([`Main context is invalid.`, this.mainContext]);
            return false;
        }

        /** Check if selector options are valid. */
        for (const selector of this.selectors) {
            for (const option of selector.options) {
                if (!this.allContexts[option]) {
                    console.log([`Selector ${selector.name} has an invalid option ${option}.`, selector, option]);
                    return false;
                }
            }
        }
        return true;
    }

    getValue(variable) {
        if (!variable) return null;

        const [context, key] = this.getContextForVariable(variable);

        let result = RollContext._readValue(context.data, key);
        if (!result) {
            result = RollContext._readValue(context.entity.data, key);
        }

        return result;
    }

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

    getRollData() {
        let obj = {};
        for (const [context, data] of Object.entries(this.allContexts)) {
            if (context === this.mainContext) {
                obj = mergeObject(obj, data.data);
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

    static createActorRollContext(actor, dataOptions = {actorData: null, actorKey: "actor"}) {
        const rollContext = new RollContext();
        if (actor) {
            rollContext.addContext(dataOptions?.actorKey ?? "actor", actor, dataOptions?.actorData);
            rollContext.setMainContext(dataOptions?.actorKey ?? "actor");
            actor.setupRollContexts(rollContext);
        }
        return rollContext;
    }

    static createItemRollContext(item, itemOwningActor, dataOptions = {itemData: null, ownerData: null, ownerKey: "owner"}) {
        const rollContext = new RollContext();

        rollContext.addContext("item", item, dataOptions?.itemData);
        rollContext.setMainContext("item");

        if (itemOwningActor) {
            if (itemOwningActor) {
                rollContext.addContext(dataOptions?.ownerKey ?? "owner", itemOwningActor, dataOptions?.ownerData);
                rollContext.setMainContext(dataOptions?.ownerKey ?? "owner");
            }

            itemOwningActor.setupRollContexts(rollContext);
        }

        return rollContext;
    }
}
