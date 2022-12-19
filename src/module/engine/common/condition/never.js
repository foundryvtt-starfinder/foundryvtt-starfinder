export default function(engine) {
    engine.closures.add("never", () => false);
}
