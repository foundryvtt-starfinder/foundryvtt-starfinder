export default function(engine) {
    engine.closures.add('calculateNpcLevel', (fact, context) => {
        const data = fact.data;

        const cr = data.details.cr;

        // NPCs have neither level nor CL, so set them to be equal to CR
        data.details.level = { value: cr };
        data.details.cl = { value: cr };

        // Spell ranges
        data.spells.range = {
            close: 25 + 5 * Math.floor(cr / 2),
            medium: 100 + 10 * cr,
            long: 400 + 40 * cr
        };

        return fact;
    });
}
