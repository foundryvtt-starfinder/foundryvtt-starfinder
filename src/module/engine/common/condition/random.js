export default function(engine) {
    engine.closures.add("random", () => Math.random() >= 0.5);
}
