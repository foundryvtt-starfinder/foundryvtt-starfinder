export default function (engine) {
    engine.closures.add("noop", (fact, context) => fact);
}