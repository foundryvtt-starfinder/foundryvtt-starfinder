import { ClosureReducer } from "./closure-reducer.js";
import { nowOrThen } from "../util.js";

export class RuleFlow extends ClosureReducer {
    process(fact, context) {
        return nowOrThen(super.process(fact, context), fact => {
            context.endFlow();
            return fact;
        });
    }
}