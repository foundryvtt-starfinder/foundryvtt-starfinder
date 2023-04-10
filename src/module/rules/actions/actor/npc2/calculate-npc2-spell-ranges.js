export default function(engine) {
    engine.closures.add('calculateNPC2SpellRanges', (fact, context) => {
        const data = fact.data;

        const cr = data.details.cr;
        data.spells.range = {
            close: 25 + 5 * Math.floor(cr / 2),
            medium: 100 + 10 * cr,
            long: 400 + 40 * cr
        };

        return fact;
    });
}
