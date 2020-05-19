import { ClosureReducer } from "./closure-reducer";
import { nowOrThen } from "../util";

export class RuleFlow extends ClosureReducer {
    process(fact, context) {
        return nowOrThen(super.process(fact, context), fact => {
            context.endFlow();
            return fact;
        });
    }
}