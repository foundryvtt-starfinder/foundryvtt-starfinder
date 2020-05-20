export default function (engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const init = data.attributes.init;

        init.bonus = init.value 
            + (getProperty(flags, "starfinder.improvedInititive") ? 4 : 0) 
            + (getProperty(flags, "starfinder.rapidResponse") ? 4 : 0);

        return fact;
    });
}