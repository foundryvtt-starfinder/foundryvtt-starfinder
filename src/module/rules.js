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
import isModifierType                   from './rules/conditions/is-modifier-type.js';
import isActorType                      from './rules/conditions/is-actor-type.js';
import stackModifiers                   from './rules/actions/modifiers/stack-modifiers.js';
import logToConsole                     from './rules/actions/log.js';
import clearTooltips                    from './rules/actions/actor/clear-tooltips.js';
import calculateAbilityCheckModifiers   from './rules/actions/actor/calculate-ability-check-modifiers.js';
import calculateActorResources          from './rules/actions/actor/calculate-actor-resources-early.js';
import calculateActorResourcesLate      from './rules/actions/actor/calculate-actor-resources-late.js';
import calculateArmorModifiers          from './rules/actions/actor/calculate-armor-modifiers.js';
import calculateBaseAttackBonusModifier from './rules/actions/actor/calculate-bab-modifier.js';
import calculateBaseAbilityModifier     from './rules/actions/actor/calculate-base-ability-modifier.js';
import calculateBaseAbilityScore        from './rules/actions/actor/calculate-base-ability-score.js';
import calculateCmd                     from './rules/actions/actor/calculate-cmd.js';
import calculateDamageMitigation        from './rules/actions/actor/calculate-damage-mitigation.js';
import calculateCmdModifiers            from './rules/actions/actor/calculate-cmd-modifiers.js';
import calculateClasses                 from './rules/actions/actor/calculate-classes.js';
import calculateEncumbrance             from './rules/actions/actor/calculate-encumbrance.js';
import calculateInitiativeModifiers     from './rules/actions/actor/calculate-initiative-modifiers.js';
import calculateMovementSpeeds          from './rules/actions/actor/calculate-movement-speeds.js';
import calculateSaveModifiers           from './rules/actions/actor/calculate-save-modifiers.js';
import calculateSkillModifiers          from './rules/actions/actor/calculate-skill-modifiers.js';
// Character rules
import calculateBaseArmorClass          from './rules/actions/actor/character/calculate-base-armor-class.js';
import calculateBaseAttackBonus         from './rules/actions/actor/character/calculate-bab.js';
import calculateBaseSaves               from './rules/actions/actor/character/calculate-base-saves.js';
import calculateBaseSkills              from './rules/actions/actor/character/calculate-base-skills.js';
import calculateCharacterLevel          from './rules/actions/actor/character/calculate-character-level.js';
import calculateHitpoints               from './rules/actions/actor/character/calculate-hitpoints.js';
import calculateInitiative              from './rules/actions/actor/character/calculate-initiative.js';
import calculatePlayerXp                from './rules/actions/actor/character/calculate-xp.js';
import calculateResolve                 from './rules/actions/actor/character/calculate-resolve.js';
import calculateSkillArmorCheckPenalty  from './rules/actions/actor/character/calculate-skill-armor-check-penalty.js';
import calculateSkillpoints             from './rules/actions/actor/character/calculate-skillpoints.js';
import calculateSpellsPerDay            from './rules/actions/actor/character/calculate-spellsPerDay.js';
import calculateStamina                 from './rules/actions/actor/character/calculate-stamina.js';
import calculateTraits                  from './rules/actions/actor/character/calculate-traits.js';
// Drone rules
import calculateDroneChassis            from './rules/actions/actor/drone/calculate-drone-chassis.js';
import calculateDroneDefense            from './rules/actions/actor/drone/calculate-drone-defense.js';
import calculateDroneEquipment          from './rules/actions/actor/drone/calculate-drone-equipment.js';
import calculateDroneHitpoints          from './rules/actions/actor/drone/calculate-drone-hitpoints.js';
import calculateDroneMods               from './rules/actions/actor/drone/calculate-drone-mods.js';
import calculateDroneResolve            from './rules/actions/actor/drone/calculate-drone-resolve.js';
import calculateDroneSaves              from './rules/actions/actor/drone/calculate-drone-saves.js';
import calculateDroneSkills             from './rules/actions/actor/drone/calculate-drone-skills.js';
// NPC rules
import calculateNpcAbilityValue         from './rules/actions/actor/npc/calculate-npc-ability-value.js';
import calculateNpcDcs                  from './rules/actions/actor/npc/calculate-npc-dcs.js';
import calculateNpcLevel                from './rules/actions/actor/npc/calculate-npc-level.js';
import calculateNpcXp                   from './rules/actions/actor/npc/calculate-npc-xp.js';
// NPC2 rules
import calculateNpc2Abilities           from './rules/actions/actor/npc2/calculate-npc2-abilities.js';
import calculateNpc2ArmorClass          from './rules/actions/actor/npc2/calculate-npc2-armor-class.js';
import calculateNpc2BaseSaves           from './rules/actions/actor/npc2/calculate-npc2-saves.js';
import calculateNpc2Initiative          from './rules/actions/actor/npc2/calculate-npc2-initiative.js';
import calculateNpc2BaseSkills          from './rules/actions/actor/npc2/calculate-npc2-skills.js';
// Starship rules
import calculateStarshipFrame           from './rules/actions/actor/starship/calculate-starship-frame.js'
import calculateStarshipComputer        from './rules/actions/actor/starship/calculate-starship-computer.js'
import calculateStarshipArmorClass      from './rules/actions/actor/starship/calculate-starship-ac.js';
import calculateStarshipCrew            from './rules/actions/actor/starship/calculate-starship-crew.js';
import calculateStarshipCriticalStatus  from './rules/actions/actor/starship/calculate-starship-critical-status.js';
import calculateStarshipCritThreshold   from './rules/actions/actor/starship/calculate-starship-ct.js';
import calculateStarshipDrift           from './rules/actions/actor/starship/calculate-starship-drift.js';
import calculateStarshipAblative        from './rules/actions/actor/starship/calculate-starship-ablative.js';
import calculateStarshipPower           from './rules/actions/actor/starship/calculate-starship-power.js';
import calculateStarshipSensors         from './rules/actions/actor/starship/calculate-starship-sensors.js';
import calculateStarshipShields         from './rules/actions/actor/starship/calculate-starship-shields.js';
import calculateStarshipSpeed           from './rules/actions/actor/starship/calculate-starship-speed.js';
import calculateStarshipTargetLock      from './rules/actions/actor/starship/calculate-starship-targetlock.js';
// Vehicle rules
import calculateVehicleControlSkill from './rules/actions/actor/vehicle/calculate-vehicle-control-skill.js';
import calculateVehicleHangar       from './rules/actions/actor/vehicle/calculate-vehicle-hangar.js';
import calculateVehiclePassengers   from './rules/actions/actor/vehicle/calculate-vehicle-passengers.js';
// Item rules
import calculateSaveDC from './rules/actions/item/calculate-save-dc.js';

export default function (engine) {
    console.log("Starfinder | [SETUP] Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);
    // Actor actions
    clearTooltips(engine);
    calculateBaseAbilityScore(engine);
    calculateActorResources(engine);
    calculateActorResourcesLate(engine);
    calculateBaseAbilityModifier(engine);
    calculateBaseArmorClass(engine);
    calculateArmorModifiers(engine);
    calculateBaseAttackBonusModifier(engine);
    calculateBaseSaves(engine);
    calculateSaveModifiers(engine);
    calculateInitiative(engine);
    calculateInitiativeModifiers(engine);
    calculateCmd(engine);
    calculateDamageMitigation(engine);
    calculateCmdModifiers(engine);
    calculateBaseSkills(engine);
    calculateClasses(engine);
    calculateSkillModifiers(engine);
    calculateSkillArmorCheckPenalty(engine);
    calculateAbilityCheckModifiers(engine);
    calculateEncumbrance(engine);
    calculateMovementSpeeds(engine);
    // Character actions
    calculateBaseAttackBonus(engine);
    calculateCharacterLevel(engine);
    calculateHitpoints(engine);
    calculateResolve(engine);
    calculateSkillpoints(engine);
    calculateSpellsPerDay(engine);
    calculateStamina(engine);
    calculateTraits(engine);
    calculatePlayerXp(engine);
    // Drone actions
    calculateDroneChassis(engine);
    calculateDroneDefense(engine);
    calculateDroneEquipment(engine);
    calculateDroneHitpoints(engine);
    calculateDroneMods(engine);
    calculateDroneResolve(engine);
    calculateDroneSaves(engine);
    calculateDroneSkills(engine);
    // NPC actions
    calculateNpcAbilityValue(engine);
    calculateNpcDcs(engine);
    calculateNpcLevel(engine);
    calculateNpcXp(engine);
    // NPC2 actions
    calculateNpc2Abilities(engine);
    calculateNpc2ArmorClass(engine);
    calculateNpc2BaseSaves(engine);
    calculateNpc2Initiative(engine);
    calculateNpc2BaseSkills(engine);
    // Starship actions
    calculateStarshipArmorClass(engine);
    calculateStarshipCrew(engine);
    calculateStarshipCriticalStatus(engine);
    calculateStarshipCritThreshold(engine);
    calculateStarshipDrift(engine);
    calculateStarshipAblative(engine);
    calculateStarshipPower(engine);
    calculateStarshipSensors(engine);
    calculateStarshipShields(engine);
    calculateStarshipSpeed(engine);
    calculateStarshipTargetLock(engine);
    calculateStarshipFrame(engine);
    calculateStarshipComputer(engine);
    // Vehicle actions
    calculateVehicleControlSkill(engine);
    calculateVehicleHangar(engine);
    calculateVehiclePassengers(engine);
    // Item actions
    calculateSaveDC(engine);

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
                    "calculateClasses",
                    "calculateTraits",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateBaseArmorClass",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAttackBonus", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAttackBonusModifier", stackModifiers: "stackModifiers" },
                    "calculateBaseSaves",
                    { closure: "calculateSaveModifiers", stackModifiers: "stackModifiers"},
                    "calculateInitiative",
                    {closure: "calculateInitiativeModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    "calculateDamageMitigation",
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
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" },
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    "calculateSpellsPerDay",
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" }
                ]
            },
            {
                when: { closure: "isActorType", type: "drone" },
                then: [
                    "clearTooltips",
                    "calculateDroneChassis",
                    "calculateDroneMods",
                    "calculateDroneEquipment",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateDroneSkills",
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    "calculateDroneSaves",
                    { closure: "calculateSaveModifiers", stackModifiers: "stackModifiers"},
                    "calculateDroneDefense",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    "calculateDamageMitigation",
                    { closure: "calculateCMDModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneHitpoints", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneResolve", stackModifiers: "stackModifiers" },
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateBaseAttackBonusModifier", stackModifiers: "stackModifiers" },
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" },
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" }
                ]
            },
            {
                when: { closure: "isActorType", type: "hazard" },
                then: ["calculateNpcXp"]
            },
            {
                when: { closure: "isActorType", type: "npc" },
                then: [
                    "clearTooltips",
                    "calculateNpcXp",
                    "calculateNpcLevel",
                    "calculateNpcDcs",
                    "calculateClasses",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    "calculateNpcAbilityValue",
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" },
                    "calculateDamageMitigation"
                ]
            },
            {
                when: { closure: "isActorType", type: "npc2" },
                then: [
                    "clearTooltips",
                    "calculateNpcXp",
                    "calculateNpcLevel",
                    "calculateNpcDcs",
                    "calculateClasses",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateNPC2Abilities", stackModifiers: "stackModifiers" },
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    "calculateNPC2ArmorClass",
                    "calculateNPC2Initiative",
                    "calculateNPC2BaseSaves",
                    "calculateNPC2BaseSkills",
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    {closure: "calculateInitiativeModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateSaveModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" },
                    "calculateDamageMitigation"
                ]
            },
            {
                when: { closure: "isActorType", type: "starship" },
                then: [
                    "calculateStarshipFrame",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    "calculateStarshipCrew",
                    "calculateStarshipCritThreshold",
                    "calculateStarshipDrift",
                    "calculateStarshipShields",
                    "calculateStarshipAblative",
                    "calculateStarshipPower",
                    "calculateStarshipSensors",
                    "calculateStarshipSpeed",
                    "calculateStarshipArmorClass",
                    "calculateStarshipTargetLock",
                    "calculateStarshipComputer",
                    "calculateStarshipCriticalStatus",
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" }
                ]
            },
            {
                when: { closure: "isActorType", type: "vehicle" },
                then: [
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    "calculateVehicleControlSkill",
                    "calculateVehicleHangar",
                    "calculateVehiclePassengers",
                    "identity",
                    { closure: "calculateActorResourcesLate", stackModifiers: "stackModifiers" }
                ]
            }
        ]
    });

    engine.add({
        name: "process-items",
        description: "Take all of the item data and process it.",
        rules: [
            "calculateSaveDC"
        ]
    });

    Hooks.callAll('sfrpg.registerRules', engine);

    console.log("Starfinder | [SETUP] Done registering rules");
}