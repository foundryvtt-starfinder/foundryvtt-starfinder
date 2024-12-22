export default function(engine) {
    // Matches only if certain fact field (specified by field) equals to some
    // other specified value
    const fn = (fact, context) => {
        const factValue = context.parameters.field ? fact[context.parameters.field] : fact;
        return factValue === context.parameters.value;
    };

    engine.closures.add("equal", fn, {
        required: ["value"],
        optionalParameters: ["field"]
    });
}
