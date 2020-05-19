// Common actions
import error from './engine/common/action/error.js';
import identity from './engine/common/action/identity.js';
import setResult from './engine/common/action/set-result.js';
import undefined from './engine/common/action/undefined.js';

// Common conditions
import always from './engine/common/condition/always.js';
import defaultCondition from './engine/common/condition/default.js';
import equal from './engine/common/condition/equal.js';
import never from './engine/common/condition/never.js';
import random from './engine/common/condition/random.js';

// Common Transformers
import fixedValue from './engine/common/transformer/fixed-value.js';
import get from './engine/common/transformer/get.js';

// Custom rules
import isCircumstanceBonus from './rules/conditions/is-circumstance.js';
import isUntypedBonus from './rules/conditions/is-untyped.js';
import logToConsole from './rules/actions/log.js';

export default function (engine) {
    console.log("Starfinder | Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);

    // Conditions
    always(engine);
    defaultCondition(engine);
    equal(engine);
    never(engine);
    random(engine);

    // Transformations
    fixedValue(engine);
    get(engine);

    // Custom rules
    isCircumstanceBonus(engine);
    isUntypedBonus(engine);
    logToConsole(engine);

    console.log("Starfinder | Done registering rules");
}