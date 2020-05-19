export class Context {
    constructor(engine, parameters, rulesFired, currentRuleFlowActivated) {
        /** @type Engine */
        this.engine = engine;
        /** @type object */
        this.parameters = parameters || {};
        /** @type Array */
        this.rulesFired = rulesFired || [];
        /** @type Boolean */
        this._currentRuleFlowActivated = !!currentRuleFlowActivated;
    }

    initiateFlow(ruleFlow) {
        this._currentRuleFlowActivated = false;
    }

    endFlow() {
        this._currentRuleFlowActivated = true;
    }

    /**
     * @returns {Boolean}
     */
    get currentRuleFlowActivated() {
        return this._currentRuleFlowActivated;
    }

    ruleFind(rule) {
        this.rulesFired.push(rule);
        this._currentRuleFlowActivated = true;
    }

    /**
     * Creates a new context bound to the new set of parameters
     * @param {Object} newParameters 
     */
    bindParameters(newParameters) {
        const parameters = Object.assign({}, this.parameters, newParameters);
        return new Context(this.engine, parameters, this.rulesFired, this._currentRuleFlowActivated);
    }
}