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
import isModifierType from './rules/conditions/is-modifier-type.js';
import isActorType from './rules/conditions/is-actor-type.js';
import stackModifiers from './rules/actions/modifiers/stack-modifiers.js';
import logToConsole from './rules/actions/log.js';
import clearTooltips from './rules/actions/actor/clear-tooltips.js';
import calculateBaseAbilityScore from './rules/actions/actor/calculate-base-ability-score.js';
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
import calculateCmdModifiers from './rules/actions/actor/calculate-cmd-modifiers.js';
import calculatePlayerXp from './rules/actions/actor/calculate-xp.js';
import calculateShipArmorClass from './rules/actions/starship/calculate-ac.js';
import calculateShipCritThreshold from './rules/actions/starship/calculate-ct.js';
import calculateDrift from './rules/actions/starship/calculate-drift.js';
import calculateMaxShields from './rules/actions/starship/calculate-max-shields.js';
import calculatePower from './rules/actions/starship/calculate-power.js';
import calculateShipShields from './rules/actions/starship/calculate-shields.js';
import calculateShipSpeed from './rules/actions/starship/calculate-speed.js';
import calculateShipTargetLock from './rules/actions/starship/calculate-tl.js';
import calculateBaseSkills from './rules/actions/actor/calculate-base-skills.js';
import calculateSkillModifiers from './rules/actions/actor/calculate-skill-modifiers.js';
import calculateNpcXp from './rules/actions/actor/calculate-npc-xp.js';
import calculateNpcAbilityValue from './rules/actions/actor/calculate-npc-ability-value.js';
import calculateSkillArmorCheckPenalty from './rules/actions/actor/calculate-skill-armor-check-penalty.js';
import calculateAbilityCheckModifiers from './rules/actions/actor/calculate-ability-check-modifiers.js';
import calculateEncumbrance from './rules/actions/actor/calculate-encumbrance.js';
// Character rules
import calculateHitpoints from './rules/actions/actor/character/calculate-hitpoints.js';
import calculateResolve from './rules/actions/actor/character/calculate-resolve.js';
import calculateSkillpoints from './rules/actions/actor/character/calculate-skillpoints.js';
import calculateStamina from './rules/actions/actor/character/calculate-stamina.js';
import calculateTraits from './rules/actions/actor/calculate-traits.js';
// Drone rules
import calculateDroneChassis from './rules/actions/actor/drone/calculate-drone-chassis.js';
import calculateDroneDefense from './rules/actions/actor/drone/calculate-drone-defense.js';
import calculateDroneEquipment from './rules/actions/actor/drone/calculate-drone-equipment.js';
import calculateDroneHitpoints from './rules/actions/actor/drone/calculate-drone-hitpoints.js';
import calculateDroneMods from './rules/actions/actor/drone/calculate-drone-mods.js';
import calculateDroneResolve from './rules/actions/actor/drone/calculate-drone-resolve.js';
import calculateDroneSaves from './rules/actions/actor/drone/calculate-drone-saves.js';
import calculateDroneSkills from './rules/actions/actor/drone/calculate-drone-skills.js';

export default function (engine) {
    console.log("SFRPG | Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);
    // Actor actions
    clearTooltips(engine);
    calculateBaseAbilityScore(engine);
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
    calculateCmdModifiers(engine);
    calculatePlayerXp(engine);
    calculateBaseSkills(engine);
    calculateSkillModifiers(engine);
    calculateSkillArmorCheckPenalty(engine);
    calculateNpcXp(engine);
    calculateNpcAbilityValue(engine);
    calculateAbilityCheckModifiers(engine);
    calculateEncumbrance(engine);
    // Character actions
    calculateHitpoints(engine);
    calculateResolve(engine);
    calculateSkillpoints(engine);
    calculateStamina(engine);
    calculateTraits(engine);
    // Starship actions
    calculateShipArmorClass(engine);
    calculateShipCritThreshold(engine);
    calculateDrift(engine);
    calculateMaxShields(engine);
    calculatePower(engine);
    calculateShipShields(engine);
    calculateShipSpeed(engine);
    calculateShipTargetLock(engine);
    // Drone actions
    calculateDroneChassis(engine);
    calculateDroneDefense(engine);
    calculateDroneEquipment(engine);
    calculateDroneHitpoints(engine);
    calculateDroneMods(engine);
    calculateDroneResolve(engine);
    calculateDroneSaves(engine);
    calculateDroneSkills(engine);

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
    logToConsole(engine);
    isActorType(engine);
    isModifierType(engine);
    stackModifiers(engine);
    
    engine.add({
        name: "process-actors",
        description: "Take all of the actor data and process it by actor type.",
        rules: [
            {
                when: { closure: "isActorType", type: "character" },
                then: [
                    "clearTooltips",
                    "calculateCharacterLevel",
                    "calculateTraits",
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateBaseArmorClass",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAttackBonus", stackModifiers: "stackModifiers" },
                    "calculateBaseSaves",
                    { closure: "calculateSaveModifiers", stackModifiers: "stackModifiers"},
                    "calculateInitiative",
                    {closure: "calculateInitiativeModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    { closure: "calculateCMDModifiers", stackModifiers: "stackModifiers" },
                    "calculateXP",
                    { closure: "calculateSkillpoints", stackModifiers: "stackModifiers" },
                    "calculateBaseSkills",
                    { closure: "calculateSkillArmorCheckPenalty", stackModifiers: "stackModifiers" },
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" },
                    { closure: "calculateStamina", stackModifiers: "stackModifiers" },
                    { closure: "calculateResolve", stackModifiers: "stackModifiers" },
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" }
                ]
            },
            {
                when: { closure: "isActorType", type: "starship" },
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
            },
            {
                when: { closure: "isActorType", type: "npc" },
                then: ["calculateNpcXp", "calculateNpcAbilityValue"]
            },
            {
                when: { closure: "isActorType", type: "vehicle" },
                then: "identity"
            },
            {
                when: { closure: "isActorType", type: "drone" },
                then: [
                    "clearTooltips",
                    "calculateDroneChassis",
                    "calculateDroneMods",
                    "calculateDroneEquipment",
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateDroneSkills",
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    "calculateDroneSaves",
                    { closure: "calculateSaveModifiers", stackModifiers: "stackModifiers"},
                    "calculateDroneDefense",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    { closure: "calculateCMDModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneHitpoints", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneResolve", stackModifiers: "stackModifiers" },
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" }
                ]
            }
        ]
    });

    Hooks.callAll('sfrpg.registerRules', engine);

    console.log("SFRPG | Done registering rules");
}