import { nowOrThen } from '../../util';

export default function (engine) {
    const fn = (fact, context) => {
        const result = context.parameters.calculator.process(fact, context);
        return nowOrThen(result, value => {
            fact[context.parameters.field] = value;
            return fact;
        });
    }

    engine.closures.add("setResult", fn, {
        required: ["field", "calculator"],
        closureParameters: ["calculator"]
    });
}