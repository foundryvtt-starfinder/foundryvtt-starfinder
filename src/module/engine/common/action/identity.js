export default function(engine) {
    engine.closures.add("identity", fact => fact);
}
