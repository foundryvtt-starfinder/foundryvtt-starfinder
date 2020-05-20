export default function (engine) {
    engine.closures.add("calculateBaseAbilityModifier", (fact, context) => {
        const data = fact.data;

        for (let abl of Object.values(data.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
        }

        return fact;
    });
}