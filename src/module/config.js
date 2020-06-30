import StarfinderModifier from "./modifiers/modifier.js";
import { StarfinderModifierType, StarfinderEffectType, StarfinderModifierTypes } from "./modifiers/types.js";

// Namespace Starfinder Configuration Values
export const STARFINDER = {};

/**
 * The set of ability scores used with the system
 * @type {Object}
 */
STARFINDER.abilities = {
    "str": "STARFINDER.AbilityStr",
    "dex": "STARFINDER.AbilityDex",
    "con": "STARFINDER.AbilityCon",
    "int": "STARFINDER.AbilityInt",
    "wis": "STARFINDER.AbilityWis",
    "cha": "STARFINDER.AbilityCha"
};

STARFINDER.acpEffectingArmorType = {
    "acp-all": "STARFINDER.ModifierACPEffectingArmorTypeAll",
    "acp-light": "STARFINDER.ModifierACPEffectingArmorTypeLight",
    "acp-heavy": "STARFINDER.ModifierACPEffectingArmorTypeHeavy",
    "acp-power": "STARFINDER.ModifierACPEffectingArmorTypePower"
};

/**
 * The set of saves used with the system
 * @type {Object}
 */
STARFINDER.saves = {
    "fort": "STARFINDER.FortitudeSave",
    "reflex": "STARFINDER.ReflexSave",
    "will": "STARFINDER.WillSave"
};

STARFINDER.saveDescriptors = {
    "negate": "STARFINDER.SaveDescriptorNegates",
    "partial": "STARFINDER.SaveDescriptorPartial",
    "half": "STARFINDER.SaveDescriptorHalf",
    "disbelieve": "STARFINDER.SaveDescriptorDisbelieve",
    "harmless": "STARFINDER.SaveDescriptorHarmless",
    "object": "STARFINDER.SaveDescriptorObject"
};

/**
 * Character alignment options
 * @type {Object}
 */
STARFINDER.alignments = {
    "lg": "STARFINDER.AlignmentLG",
    "ng": "STARFINDER.AlignmentNG",
    "cg": "STARFINDER.AlignmentCG",
    "ln": "STARFINDER.AlignmentLN",
    "tn": "STARFINDER.AlignmentTN",
    "cn": "STARFINDER.AlignmentCN",
    "le": "STARFINDER.AlignmentLE",
    "ne": "STARFINDER.AlignmentNE",
    "ce": "STARFINDER.AlignmentCE"
};

/**
 * The set of armor proficiencies which a character may have
 * @type {Object}
 */
STARFINDER.armorProficiencies = {
    "lgt": "STARFINDER.ArmorProficiencyLight",
    "hvy": "STARFINDER.ArmorProficiencyHeavy",
    "pwr": "STARFINDER.ArmorProficiencyPower",
    "shl": "STARFINDER.ArmorProficiencyShields"
};

/**
 * The set of weapons proficiencies which a character may have
 * @type {Object}
 */
STARFINDER.weaponProficiencies = {
    "bmelee": "STARFINDER.WeaponProficiencyBasicMelee",
    "amelee": "STARFINDER.WeaponProficiencyAdvMelee",
    "sarms": "STARFINDER.WeaponProficiencySmallArms",
    "larms": "STARFINDER.WeaponProficiencyLongArms",
    "hweap": "STARFINDER.WeaponProficiencyHeavy",
    "snipe": "STARFINDER.WeaponProficiencySniper",
    "gren": "STARFINDER.WeaponProficiencyGrenades",
    "spec": "STARFINDER.WeaponProficiencySpecial"
};

/**
 * This describes the ways that an ability can be cativated
 * @type {Object}
 */
STARFINDER.abilityActivationTypes = {
    "none": "STARFINDER.AbilityActivationTypesNone",
    "action": "STARFINDER.AbilityActivationTypesStandard",
    "move": "STARFINDER.AbilityActivationTypesMove",
    "swift": "STARFINDER.AbilityActivationTypesSwift",
    "full": "STARFINDER.AbilityActivationTypesFull",
    "reaction": "STARFINDER.AbilityActivationTypesReaction",
    "other": "STARFINDER.AbilityActivationTypesOther",
    "day": "STARFINDER.AbilityActivationTypesDay",
    "hour": "STARFINDER.AbilityActivationTypesHour",
    "min": "STARFINDER.AbilityActivationTypesMinute",
    "special": "STARFINDER.AbilityActivationTypesSpecial"
};

STARFINDER.skillProficiencyLevels = {
    0: "",
    3: "STARFINDER.SkillProficiencyLevelClassSkill"
};

/**
 * The valid currency types in Starfinder
 * @type {Object}
 */
STARFINDER.currencies = {
    "credit": "STARFINDER.Credits",
    "upb": "STARFINDER.UPBs"
};

// Damage Types
STARFINDER.energyDamageTypes = {
    "acid": "STARFINDER.DamageTypesAcid",
    "cold": "STARFINDER.DamageTypesCold",
    "electricity": "STARFINDER.DamageTypesElectricity",
    "fire": "STARFINDER.DamageTypesFire",
    "sonic": "STARFINDER.DamageTypesSonic"
};

STARFINDER.kineticDamageTypes = {
    "bludgeoning": "STARFINDER.DamageTypesBludgeoning",
    "piercing": "STARFINDER.DamageTypesPiercing",
    "slashing": "STARFINDER.DamageTypesSlashing"
};

STARFINDER.damageTypes = {
    ...STARFINDER.energyDamageTypes,
    ...STARFINDER.kineticDamageTypes
};

STARFINDER.weaponDamageTypes = {
    "acid": "STARFINDER.DamageTypesAcid",
    "acid+bludgeoning": "STARFINDER.DamageTypesAcidAndBludgeoning",
    "acid+fire": "STARFINDER.DamageTypesAcidAndFire",
    "acid+piercing": "STARFINDER.DamageTypesAcidAndPiercing",
    "acid+slashing": "STARFINDER.DamageTypesAcidAndSlashing",
    "acid|fire": "STARFINDER.DamageTypesAcidOrFire",
    "acid|slashing": "STARFINDER.DamageTypesAcidOrSlashing",    
    "cold": "STARFINDER.DamageTypesCold",
    "cold+piercing": "STARFINDER.DamageTypesColdAndPiercing",
    "cold|fire": "STARFINDER.DamageTypesColdOrFire",
    "electricity": "STARFINDER.DamageTypesElectricity",
    "electricity+fire": "STARFINDER.DamageTypesElectricityAndFire",
    "electricity+piercing": "STARFINDER.DamageTypesElectricityAndPiercing",
    "electricity+slashing": "STARFINDER.DamageTypesElectricityAndSlashing",
    "fire": "STARFINDER.DamageTypesFire",
    "fire+piercing": "STARFINDER.DamageTypesFireAndPiercing",
    "fire+slashing": "STARFINDER.DamageTypesFireAndSlashing",
    "fire|slashing": "STARFINDER.DamageTypesFireOrSlashing",
    "fire|sonic": "STARFINDER.DamageTypesFireOrSonic",
    "sonic": "STARFINDER.DamageTypesSonic",
    "bludgeoning": "STARFINDER.DamageTypesBludgeoning",
    "bludgeoning+cold": "STARFINDER.DamageTypesBludgeoningAndCold",
    "bludgeoning+electricity": "STARFINDER.DamageTypesBludgeoningAndElectricity",
    "bludgeoning+fire": "STARFINDER.DamageTypesBludgeoningAndFire",
    "bludgeoning+sonic": "STARFINDER.DamageTypesBludgeoningAndSonic",
    "piercing": "STARFINDER.DamageTypesPiercing",
    "piercing+sonic": "STARFINDER.DamageTypesPiercingAndSonic",
    "slashing": "STARFINDER.DamageTypesSlashing",
    "slashing+piercing": "STARFINDER.DamageTypesSlashingAndPiercing",
    "slashing+sonic": "STARFINDER.DamageTypesSlashingAndSonic",
};

STARFINDER.distanceUnits = {
    "none": "STARFINDER.None",
    "personal": "STARFINDER.Personal",
    "touch": "STARFINDER.Touch",
    "close": "STARFINDER.Close",
    "medium": "STARFINDER.Medium",
    "long": "STARFINDER.Long",
    "planetary": "STARFINDER.Planetary",
    "system": "STARFINDER.SystemWide",
    "plane": "STARFINDER.Plane",
    "unlimited": "STARFINDER.Unlimited",
    "ft": "STARFINDER.Ft",
    "mi": "STARFINDER.Mi",
    "spec": "STARFINDER.Special",
    "any": "STARFINDER.DistAny"
};

STARFINDER.targetTypes = {};

STARFINDER.timePeriods = {};

// Healing types
STARFINDER.healingTypes = {
    "healing": "STARFINDER.HealingTypesHealing"
};

STARFINDER.spellPreparationModes = {
    "always": "STARFINDER.SpellPreparationModesAlways",
    "innate": "STARFINDER.SpellPreparationModesInnate"
};

STARFINDER.limitedUsePeriods = {
    "sr": "STARFINDER.LimitedUsePeriodsShort",
    "lr": "STARFINDER.LimitedUsePeriodsLong",
    "day": "STARFINDER.LimitedUsePeriodsDay",
    "charges": "STARFINDER.LimitedUsePeriodsCharges"
};

STARFINDER.senses = {
    "bs": "STARFINDER.SenesBS",
    "bl": "STARFINDER.SenesBL",
    "dark": "STARFINDER.SenesDark",
    "llv": "STARFINDER.SenesLLV",
    "st": "STARFINDER.SensesST"
};

STARFINDER.skills = {
    "acr": "STARFINDER.SkillAcr",
    "ath": "STARFINDER.SkillAth",
    "blu": "STARFINDER.SkillBlu",
    "com": "STARFINDER.SkillCom",
    "cul": "STARFINDER.SkillCul",
    "dip": "STARFINDER.SkillDip",
    "dis": "STARFINDER.SkillDis",
    "eng": "STARFINDER.SkillEng",
    "int": "STARFINDER.SkillInt",
    "lsc": "STARFINDER.SkillLsc",
    "med": "STARFINDER.SkillMed",
    "mys": "STARFINDER.SkillMys",
    "per": "STARFINDER.SkillPer",
    "pro": "STARFINDER.SkillPro",
    "phs": "STARFINDER.SkillPsc",
    "pil": "STARFINDER.SkillPil",
    "sen": "STARFINDER.SkillSen",
    "sle": "STARFINDER.SkillSle",
    "ste": "STARFINDER.SkillSte",
    "sur": "STARFINDER.SkillSur"
};

// Weapon Types
STARFINDER.weaponTypes = {
    "basicM": "STARFINDER.WeaponTypesBasicMelee",
    "advancedM": "STARFINDER.WeaponTypesAdvMelee",
    "smallA": "STARFINDER.WeaponTypesSmallArms",
    "longA": "STARFINDER.WeaponTypesLongArms",
    "heavy": "STARFINDER.WeaponTypesHeavy",
    "sniper": "STARFINDER.WeaponTypesSniper",
    "grenade": "STARFINDER.WeaponTypesGrenades",
    "special": "STARFINDER.WeaponTypesSpecial",
    "solarian": "STARFINDER.WeaponTypesSolarian"
};

// Weapons sub categories
STARFINDER.weaponCategories = {
    "cryo": "STARFINDER.WeaponCategoriesCryo",
    "flame": "STARFINDER.WeaponCategoriesFlame",
    "laser": "STARFINDER.WeaponCategoriesLaser",
    "plasma": "STARFINDER.WeaponCategoriesPlasma",
    "projectile": "STARFINDER.WeaponCategoriesProjectile",
    "shock": "STARFINDER.WeaponCategoriesShock",
    "sonic": "STARFINDER.WeaponCategoriesSonic",
    "uncategorized": "STARFINDER.WeaponCategoriesUncategorized"
};

// Weapon Properties
STARFINDER.weaponProperties = {
    "one": "STARFINDER.WeaponPropertiesOneHanded",
    "two": "STARFINDER.WeaponPropertiesTwoHanded",
    "amm": "STARFINDER.WeaponPropertiesAmmunition",
    "aeon": "STARFINDER.WeaponPropertiesAeon",
    "analog": "STARFINDER.WeaponPropertiesAnalog",
    "antibiological": "STARFINDER.WeaponPropertiesAntibiological",
    "archaic": "STARFINDER.WeaponPropertiesArchaic",
    "aurora": "STARFINDER.WeaponPropertiesAurora",
    "automatic": "STARFINDER.WeaponPropertiesAutomatic",
    "blast": "STARFINDER.WeaponPropertiesBlast",
    "block": "STARFINDER.WeaponPropertiesBlock",
    "boost": "STARFINDER.WeaponPropertiesBoost",
    "breach": "STARFINDER.WeaponPropertiesBreach",
    "breakdown": "STARFINDER.WeaponPropertiesBreakdown",
    "bright": "STARFINDER.WeaponPropertiesBright",
    "cluster": "STARFINDER.WeaponPropertiesCluster",
    "conceal": "STARFINDER.WeaponsPropertiesConceal",
    "deconstruct": "STARFINDER.WeaponPropertiesDeconstruct",
    "deflect": "STARFINDER.WeaponPropertiesDeflect",
    "disarm": "STARFINDER.WeaponPropertiesDisarm",
    "double": "STARFINDER.WeaponPropertiesDouble",
    "drainCharge": "STARFINDER.WeaponPropertiesDrainCharge",
    "echo": "STARFINDER.WeaponPropertiesEcho",
    "entangle": "STARFINDER.WeaponPropertiesEntangle",
    "explode": "STARFINDER.WeaponPropertiesExplode",
    "extinguish": "STARFINDER.WeaponPropertiesExtinguish",
    "feint": "STARFINDER.WeaponPropertiesFeint",
    "fiery": "STARFINDER.WeaponPropertiesFiery",
    "firstArc": "STARFINDER.WeaponPropertiesFirstArc",
    "flexibleLine": "STARFINDER.WeaponPropertiesFlexibleLine",
    "force": "STARFINDER.WeaponPropertiesForce",
    "freeHands": "STARFINDER.WeaponPropertiesFreeHands",
    "fueled": "STARFINDER.WeaponPropertiesFueled",
    "grapple": "STARFINDER.WeaponPropertiesGrapple",
    "gravitation": "STARFINDER.WeaponPropertiesGravitation",
    "guided": "STARFINDER.WeaponPropertiesGuided",
    "harrying": "STARFINDER.WeaponPropertiesHarrying",
    "holyWater": "STARFINDER.WeaponPropertiesHolyWater",
    "ignite": "STARFINDER.WeaponPropertiesIgnite",
    "indirect": "STARFINDER.WeaponPropertiesIndirect",
    "injection": "STARFINDER.WeaponPropertiesInjection",
    "integrated": "STARFINDER.WeaponPropertiesIntegrated",
    "line": "STARFINDER.WeaponPropertiesLine",
    "living": "STARFINDER.WeaponPropertiesLiving",
    "lockdown": "STARFINDER.WeaponPropertiesLockdown",
    "mind-affecting": "STARFINDER.WeaponPropertiesMindAffecting",
    "mine": "STARFINDER.WeaponPropertiesMine",
    "mire": "STARFINDER.WeaponPropertiesMire",
    "modal": "STARFINDER.WeaponPropertiesModal",
    "necrotic": "STARFINDER.WeaponPropertiesNecrotic",
    "nonlethal": "STARFINDER.WeaponPropertiesNonlethal",
    "operative": "STARFINDER.WeaponPropertiesOperative",
    "penetrating": "STARFINDER.WeaponPropertiesPenetrating",
    "polarize": "STARFINDER.WeaponPropertiesPolarize",
    "polymorphic": "STARFINDER.WeaponPropertiesPolymorphic",
    "powered": "STARFINDER.WeaponPropertiesPowered",
    "professional": "STARFINDER.WeaponPropertiesProfessional",
    "punchGun": "STARFINDER.WeaponPropertiesPunchGun",
    "qreload": "STARFINDER.WeaponPropertiesQuickReload",
    "radioactive": "STARFINDER.WeaponPropertiesRadioactive",
    "reach": "STARFINDER.WeaponPropertiesReach",
    "recall": "STARFINDER.WeaponPropertiesRecall",
    "relic": "STARFINDER.WeaponPropertiesRelic",
    "reposition": "STARFINDER.WeaponPropertiesReposition",
    "shape": "STARFINDER.WeaponPropertiesShape",
    "shells": "STARFINDER.WeaponPropertiesShells",
    "shield": "STARFINDER.WeaponPropertiesShield",
    "sniper": "STARFINDER.WeaponPropertiesSniper",
    "stun": "STARFINDER.WeaponPropertiesStun",
    "subtle": "STARFINDER.WeaponPropertiesSubtle",
    "sunder": "STARFINDER.WeaponPropertiesSunder",
    "swarm": "STARFINDER.WeaponPropertiesSwarm",
    "tail": "STARFINDER.WeaponPropertiesTail",
    "teleportive": "STARFINDER.WeaponPropertiesTeleportive",
    "thought": "STARFINDER.WeaponPropertiesThought",
    "throttle": "STARFINDER.WeaponPropertiesThrottle",
    "thrown": "STARFINDER.WeaponPropertiesThrown",
    "trip": "STARFINDER.WeaponPropertiesTrip",
    "underwater": "STARFINDER.WeaponPropertiesUnderwater",
    "unwieldy": "STARFINDER.WeaponPropertiesUnwieldy",
    "variantBoost": "STARFINDER.WeaponPropertiesVariantBoost",
    "wideLine": "STARFINDER.WeaponPropertiesWideLine"
};

STARFINDER.spellAreaShapes = {
    "": "",
    "cone": "STARFINDER.SpellAreaShapesCone",
    "cylinder": "STARFINDER.SpellAreaShapesCylinder",
    "line": "STARFINDER.SpellAreaShapesLine",
    "sphere": "STARFINDER.SpellAreaShapesSphere",
    "shapable": "STARFINDER.SpellAreaShapesShapable",
    "other": "STARFINDER.SpellAreaShapesOther"
};

STARFINDER.spellAreaEffects = {
    "": "",
    "burst": "Burst",
    "emanation": "Emanation",
    "spread": "Spread"
}

// Weapon special abilities
STARFINDER.weaponSpecial = {
    "analog": "Analog",
    "archaic": "Archaic",
    "auto": "Automatic",
    "blast": "Blast",
    "block": "Block",
    "boost": "Boost",
    "bright": "Bright",
    "disarm": "Disarm",
    "entangle": "Entangle",
    "exploade": "Explode",
    "injection": "Injection",
    "line": "Line",
    "nonlethal": "Nonlethal",
    "operative": "Operative",
    "penetrating": "Penetrating",
    "powered": "Powered",
    "quickReload": "Quick Reload",
    "reach": "Reach",
    "sniper": "Sniper",
    "stun": "Stun",
    "thrown": "Thrown",
    "trip": "Trip",
    "unwieldy": "Unwieldy"
};

// Weapon critical hit effects
STARFINDER.weaponCriticalHitEffects = {
    "arc": "Arc",
    "bleed": "Bleed",
    "burn": "Burn",
    "corrode": "Corrode",
    "deafen": "Deafen",
    "injection": "Injection DC + 2",
    "knockdown": "Knockdown",
    "severeWound": "Severe Wound",
    "staggered": "Staggered",
    "stunned": "Stunned",
    "wound": "Wound"
};

// Equipment types
STARFINDER.armorTypes = {
    "light": "Light Armor",
    "heavy": "Heavy Armor",
    "power": "Power Armor",
    "shield": "Shields"
};

STARFINDER.equipmentTypes = STARFINDER.armorTypes;

// Spell Schools
STARFINDER.spellSchools = {
    "abj": "Abjuration",
    "con": "Conjuration",
    "div": "Divination",
    "enc": "Enchantment",
    "evo": "Evocation",
    "ill": "Illusion",
    "nec": "Necromancy",
    "trs": "Transmutation"
};

// Spell Levels
STARFINDER.spellLevels = {
    0: "0 Level",
    1: "1st Level",
    2: "2nd Level",
    3: "3rd Level",
    4: "4th Level",
    5: "5th Level",
    6: "6th Level"
};

// Feat types
STARFINDER.featTypes = {
    "general": "General Feats",
    "combat": "Combat Feats"
};

/**
 * The avaialbe sizes for an Actor
 * @type {Object}
 */
STARFINDER.actorSizes = {
    "fine": "STARFINDER.SizeFine",
    "diminutive": "STARFINDER.SizeDim",
    "tiny": "STARFINDER.SizeTiny",
    "small": "STARFINDER.SizeSmall",
    "medium": "STARFINDER.SizeMedium",
    "large": "STARFINDER.SizeLarge",
    "huge": "STARFINDER.SizeHuge",
    "gargantuan": "STARFINDER.SizeGargantuan",
    "colossal": "STARFINDER.SizeColossal"
};

STARFINDER.starshipSizes = {
    "tiny": "STARFINDER.SizeTiny",
    "small": "STARFINDER.SizeSmall",
    "medium": "STARFINDER.SizeMedium",
    "large": "STARFINDER.SizeLarge",
    "huge": "STARFINDER.SizeHuge",
    "gargantuan": "STARFINDER.SizeGargantuan",
    "colossal": "STARFINDER.SizeColossal"
};

/**
 * The amount of space on a 5ft grid square that a 
 * token of a specific size takes.
 * @type {Object}
 */
STARFINDER.tokenSizes = {
    "fine": 1,
    "diminutive": 1,
    "tiny": 1,
    "small": 1,
    "medium": 1,
    "large": 2,
    "huge": 3,
    "gargantuan": 4,
    "colossal": 6
};

STARFINDER.allowedClasses = {
    "myst": "Mystic",
    "tech": "Technomancer",
    "wysh": "Witchwarper"
};

STARFINDER.itemActionTypes = {
    "mwak": "STARFINDER.ActionMWAK",
    "rwak": "STARFINDER.ActionRWAK",
    "msak": "STARFINDER.ActionMSAK",
    "rsak": "STARFINDER.ActionRSAK",
    "save": "STARFINDER.ActionSave",
    "heal": "STARFINDER.ActionHeal",
    "abil": "STARFINDER.ActionAbil",
    "util": "STARFINDER.ActionUtil",
    "other": "STARFINDER.ActionOther"
};

STARFINDER.conditionTypes = {
    "asleep": "STARFINDER.ConditionsAsleep",
    "bleeding": "STARFINDER.ConditionsBleeding",
    "blinded": "STARFINDER.ConditionsBlinded",
    "broken": "STARFINDER.ConditionsBroken",
    "burning": "STARFINDER.ConditionsBurning",
    "confused": "STARFINDER.ConditionsConfused",
    "cowering": "STARFINDER.ConditionsCowering",
    "dazed": "STARFINDER.ConditionsDazed",
    "dazzled": "STARFINDER.ConditionsDazzled",
    "dead": "STARFINDER.ConditionsDead",
    "deafened": "STARFINDER.ConditionsDeafened",
    "dyning": "STARFINDER.ConditionsDying",
    "encumbered": "STARFINDER.ConditionsEncumbered",
    "entangled": "STARFINDER.ConditionsEntangled",
    "exhausted": "STARFINDER.ConditionsExhausted",
    "fascinated": "STARFINDER.ConditionsFascinated",
    "fatigued": "STARFINDER.ConditionsFatigued",
    "flatfooted": "STARFINDER.ConditionsFlatFooted",
    "frightened": "STARFINDER.ConditionsFrightened",
    "grappled": "STARFINDER.ConditionsGrappled",
    "helpless": "STARFINDER.ConditionsHelpless",
    "nauseated": "STARFINDER.ConditionsNauseated",
    "offkilter": "STARFINDER.ConditionsOffKilter",
    "offtarget": "STARFINDER.ConditionsOffTarget",
    "overburdened": "STARFINDER.ConditionsOverburdened",
    "panicked": "STARFINDER.ConditionsPanicked",
    "paralyzed": "STARFINDER.ConditionsParalyzed",
    "pinned": "STARFINDER.ConditionsPinned",
    "prone": "STARFINDER.ConditionsProne",
    "shaken": "STARFINDER.ConditionsShaken",
    "sickened": "STARFINDER.ConditionsSickened",
    "stable": "STARFINDER.ConditionsStable",
    "staggered": "STARFINDER.ConditionsStaggered",
    "stunned": "STARFINDER.ConditionsStunned",
    "unconscious": "STARFINDER.ConditionsUnconscious"
};

STARFINDER.languages = {
    "abyssal": "STARFINDER.LanguagesAbyssal",
	"akiton": "STARFINDER.LanguagesAkitonian",
	"aklo": "STARFINDER.LanguagesAklo",	
	"aquan": "STARFINDER.LanguagesAquan",
	"arkanen": "STARFINDER.LanguagesArkanen",
	"auran": "STARFINDER.LanguagesAuran",
	"azlanti": "STARFINDER.LanguagesAzlanti",	
	"brethedan": "STARFINDER.LanguagesBrethedan",
	"castrovelian": "STARFINDER.LanguagesCastrovelian",
	"celestial": "STARFINDER.LanguagesCelestial",
	"common": "STARFINDER.LanguagesCommon",
	"draconic": "STARFINDER.LanguagesDraconic",
	"drow": "STARFINDER.LanguagesDrow",
	"dwarven": "STARFINDER.LanguagesDwarven",
	"elven": "STARFINDER.LanguagesElven",	
	"eoxian": "STARFINDER.LanguagesEoxian",
	"gnome": "STARFINDER.LanguagesGnome",
	"goblin": "STARFINDER.LanguagesGoblin",
	"halfling": "STARFINDER.LanguagesHalfling",
	"ignan": "STARFINDER.LanguagesIgnan",
	"infernal": "STARFINDER.LanguagesInfernal",
	"kalo": "STARFINDER.LanguagesKalo",	
	"kasatha": "STARFINDER.LanguagesKasatha",
	"Nchaki": "STARFINDER.LanguagesNchaki",
	"orc": "STARFINDER.LanguagesOrc",
	"sarcesian": "STARFINDER.LanguagesSarcesian",
	"shirren": "STARFINDER.LanguagesShirren",
	"shobhad": "STARFINDER.LanguagesShobhad",	
	"terran": "STARFINDER.LanguagesTerran",
	"triaxian": "STARFINDER.LanguagesTriaxian",
	"vercite": "STARFINDER.LanguagesVercite",
	"vesk": "STARFINDER.LanguagesVesk",
	"ysoki": "STARFINDER.LanguagesYosoki"
};

STARFINDER.augmentationTypes = {
    "cybernetic": "STARFINDER.Cybernetic",
    "biotech": "STARFINDER.Biotech",
    "magitech": "STARFINDER.Magitech",
    "necrograft": "STARFINDER.Necrograft",
    "personal": "STARFINDER.PersonalUpgrade"
};

STARFINDER.consumableTypes = {
    "serum": "Serums",
    "ampoule": "Spell Ampoules",
    "spellGem": "Spell Gems",
    "drugs": "Drugs",
    "medicne": "Medicinals",
    "poison": "Poisons"
};

STARFINDER.augmentationSytems = {
    "arm": "STARFINDER.AugArm",
    "allArms": "STARFINDER.AugAllArms",
    "brain": "STARFINDER.AugBrain",
    "ears": "STARFINDER.AugEars",
    "eyes": "STARFINDER.AugEyes",
    "foot": "STARFINDER.AugFoot",
    "allFeet": "STARFINDER.AugAllFeet",
    "hand": "STARFINDER.AugHand",
    "allHands": "STARFINDER.AugAllHands",
    "heart": "STARFINDER.AugHeart",
    "leg": "STARFINDER.AugLeg",
    "allLegs": "STARFINDER.AugAllLegs",
    "lungs": "STARFINDER.AugLungs",
    "spinal": "STARFINDER.AugSpinalColumn",
    "skin": "STARFINDER.AugSkin",
    "throat": "STARFINDER.AugThroat"
};

/*--------------------------------*
 * Starship properties and values *
 *--------------------------------*/
STARFINDER.maneuverability = {
    "clumsy": "Clumsy",
    "poor": "Poor",
    "average": "Average",
    "good": "Good",
    "perfect": "Perfect"
};

STARFINDER.powerCoreSystems = {
    // Power cores
    "micronL": "Micron Light",
    "micronH": "Micron Heavy",
    "micronU": "Micron Ultra",
    "arcusL": "Arcus Light",
    "pulseBr": "Pulse Brown",
    "pulseBl": "Pulse Black",
    "pulseWh": "Pulse White",
    "pulseGy": "Pulse Gray",
    "arcusH": "Arcus Heavy",
    "puslseGr": "Pulse Green",
    "pulseRe": "Pulse Red",
    "pulseBu": "Pulse Blue",
    "arcusUl": "Arcus Ultra",
    "arcusMax": "Arcus Maximum",
    "pulseOr": "Pulse Orange",
    "pulsePr": "Pulse Prismatic",
    "novaL": "Nova Light",
    "novaH": "Nova Heavy",
    "novaU": "Nova Ultra",
    "gateL": "Gateway Light",
    "gateH": "Gateway Heavy",
    "gateU": "Gateway Ultra"
}

STARFINDER.thrusterSystems = {
    // Thrusters
    // Tiny
    "t6": "T6 Thrusters",
    "t8": "T8 Thrusters",
    "t10": "T10 Thrusters",
    "t12": "T12 Thrusters",
    "t14": "T14 Thrusters",
    // Small
    "s6": "S6 Thrusters",
    "s8": "S8 Thrusters",
    "s10": "S10 Thrusters",
    "s12": "S12 Thrusters",
    // Medium
    "m4": "M4 Thrusters",
    "m6": "M6 Thrusters",
    "m8": "M8 Thrusters",
    "m10": "M10 Thrusters",
    "m12": "M12 Thrusters",
    // Large
    "l4": "L4 Thrusters",
    "l6": "L6 Thrusters",
    "l8": "L8 Thrusters",
    "l10": "L10 Thrusters",
    // Huge
    "h4": "H4 Thrusters",
    "h6": "H6 Thrusters",
    "h8": "H8 Thrusters",
    "h10": "H10 Thrusters",
    // Gargantuan
    "g4": "G4 Thrusters",
    "g6": "G6 Thrusters",
    "g8": "G8 Thrusters",
    // Colossal
    "c4": "C4 Thrusters",
    "c6": "C6 Thrusters",
    "c8": "C8 Thrusters"
};

STARFINDER.armorSystems = {
    "mk1": "Mk 1 armor",
    "mk2": "Mk 2 armor",
    "mk3": "Mk 3 armor",
    "mk4": "Mk 4 armor",
    "mk5": "Mk 5 armor",
    "mk6": "Mk 6 armor",
    "mk7": "Mk 7 armor",
    "mk8": "Mk 8 armor",
    "mk9": "Mk 9 armor",
    "mk10": "Mk 10 armor",
    "mk11": "Mk 11 armor",
    "mk12": "Mk 12 armor",
    "mk13": "Mk 13 armor",
    "mk14": "Mk 14 armor",
    "mk15": "Mk 15 armor"
};

STARFINDER.computerSystems = {
    "basic": "Basic Computer",
    "mk1m": "Mk 1 mononode",
    "mk1d": "Mk 1 duonode",
    "mk1tr": "Mk 1 trinode",
    "mk1te": "Mk 1 tetranode",
    "mk2m": "Mk 2 mononode",
    "mk2d": "Mk 2 duonode",
    "mk2tr": "Mk 2 trinode",
    "mk2te": "Mk 2 tetranode",
    "mk3m": "Mk 3 mononode",
    "mk3d": "Mk 3 duonode",
    "mk3tr": "Mk 3 trinode",
    "mk3te": "Mk 3 tetranode",
    "mk4m": "Mk 4 mononode",
    "mk4d": "Mk 4 duonode",
    "mk4tr": "Mk 4 trinode",
    "mk5m": "Mk 5 mononode",
    "mk5d": "Mk 5 duonode",
    "mk5tr": "Mk 5 trinode",
    "mk6m": "Mk 6 mononode",
    "mk6d": "Mk 6 duonode",
    "mk7m": "Mk 7 mononode",
    "mk7d": "Mk 7 duonode",
    "mk8m": "Mk 8 mononode",
    "mk8d": "Mk 8 duonode",
    "mk9m": "Mk 9 mononode",
    "mk9d": "Mk 9 duonode",
    "mk10m": "Mk 10 mononode",
    "mk10d": "Mk 10 duonode"
};

STARFINDER.crewQuarterSystems = {
    "common": "Common",
    "good": "Good",
    "luxurious": "Luxurious"
};

STARFINDER.defenseSystems = {
    "mk1": "Mk 1 defenses",
    "mk2": "Mk 2 defenses",
    "mk3": "Mk 3 defenses",
    "mk4": "Mk 4 defenses",
    "mk5": "Mk 5 defenses",
    "mk6": "Mk 6 defenses",
    "mk7": "Mk 7 defenses",
    "mk8": "Mk 8 defenses",
    "mk9": "Mk 9 defenses",
    "mk10": "Mk 10 defenses",
    "mk11": "Mk 11 defenses",
    "mk12": "Mk 12 defenses",
    "mk13": "Mk 13 defenses",
    "mk14": "Mk 14 defenses",
    "mk15": "Mk 15 defenses"
};

STARFINDER.driftEngineSystems = {
    "basic": "Signal Basic",
    "booster": "Signal Booster",
    "major": "Signal Major",
    "superior": "Signal Superior",
    "ultra": "Signal Ultra"
};

STARFINDER.sensorSystems = {
    "cut": "Cut-rate",
    "bushort": "Budget short-range",
    "bashort": "Basic short-range",
    "ashort": "Advanced short-range",
    "bumed": "Budget medium-range",
    "bamed": "Basic medium-range",
    "amed": "Advanced medium-range",
    "bulong": "Budget long-range",
    "balong": "Basic long-range",
    "along": "Advanced long-range"
};

STARFINDER.shieldSystems = {
    "10": "Basic Shields 10",
    "20": "Basic Shields 20",
    "30": "Basic Shields 30",
    "40": "Basic Shields 40",
    "50": "Light Shields 50",
    "60": "Light Shields 60",
    "70": "Light Shields 70",
    "80": "Light Shields 80",
    "90": "Medium Shields 90",
    "100": "Medium Shields 100",
    "120": "Medium Shields 120",
    "140": "Medium Shields 140",
    "160": "Medium Shields 160",
    "200": "Medium Shields 200",
    "240": "Heavy Shields 240",
    "280": "Heavy Shields 280",
    "320": "Heavy Shields 320",
    "360": "Heavy Shields 360",
    "420": "Heavy Shields 420",
    "480": "Heavy Shields 480",
    "540": "Superior Shields 540",
    "600": "Superior Shields 600"
};

STARFINDER.expansionBaySystems = {
    "arclab": "Arcane laboratory",
    "cargo": "Cargo hold",
    "escape": "Escape pods",
    "guest": "Guest quarters",
    "hangar": "Hangar bay",
    "life": "Life boats",
    "med": "Medical bay",
    "pass": "Passenger seating",
    "pwrHouse": "Power core housing",
    "recg": "Recreation suite (gym)",
    "rect": "Recreation suite (trivid den)",
    "hac": "Recreation suite (HAC)",
    "science": "Science lab",
    "senv": "Sealed environment chamber",
    "shuttle": "Shuttle bay",
    "smuggler": "Smuggler compartment",
    "syth": "Synthesis bay",
    "tech": "Tech workshop"
};

STARFINDER.securitySystems = {
    "antiHack": "Anti-Hacking Sytems",
    "antiPer": "Antipersonnel Weapon",
    "bio": "Biometric Locks",
    "compCounter": "Computer Countermeasures",
    "selfDestruct": "Self-Destruct System"
};

// TODO: Not currently used, but keeping it here
// for future use
STARFINDER.baseFrames = {
    "race": "Racer",
    "inter": "Interceptor",
    "fight": "Fighter",
    "shuttle": "Shuttle",
    "lfreight": "Light Freighter",
    "expl": "Explorer",
    "trans": "Transport",
    "dest": "Destroyer",
    "hfreight": "Heavy Freighter",
    "bfreight": "Bulk Freighter",
    "cruiser": "Cruiser",
    "carr": "Carrier",
    "battle": "Battleship",
    "dread": "Dreadnought"
};

// Starship Weapons
STARFINDER.starshipWeaponTypes = {
    "direct": "Direct-fire",
    "tracking": "Tracking"
};

STARFINDER.starshipWeaponClass = {
    "light": "Light",
    "heavy": "Heavy",
    "capital": "Capital"
};

STARFINDER.starshipWeaponProperties = {
    "array": "Array",
    "broad": "Broad Arc",
    "emp": "EMP",
    "irradiateL": "Irradiate (low)",
    "irradiateM": "Irradiate (medium)",
    "irradiateH": "Irradiate (high)",
    "limited": "Limited Fire",
    "line": "Line",
    "point": "Point",
    "quantum": "Quantum",
    "ripper": "Ripper",
    "tractor": "Tractor Beam",
    "vortex": "Vortex"
};

STARFINDER.starshipArcs = {
    "forward": "Forward",
    "starboard": "Starboard",
    "aft": "Aft",
    "port": "Port",
    "turret": "Turret"
};

STARFINDER.starshipWeaponRanges = {
    "short": "Short",
    "medium": "Medium",
    "long": "Long"
};

STARFINDER.starshipRoles = {
    "pilot": "Pilot",
    "captain": "Captain",
    "engineers": "Engineers",
    "gunners": "Gunners",
    "scienceOfficers": "Science Officers",
    "passengers": "Passengers"
};

// starship value maps
STARFINDER.shieldsMap = {
    "10": 10,
    "20": 20,
    "30": 30,
    "40": 40,
    "50": 50,
    "60": 60,
    "70": 70,
    "80": 80,
    "90": 90,
    "100": 100,
    "120": 120,
    "140": 140,
    "160": 160,
    "200": 200,
    "240": 240,
    "280": 280,
    "320": 320,
    "360": 360,
    "420": 420,
    "480": 480,
    "540": 540,
    "600": 600
};

STARFINDER.armorDefenseMap = {
    "mk1": 1,
    "mk2": 2,
    "mk3": 3,
    "mk4": 4,
    "mk5": 5,
    "mk6": 6,
    "mk7": 7,
    "mk8": 8,
    "mk9": 9,
    "mk10": 10,
    "mk11": 11,
    "mk12": 12,
    "mk13": 13,
    "mk14": 14,
    "mk15": 15
};

STARFINDER.thrustersMap = {
    "t6": { speed: 6, mod: 1 },
    "t8": { speed: 8, mod: 0 },
    "t10": { speed: 10, mod: 0 },
    "t12": { speed: 12, mod: -1 },
    "t14": { speed: 14, mod: -2 },
    "s6": { speed: 6, mod: 1 },
    "s8": { speed: 8, mod: 0 },
    "s10": { speed: 10, mod: 0 },
    "s12": { speed: 12, mod: -1 },
    "m4": { speed: 4, mod: 2 },
    "m6": { speed: 6, mod: 1 },
    "m8": { speed: 8, mod: 0 },
    "m10": { speed: 10, mod: 0 },
    "m12": { speed: 12, mod: -1 },
    "l4": { speed: 4, mod: 2 },
    "l6": { speed: 6, mod: 1 },
    "l8": { speed: 8, mod: 0 },
    "l10": { speed: 10, mod: 0 },
    "h4": { speed: 4, mod: 2 },
    "h6": { speed: 6, mod: 1 },
    "h8": { speed: 8, mod: 0 },
    "h10": { speed: 10, mod: 0 },
    "g4": { speed: 4, mod: 2 },
    "g6": { speed: 6, mod: 1 },
    "g8": { speed: 8, mod: 0 },
    "c4": { speed: 4, mod: 2 },
    "c6": { speed: 6, mod: 1 },
    "c8": { speed: 8, mod: 0 }
};

STARFINDER.powercoreMap = {
    "micronL": { size: ["tiny"], pcu: 50 },
    "micronH": { size: ["tiny"], pcu: 70 },
    "micronU": { size: ["tiny"], pcu: 80 },
    "arcusL": { size: ["tiny", "small"], pcu: 75 },
    "pulseBr": { size: ["tiny", "small"], pcu: 90 },
    "pulseBl": { size: ["tiny", "small"], pcu: 120 },
    "pulseWh": { size: ["tiny", "small"], pcu: 140 },
    "pulseGy": { size: ["tiny", "small", "medium"], pcu: 100 },
    "arcusH": { size: ["tiny", "small", "medium"], pcu: 130 },
    "puslseGr": { size: ["tiny", "small", "medium"], pcu: 150 },
    "pulseRe": { size: ["tiny", "small", "medium"], pcu: 175 },
    "pulseBu": { size: ["tiny", "small", "medium"], pcu: 200 },
    "arcusUl": { size: ["small", "medium", "large"], pcu: 150 },
    "arcusMax": { size: ["small", "medium", "large"], pcu: 200 },
    "pulseOr": { size: ["small", "medium", "large"], pcu: 250 },
    "pulsePr": { size: ["small", "medium", "large"], pcu: 300 },
    "novaL": { size: ["medium", "large", "huge"], pcu: 150 },
    "novaH": { size: ["medium", "large", "huge"], pcu: 200 },
    "novaU": { size: ["medium", "large", "huge"], pcu: 300 },
    "gateL": { size: ["large", "huge", "gargantuan"], pcu: 300 },
    "gateH": { size: ["large", "huge", "gargantuan"], pcu: 400 },
    "gateU": { size: ["huge", "gargantuan", "colossal"], pcu: 500 }
};

STARFINDER.driftEngineMap = {
    "basic": 1,
    "booster": 2,
    "major": 3,
    "superior": 4,
    "ultra": 5
};

STARFINDER.starshipSizeMod = {
    "tiny": 2,
    "small": 1,
    "medium": 0,
    "large": -1,
    "huge": -2,
    "gargantuan": -4,
    "colossal": -8
};

// End starship stuff

STARFINDER.vehicleSizes = {
    "diminutive": "STARFINDER.SizeDim",
    "tiny": "STARFINDER.SizeTiny",
    "small": "STARFINDER.SizeSmall",
    "medium": "STARFINDER.SizeMedium",
    "large": "STARFINDER.SizeLarge",
    "huge": "STARFINDER.SizeHuge",
    "gargantuan": "STARFINDER.SizeGargantuan",
    "colossal": "STARFINDER.SizeColossal"
};

STARFINDER.vehicleTypes = {
    "land": "Land",
    "water": "Water",
    "hover": "Hover",
    "landW": "Land and water",
    "air": "Air",
    "landA": "Land and air"
};

STARFINDER.vehicleCoverTypes = {
    "none": "None",
    "cover": "Cover",
    "soft": "Soft cover",
    "partial": "Partial cover",
    "total": "Total cover"
};

/**
 * Base Attack Bonus Progression
 */
STARFINDER.babProgression = {
    "moderate": "STARFINDER.BABProgressionModerate",
    "full": "STARFINDER.BABProgressionFull"
};

/**
 * Saving throw modifier progression
 */
STARFINDER.saveProgression = {
    "slow": "STARFINDER.SaveProgressionSlow",
    "fast": "STARFINDER.SaveProgressionFast"
};

STARFINDER.modifierTypes = {
    "ability": "STARFINDER.ModifierTypeAbility",
    "armor": "STARFINDER.ModifierTypeArmor",
    "base": "STARFINDER.ModifierTypeBase",
    "circumstance": "STARFINDER.ModifierTypeCircumstance",
    "divine": "STARFINDER.ModifierTypeDivine",
    "enhancement": "STARFINDER.ModifierTypeEnhancement",
    "insight": "STARFINDER.ModifierTypeInsight",
    "luck": "STARFINDER.ModifierTypeLuck",
    "morale": "STARFINDER.ModifierTypeMorale",
    "racial": "STARFINDER.ModifierTypeRacial",
    "untyped": "STARFINDER.ModifierTypeUntyped"
};

STARFINDER.modifierEffectTypes = {
    "ac": "STARFINDER.ModifierEffectTypeAC",
    "cmd": "STARFINDER.ModifierEffectTypeCMD",
    "acp": "STARFINDER.ModifierEffectTypeACP",
    "initiative": "STARFINDER.ModifierEffectTypeInit",
    "ability-skills": "STARFINDER.ModifierEffectTypeAbilitySkills",
    "skill": "STARFINDER.ModifierEffectTypeSkill",
    "all-skills": "STARFINDER.ModifierEffectTypeAllSkills",
    "saves": "STARFINDER.ModifierEffectTypeSaves",
    "save": "STARFINDER.ModifierEffectTypeSave"
};

STARFINDER.modifierType = {
    "constant": "STARFINDER.ModifierTypeConstant",
    "formula": "STARFINDER.ModifierTypeFormula"
};

STARFINDER.modifierArmorClassAffectedValues = {
    "both": "STARFINDER.ModifierArmorClassBoth",
    "eac": "STARFINDER.EnergyArmorClass",
    "kac": "STARFINDER.KineticArmorClass"
};

STARFINDER.CHARACTER_EXP_LEVELS = [
    0, 1300, 3300, 6000, 10000, 15000, 23000, 34000, 50000, 71000,
    105000, 145000, 210000, 295000, 425000, 600000, 850000, 1200000,
    1700000, 2400000
];

STARFINDER.CR_EXP_LEVELS = [
    50, 400, 600, 800, 1200, 1600, 2400, 3200, 4800,
    6400, 9600, 12800, 19200, 25600, 38400, 51200, 76800, 102400,
    153600, 204800, 307200, 409600, 614400, 819200, 1228800, 1638400
];

STARFINDER.statusEffectIcons = [
    "systems/starfinder/icons/conditions/asleep.png",
    "systems/starfinder/icons/conditions/bleeding.png",
    "systems/starfinder/icons/conditions/blinded.png",
    "systems/starfinder/icons/conditions/broken.png",
    "systems/starfinder/icons/conditions/burning.png",
    "systems/starfinder/icons/conditions/confused.png",
    "systems/starfinder/icons/conditions/cowering.png",
    "systems/starfinder/icons/conditions/dazed.png",
    "systems/starfinder/icons/conditions/dazzled.png",
    "systems/starfinder/icons/conditions/dead.png",
    "systems/starfinder/icons/conditions/deafened.png",
    "systems/starfinder/icons/conditions/dying.png",
    "systems/starfinder/icons/conditions/encumbered.png",
    "systems/starfinder/icons/conditions/entangled.png",
    "systems/starfinder/icons/conditions/exhausted.png",
    "systems/starfinder/icons/conditions/fascinated.png",
    "systems/starfinder/icons/conditions/fatigued.png",
    "systems/starfinder/icons/conditions/flatfooted.png",
    "systems/starfinder/icons/conditions/frightened.png",
    "systems/starfinder/icons/conditions/grappled.png",
    "systems/starfinder/icons/conditions/helpless.png",
    "systems/starfinder/icons/conditions/nauseated.png",
    "systems/starfinder/icons/conditions/offkilter.png",
    "systems/starfinder/icons/conditions/offtarget.png",
    "systems/starfinder/icons/conditions/overburdened.png",
    "systems/starfinder/icons/conditions/panicked.png",
    "systems/starfinder/icons/conditions/paralyzed.png",
    "systems/starfinder/icons/conditions/pinned.png",
    "systems/starfinder/icons/conditions/prone.png",
    "systems/starfinder/icons/conditions/shaken.png",
    "systems/starfinder/icons/conditions/sickened.png",
    "systems/starfinder/icons/conditions/staggered.png",
    "systems/starfinder/icons/conditions/stable.png",
    "systems/starfinder/icons/conditions/stunned.png",
    "systems/starfinder/icons/conditions/unconscious.png"
];

STARFINDER.statusEffectIconMapping = {
    "asleep": "systems/starfinder/icons/conditions/asleep.png",
    "bleeding": "systems/starfinder/icons/conditions/bleeding.png",
    "blinded": "systems/starfinder/icons/conditions/blinded.png",
    "broken": "systems/starfinder/icons/conditions/broken.png",
    "burning": "systems/starfinder/icons/conditions/burning.png",
    "confused": "systems/starfinder/icons/conditions/confused.png",
    "cowering": "systems/starfinder/icons/conditions/cowering.png",
    "dazed": "systems/starfinder/icons/conditions/dazed.png",
    "dazzled": "systems/starfinder/icons/conditions/dazzled.png",
    "dead": "systems/starfinder/icons/conditions/dead.png",
    "deafened": "systems/starfinder/icons/conditions/deafened.png",
    "dyning": "systems/starfinder/icons/conditions/dying.png",
    "encumbered": "systems/starfinder/icons/conditions/encumbered.png",
    "entangled": "systems/starfinder/icons/conditions/entangled.png",
    "exhausted": "systems/starfinder/icons/conditions/exhausted.png",
    "fascinated": "systems/starfinder/icons/conditions/fascinated.png",
    "fatigued": "systems/starfinder/icons/conditions/fatigued.png",
    "flatfooted": "systems/starfinder/icons/conditions/flatfooted.png",
    "frightened": "systems/starfinder/icons/conditions/frightened.png",
    "grappled": "systems/starfinder/icons/conditions/grappled.png",
    "helpless": "systems/starfinder/icons/conditions/helpless.png",
    "nauseated": "systems/starfinder/icons/conditions/nauseated.png",
    "offkilter": "systems/starfinder/icons/conditions/offkilter.png",
    "offtarget": "systems/starfinder/icons/conditions/offtarget.png",
    "overburdened": "systems/starfinder/icons/conditions/overburdened.png",
    "panicked": "systems/starfinder/icons/conditions/panicked.png",
    "paralyzed": "systems/starfinder/icons/conditions/paralyzed.png",
    "pinned": "systems/starfinder/icons/conditions/pinned.png",
    "prone": "systems/starfinder/icons/conditions/prone.png",
    "shaken": "systems/starfinder/icons/conditions/shaken.png",
    "sickened": "systems/starfinder/icons/conditions/sickened.png",
    "stable": "systems/starfinder/icons/conditions/stable.png",
    "staggered": "systems/starfinder/icons/conditions/staggered.png",
    "stunned": "systems/starfinder/icons/conditions/stunned.png",
    "unconscious": "systems/starfinder/icons/conditions/unconscious.png"
};

STARFINDER.conditions = {
    "asleep": {
        modifiers: [],
        tooltip: "<strong>Asleep</strong><br><br>You take a -10 penalty to Perception checks to notice things."
    },
    "bleeding": {
        modifiers: [],
        tooltip: "<strong>Bleeding</strong><br><br>You take the listed damage at the beginning of your turn."
    },
    "blinded": {
        modifiers: [],
        tooltip: "<strong>Blinded</strong><br><br>You're flat-footed, you take a -4 penalty to most Str- and Dex-based skill checks and opposed Perception checks, you automatically fail Perception checks based on sight, opponents have total concealment against you, and you must succeed at a DC 10 Acrobatics check to move faster than half speed or else fall prone."
    },
    "broken": {
        modifiers: [],
        tooltip: "<strong>Broken</strong><br><br><strong>Weapon:</strong> attack and damage rolls take a -2 penalty and can't deal extra effects on a critical hit;<br> <strong>Armor:</strong> AC bonuses are halved and the armor check penalty is doubled;<br> <strong>Vehicle:</strong> -2 penalty to AC, collision DC, and Piloting modifier, and it halves its full speed and MPH;<br> <strong>Tool or tech that provides bonuses:</strong> bonuses are halved."
    },
    "burning": {
        modifiers: [],
        tooltip: "<strong>Burning</strong><br><br>You take the listed fire damage each round, and you must be extinguished to end the condition."
    },
    "confused": {
        modifiers: [],
        tooltip: "<strong>Confused</strong><br><br>You treat all creatures as enemies, and you must roll on the table to determine your actions."
    },
    "cowering": {
        modifiers: [],
        tooltip: "<strong>Cowering</strong><br><br>You're flat-footed and can take no actions."
    },
    "dazed": {
        modifiers: [],
        tooltip: "<strong>Dazed</strong><br><br>You can take no actions."
    },
    "dazzled": {
        modifiers: [],
        tooltip: "<strong>Dazzled</strong><br><br>You take a -1 penalty to attack rolls and sight-based Perception checks."
    },
    "dead": {
        modifiers: [],
        tooltip: "<strong>Dead</strong><br><br>Your soul leaves your body, you can't act in any way, and you can't benefit from normal or magical healing."
    },
    "deafened": {
        modifiers: [],
        tooltip: "<strong>Deafened</strong><br><br>You take a -4 penalty to initiative checks and opposed Perception checks, and you automatically fail sound-based Perception checks."
    },
    "dyning": {
        modifiers: [],
        tooltip: "<strong>Dying</strong><br><br>You're unconscious, you can take no actions, and you must stabilize or lose Resolve Points and potentially die."
    },
    "encumbered": {
        modifiers: [],
        tooltip: "<strong>Encumbered</strong><br><br>Speeds are reduced by 10 feet, maximum Dex bonus to AC is reduced to +2, and you take a -5 penalty to Str- and Dex-based checks."
    },
    "entangled": {
        modifiers: [],
        tooltip: "<strong>Entangled</strong><br><br>You move at half speed; you cannot run or charge; and you take a -2 penalty to AC, attack rolls, Reflex saves, initiative checks, and Dex-based skill and ability checks."
    },
    "exhausted": {
        modifiers: [],
        tooltip: "<strong>Exhausted</strong><br><br>You move at half speed; you cannot run or charge; you take a -3 penalty to AC, attack rolls, melee damage rolls, Reflex saves, initiative checks, and Str- and Dex-based skill and ability checks; and you reduce your encumbered limit by 3 bulk."
    },
    "fascinated": {
        modifiers: [],
        tooltip: "<strong>Fascinated</strong><br><br>You must pay attention to the fascinating effect and take a -4 penalty to skill checks made as reactions."
    },
    "fatigued": {
        modifiers: [],
        tooltip: "<strong>Fatigued</strong><br><br>You cannot run or charge; you take a -1 penalty to AC, attack rolls, melee damage rolls, Reflex saves, initiative checks, and Str- and Dex-based skill and ability checks; and you reduce your encumbered limit by 1 bulk."
    },
    "flatfooted": {
        modifiers: [],
        tooltip: "<strong>Flat-Footed</strong><br><br>You take a -2 penalty to AC, and you cannot take reactions or make attacks of opportunity."
    },
    "frightened": {
        modifiers: [],
        tooltip: "<strong>Frightened</strong><br><br>You must flee or fight, and you take a -2 penalty to ability checks, attack rolls, saving throws, and skill checks."
    },
    "grappled": {
        modifiers: [],
        tooltip: "<strong>Grappled</strong><br><br>You cannot move or take two-handed actions; you take a -2 penalty to AC, most attack rolls, Reflex saves, initiative checks, and Dex-based skill and ability checks; and you cannot make attacks of opportunity."
    },
    "helpless": {
        modifiers: [],
        tooltip: "<strong>Helpless</strong><br><br>Your Dex modifier is -5, and melee attacks against you gain a +4 bonus."
    },
    "nauseated": {
        modifiers: [],
        tooltip: "<strong>Nauseated</strong><br><br>You're unable to attack, cast spells, or concentrate on spells, and the only action you can take is a single move action per turn."
    },
    "offkilter": {
        modifiers: [],
        tooltip: "<strong>Off-kilter</strong><br><br>You can't take move actions except to right yourself, you take a -2 penalty to attacks, and you're flat-footed."
    },
    "offtarget": {
        modifiers: [],
        tooltip: "<strong>Off-target</strong><br><br>You take a -2 penalty to attack rolls."
    },
    "overburdened": {
        modifiers: [],
        tooltip: "<strong>Overburdened</strong><br><br>Speeds are reduced to 5 feet; maximum Dex bonus to AC is reduced to +0; and you take a -5 penalty to Str- and Dex-based checks."
    },
    "panicked": {
        modifiers: [],
        tooltip: "<strong>Panicked</strong><br><br><ul><li>You drop all held items</li><li>You flee at top speed</li><li>You cannot take other actions</li><li>You take a -2 penalty to ability checks, saving throws, and skill checks</li><li>And you cower if cornered</li></ul>"
    },
    "paralyzed": {
        modifiers: [],
        tooltip: "<strong>Paralyzed</strong><br><br>Your Dex modifier is -5, and you cannot move but can take mental actions."
    },
    "pinned": {
        modifiers: [],
        tooltip: "<strong>Pinned</strong><br><br>You cannot move, you're flat-footed, and you take penalties to the same attributes as for grappled but the penalty is -4."
    },
    "prone": {
        modifiers: [],
        tooltip: "<strong>Prone</strong><br><br>You take a -4 penalty to melee attacks, a +4 bonus to AC against ranged attacks, and a -4 penalty to AC against melee attacks."
    },
    "shaken": {
        modifiers: [],
        tooltip: "<strong>Skaken</strong><br><br>You take a -2 penalty to ability checks, attack rolls, saving throws, and skill checks."
    },
    "sickened": {
        modifiers: [],
        tooltip: "<strong>Sickened</strong><br><br>You take a -2 penalty to ability checks, attack rolls, weapon damage rolls, saving throws, and skill checks."
    },
    "stable": {
        modifiers: [],
        tooltip: "<strong>Stable</strong><br><br>You're no longer dying, but you are still unconscious."
    },
    "staggered": {
        modifiers: [],
        tooltip: "<strong>Staggered</strong><br><br>You can take only a single move or standard action each round and can't take reactions, but you can take swift actions as normal."
    },
    "stunned": {
        modifiers: [],
        tooltip: "<strong>Stunned</strong><br><br>You drop everything held, you can't take actions, and you're flat-footed."
    },
    "unconscious": {
        modifiers: [],
        tooltip: "<strong>Unconscious</strong><br><br>You're knocked out and helpless."
    }
};

STARFINDER.allowedClasses = {
    "myst": "Mystic",
    "tech": "Technomancer",
    "wysh": "Witchwarper"
};

STARFINDER.characterFlags = {
    "improvedInititive": {
        name: "STARFINDER.ImprovedInitiativeLabel",
        hint: "STARFINDER.ImprovedInitiativeHint",
        section: "STARFINDER.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "greatFortitude": {
        name: "STARFINDER.GreatFortitudeLabel",
        hint: "STARFINDER.GreatFortitudeHint",
        section: "STARFINDER.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "ironWill": {
        name: "STARFINDER.IronWillLabel",
        hint: "STARFINDER.IronWillHint",
        section: "STARFINDER.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "lightningReflexes": {
        name: "STARFINDER.LightningReflexesLabel",
        hint: "STARFINDER.LightningReflexesHint",
        section: "STARFINDER.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "flatAffect": {
        name: "Flat Affect",
        hint: "You take a -2 penalty to Sense Motive checks, but the DCs of Sense Motive checks attempted against you increase by 2.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "historian": {
        name: "Historian",
        hint: "Due to your in-depth historical training and the wide-ranging academic background knowledge you possess, you receive a +2 racial bonus to Culture checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "naturalGrace": {
        name: "Natural Grace",
        hint: "You recieve a +2 racial bonus to Acrobatics and Athletics checks",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "culturalFascination": {
        name: "Cultural Fascination",
        hint: "You recieve a +2 racial bonus to Culture and Diplomacy checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "armorSavant": {
        name: "Armor Savant",
        hint: "When wearing armor, you gain a +1 racial bonus to AC. When you're wearing heavy armor, your armor check penalty is 1 less severe than normal.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "scrounger": {
        name: "Scrounger",
        hint: "You receive a +2 racial bonus to Engineering, Stealth, and Survival checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "elvenMagic": {
        name: "Elven Magic",
        hint: "You receive a +2 racial bonus to caster level checks to overcome spell resistance. In addition, you receive a +2 racial bonus to Mysticism skill checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "keenSenses": {
        name: "Keen Senses",
        hint: "You receive a +2 racial bonus to Perception skill checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "curious": {
        name: "Curious",
        hint: "You receive a +2 racial bonus to Culture checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "intimidating": {
        name: "Intimidating",
        hint: "You receive a +2 racial bonus to Intimidate skill checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "selfSufficient": {
        name: "Self-Sufficient",
        hint: "You receive a +2 racial bonus to Survival skill checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "halflingLuck": {
        name: "Halfling Luck",
        hint: "Halflings receive a +1 racial bonus to all saving throws.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "sneaky": {
        name: "Sneaky",
        hint: "You receive a +2 racial bonus to Stealth checks",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "sureFooted": {
        name: "Sure-Footed",
        hint: "You receive a +2 racial bonus to Acrobatics and Athletics skill checks.",
        section: "STARFINDER.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "rapidResponse": {
        name: "Rapid Response",
        hint: "You gain +4 bonus to initiative checks and increase your land speed by 10 feet.",
        section: "STARFINDER.CharacterFlagsSectionClassFeatures",
        type: Boolean
    },
    "solarianAttunement": {
        name: "Solarian Attunement",
        hint: "You can enabled the management of attenument inside the combat tracker.",
        section: "STARFINDER.CharacterFlagsSectionClassFeatures",
        type: Boolean
    }/*, //Disable temporary the time than Vanguard and Qi Soldier mechanical system be ready
    "vanguardEntropy": {
        name: "Vanguard's Entropy Points",
        hint: "You can enabled the management of Entropy Points inside the combat tracker.",
        section: "STARFINDER.CharacterFlagsSectionClassFeatures",
        type: Boolean
    },
    "soldierKi": {
        name: "Soldier Ki Points",
        hint: "You can enabled the management of Solider Ki Point inside the combat tracker.",
        section: "STARFINDER.CharacterFlagsSectionClassFeatures",
        type: Boolean
    }*/
};

/**
 * Saving throw modifier progression
 */
STARFINDER.counterClassesLabel = {
    "soldierKi": "STARFINDER.CounterClassesKiSoldier",
    "vanguardEntropy": "STARFINDER.CounterClassesVanguard",
    "solarianAttunement": "STARFINDER.CounterClassesSolarian"
};
