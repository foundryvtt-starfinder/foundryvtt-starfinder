export default function (engine) {
    engine.closures.add("calculateBaseAbilityModifier", (fact, context) => {
        for (let abl of Object.values(fact.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
        }

        return fact;
    });
}