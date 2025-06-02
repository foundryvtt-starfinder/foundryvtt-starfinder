export class Context {
    /**
     * The context for the rule.
     *
     * @param {Engine} engine The rules engine instance
     * @param {Object} parameters The parameters passed into this context
     * @param {Array} rulesFired An array of rules that have already been processed
     * @param {Boolean} currentRuleFlowActivated Is this rule flow activated
     */
    constructor(engine, parameters, rulesFired, currentRuleFlowActivated) {
        this.engine = engine;
        this.parameters = parameters || {};
        this.rulesFired = rulesFired || [];
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

    ruleFired(rule) {
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
