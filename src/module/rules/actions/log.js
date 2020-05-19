export default function (engine) {
    engine.closures.add("logToConsole", (fact, context) => {
        console.log(fact, context);
        return fact;
    });
}