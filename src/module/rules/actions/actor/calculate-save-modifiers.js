export default function (engine) {
    engine.closures.add("calculateSaveModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        fort.bonus += fort.misc + (getProperty(flags, "starfinder.greatFortitude") ? 2 : 0);
        reflex.bonus += reflex.misc + (getProperty(flags, "starfinder.lightningReflexes") ? 2 : 0);
        will.bonus += will.misc + (getProperty(flags, "starfinder.ironWill") ? 2 : 0);

        return fact;
    });
}