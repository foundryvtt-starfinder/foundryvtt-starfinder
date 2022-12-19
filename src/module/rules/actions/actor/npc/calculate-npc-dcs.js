export default function(engine) {
    engine.closures.add("calculateNpcDcs", (fact, context) => {
        const data = fact.data;

        const abilityDC = data.attributes.abilityDC;
        abilityDC.value = abilityDC.base;

        const baseSpellDC = data.attributes.baseSpellDC;
        baseSpellDC.value = baseSpellDC.base;

        return fact;
    });
}
