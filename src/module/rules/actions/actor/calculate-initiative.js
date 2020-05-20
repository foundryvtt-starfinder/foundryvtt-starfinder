export default function (engine) {
    engine.closures.add("calculateInitiative", (fact, context) => {
        const data = fact.data;
        const init = data.attributes.init;

        init.mod = data.abilities.dex.mod;
        init.total = init.mod + init.bonus;

        return fact;
    });
}