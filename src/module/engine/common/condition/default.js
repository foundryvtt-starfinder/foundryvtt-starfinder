export default function (engine) {
    // Executes only if NO other rule has been executed for this flow
    engine.closures.add('default', (fact, context) => !context.currentRuleFlowActivated);
}