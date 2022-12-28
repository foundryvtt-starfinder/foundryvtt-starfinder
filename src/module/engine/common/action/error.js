export default function(engine) {
    engine.closures.add("error", (fact, {parameters}) => { throw new Error(parameters.message); }, {
        required: ["message"]
    });
}
