export default function(engine) {
    engine.closures.add("undefined", fact => undefined);
}
