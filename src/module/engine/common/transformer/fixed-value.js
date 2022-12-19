export default function(engine) {
    const fn = (fact, context) => context.parameters.value;

    engine.closures.add("fixedValue", fn, { required: ["value"] });
}
