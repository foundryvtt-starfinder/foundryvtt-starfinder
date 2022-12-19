export default function(engine) {
    engine.closures.add('calculateNpcLevel', (fact, context) => {
        const data = fact.data;

        data.details.level = { value: data.details.cr };

        return fact;
    });
}
