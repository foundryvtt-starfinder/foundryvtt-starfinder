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
import calculateBaseAbilityModifier from './rules/actions/calculate-base-ability-modifier.js';
import calculateBaseArmorClass from './rules/actions/calculate-base-armor-class.js';
import calculateArmorModifiers from './rules/actions/calculate-armor-modifiers.js';
import calculateBab from './rules/actions/calculate-bab.js';
import calculateBaseSaves from './rules/actions/calculate-base-saves.js';
import calculateSaveModifiers from './rules/actions/calculate-save-modifiers.js';
import calculateCharacterLevel from './rules/actions/calculate-character-level.js';
import calculateInitiative from './rules/actions/calculate-initiative.js';
import calculateInitiativeModifiers from './rules/actions/calculate-initiative-modifiers.js';
import calculateCmd from './rules/actions/calculate-cmd.js';

export default function (engine) {
    console.log("Starfinder | Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);
    calculateBaseAbilityModifier(engine);
    calculateBaseArmorClass(engine);
    calculateArmorModifiers(engine);
    calculateBab(engine);
    calculateBaseSaves(engine);
    calculateSaveModifiers(engine);
    calculateCharacterLevel(engine);
    calculateInitiative(engine);
    calculateInitiativeModifiers(engine);
    calculateCmd(engine);

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

    engine.add({name: "process-base-ability-modifiers", closure: "calculateBaseAbilityModifier"});
    engine.add({name: "process-armor-class", when: "always", then: ["calculateBaseArmorClass", "calculateArmorModifiers"]});
    engine.add({name: "process-bab", closure: "calculateBaseAttackBonus"});
    engine.add({name: "process-saves", when: "always", then: ["calculateBaseSaves", "calculateSaveModifiers"]});
    engine.add({name: "process-character-level", closure: "calculateCharacterLevel"});
    engine.add({name: "process-initiative", when: "always", then: ["calculateInitiativeModifiers", "calculateInitiative"]});
    engine.add({name: "process-cmd", closure: "calculateCMD"});

    Hooks.callAll('starfinder.registerRules', engine);

    console.log("Starfinder | Done registering rules");
}