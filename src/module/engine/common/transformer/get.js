export default function (engine) {
    const fn = (fact, context) => fact[context.parameters.prop];

    engine.closures.add('get', fn, { required: ["prop"] });
}