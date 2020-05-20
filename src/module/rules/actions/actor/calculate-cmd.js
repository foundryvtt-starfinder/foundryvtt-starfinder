export default function (engine) {
    engine.closures.add("calculateCMD", (fact, context) => {
        fact.data.attributes.cmd.value = 8 + fact.data.attributes.kac.value;

        return fact;
    });
}