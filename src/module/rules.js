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
import calculateBaseAbilityModifier from './rules/actions/actor/calculate-base-ability-modifier.js';
import calculateBaseArmorClass from './rules/actions/actor/calculate-base-armor-class.js';
import calculateArmorModifiers from './rules/actions/actor/calculate-armor-modifiers.js';
import calculateBab from './rules/actions/actor/calculate-bab.js';
import calculateBaseSaves from './rules/actions/actor/calculate-base-saves.js';
import calculateSaveModifiers from './rules/actions/actor/calculate-save-modifiers.js';
import calculateCharacterLevel from './rules/actions/actor/calculate-character-level.js';
import calculateInitiative from './rules/actions/actor/calculate-initiative.js';
import calculateInitiativeModifiers from './rules/actions/actor/calculate-initiative-modifiers.js';
import calculateCmd from './rules/actions/actor/calculate-cmd.js';
import calculatePlayerXp from './rules/actions/actor/calculate-xp.js';
import calculateShipArmorClass from './rules/actions/starship/calculate-ac.js';
import calculateShipCritThreshold from './rules/actions/starship/calculate-ct.js';
import calculateDrift from './rules/actions/starship/calculate-drift.js';
import calculateMaxShields from './rules/actions/starship/calculate-max-shields.js';
import calculatePower from './rules/actions/starship/calculate-power.js';
import calculateShipShields from './rules/actions/starship/calculate-shields.js';
import calculateShipSpeed from './rules/actions/starship/calculate-speed.js';
import calculateShipTargetLock from './rules/actions/starship/calculate-tl.js';

export default function (engine) {
    console.log("Starfinder | Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);
    // Actor actions
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
    calculatePlayerXp(engine);
    // Starship actions
    calculateShipArmorClass(engine);
    calculateShipCritThreshold(engine);
    calculateDrift(engine);
    calculateMaxShields(engine);
    calculatePower(engine);
    calculateShipShields(engine);
    calculateShipSpeed(engine);
    calculateShipTargetLock(engine);
    

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
    engine.add({
        name: "process-pc",
        rules: [
            {
                when: "always",
                then: "calculateBaseAbilityModifier"
            },
            {
                when: "always", 
                then: ["calculateBaseArmorClass", "calculateArmorModifiers"]
            },
            {
                when: "always",
                then: "calculateBaseAttackBonus"
            },
            {
                when: "always",
                then: ["calculateBaseSaves", "calculateSaveModifiers"]
            },
            {
                when: "always",
                then: "calculateCharacterLevel"
            },
            {
                when: "always",
                then: ["calculateInitiativeModifiers", "calculateInitiative"]
            },
            {
                when: "always",
                then: "calculateCMD"
            },
            {
                when: "always",
                then: "calculateXP"
            }
        ]
    });
    engine.add({
        name: "process-starship",
        when: "always",
        then: [
            "calculateShipArmorClass",
            "calculateShipCritThreshold",
            "calculateDrift",
            "calculateShields",
            "calculateShipMaxShields",
            "calculateShipPower",
            "calculateShipSpeed",
            "calculateShipTargetLock"
        ]
    });

    Hooks.callAll('starfinder.registerRules', engine);

    console.log("Starfinder | Done registering rules");
}