export default function(engine) {
    engine.closures.add("calculateNpcAbilityValue", (fact, context) => {
        const data = fact.data;

        for (let ability of Object.values(data.abilities)) {
            ability.value = Math.floor((ability.mod * 2) + 10);
        }

        return fact;
    });
}
