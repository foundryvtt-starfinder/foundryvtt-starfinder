export default function(engine) {
    engine.closures.add("calculateNpcAbilityValue", (fact) => {
        const data = fact.data;

        for (const ability of Object.values(data.abilities)) {
            ability.value = Math.floor((ability.mod * 2) + 10);
        }

        return fact;
    });
}
