// Namespace SFRPG Configuration Values
export const SFRPG = {};

/**
 * The set of ability scores used with the system
 * @type {Object}
 */
SFRPG.abilities = {
    "str": "SFRPG.AbilityStr",
    "dex": "SFRPG.AbilityDex",
    "con": "SFRPG.AbilityCon",
    "int": "SFRPG.AbilityInt",
    "wis": "SFRPG.AbilityWis",
    "cha": "SFRPG.AbilityCha"
};

SFRPG.acpEffectingArmorType = {
    "acp-all": "SFRPG.ModifierACPEffectingArmorTypeAll",
    "acp-light": "SFRPG.ModifierACPEffectingArmorTypeLight",
    "acp-heavy": "SFRPG.ModifierACPEffectingArmorTypeHeavy",
    "acp-power": "SFRPG.ModifierACPEffectingArmorTypePower"
};

/**
 * The set of saves used with the system
 * @type {Object}
 */
SFRPG.saves = {
    "fort": "SFRPG.FortitudeSave",
    "reflex": "SFRPG.ReflexSave",
    "will": "SFRPG.WillSave"
};

SFRPG.saveDescriptors = {
    "negate": "SFRPG.SaveDescriptorNegates",
    "partial": "SFRPG.SaveDescriptorPartial",
    "half": "SFRPG.SaveDescriptorHalf",
    "disbelieve": "SFRPG.SaveDescriptorDisbelieve",
    "harmless": "SFRPG.SaveDescriptorHarmless",
    "object": "SFRPG.SaveDescriptorObject"
};

/**
 * Character alignment options
 * @type {Object}
 */
SFRPG.alignments = {
    "lg": "SFRPG.AlignmentLG",
    "ng": "SFRPG.AlignmentNG",
    "cg": "SFRPG.AlignmentCG",
    "ln": "SFRPG.AlignmentLN",
    "tn": "SFRPG.AlignmentTN",
    "cn": "SFRPG.AlignmentCN",
    "le": "SFRPG.AlignmentLE",
    "ne": "SFRPG.AlignmentNE",
    "ce": "SFRPG.AlignmentCE"
};

/**
 * The set of armor proficiencies which a character may have
 * @type {Object}
 */
SFRPG.armorProficiencies = {
    "lgt": "SFRPG.ArmorProficiencyLight",
    "hvy": "SFRPG.ArmorProficiencyHeavy",
    "pwr": "SFRPG.ArmorProficiencyPower",
    "shl": "SFRPG.ArmorProficiencyShields"
};

/**
 * The set of weapons proficiencies which a character may have
 * @type {Object}
 */
SFRPG.weaponProficiencies = {
    "bmelee": "SFRPG.WeaponProficiencyBasicMelee",
    "amelee": "SFRPG.WeaponProficiencyAdvMelee",
    "sarms": "SFRPG.WeaponProficiencySmallArms",
    "larms": "SFRPG.WeaponProficiencyLongArms",
    "hweap": "SFRPG.WeaponProficiencyHeavy",
    "snipe": "SFRPG.WeaponProficiencySniper",
    "gren": "SFRPG.WeaponProficiencyGrenades",
    "spec": "SFRPG.WeaponProficiencySpecial"
};

SFRPG.weaponTypeProficiency = {
    "basicM": "bmelee",
    "advancedM": "amelee",
    "smallA": "sarms",
    "longA": "larms",
    "heavy": "hweap",
    "sniper": "snipe",
    "grenade": "gren",
    "special": "",
    "solarian": ""
};

/**
 * This describes the ways that an ability can be cativated
 * @type {Object}
 */
SFRPG.abilityActivationTypes = {
    "none": "SFRPG.AbilityActivationTypesNone",
    "action": "SFRPG.AbilityActivationTypesStandard",
    "move": "SFRPG.AbilityActivationTypesMove",
    "swift": "SFRPG.AbilityActivationTypesSwift",
    "full": "SFRPG.AbilityActivationTypesFull",
    "reaction": "SFRPG.AbilityActivationTypesReaction",
    "other": "SFRPG.AbilityActivationTypesOther",
    "day": "SFRPG.AbilityActivationTypesDay",
    "hour": "SFRPG.AbilityActivationTypesHour",
    "min": "SFRPG.AbilityActivationTypesMinute",
    "special": "SFRPG.AbilityActivationTypesSpecial"
};

SFRPG.skillProficiencyLevels = {
    0: "",
    3: "SFRPG.SkillProficiencyLevelClassSkill"
};

/**
 * The valid currency types in SFRPG
 * @type {Object}
 */
SFRPG.currencies = {
    "credit": "SFRPG.Credits",
    "upb": "SFRPG.UPBs"
};

// Damage Types
SFRPG.energyDamageTypes = {
    "acid": "SFRPG.DamageTypesAcid",
    "cold": "SFRPG.DamageTypesCold",
    "electricity": "SFRPG.DamageTypesElectricity",
    "fire": "SFRPG.DamageTypesFire",
    "radiation": "SFRPG.DamageTypesRadiation",
    "sonic": "SFRPG.DamageTypesSonic"
};

SFRPG.kineticDamageTypes = {
    "bludgeoning": "SFRPG.DamageTypesBludgeoning",
    "piercing": "SFRPG.DamageTypesPiercing",
    "slashing": "SFRPG.DamageTypesSlashing"
};

SFRPG.damageTypes = {
    ...SFRPG.energyDamageTypes,
    ...SFRPG.kineticDamageTypes,
    "nonlethal": "SFRPG.DamageTypesNonlethal"
};

SFRPG.weaponDamageTypes = {
    "acid": "SFRPG.DamageTypesAcid",
    "acid+bludgeoning": "SFRPG.DamageTypesAcidAndBludgeoning",
    "acid+electricity": "SFRPG.DamageTypesAcidAndElectricity",
    "acid+fire": "SFRPG.DamageTypesAcidAndFire",
    "acid+piercing": "SFRPG.DamageTypesAcidAndPiercing",
    "acid+slashing": "SFRPG.DamageTypesAcidAndSlashing",
    "acid|fire": "SFRPG.DamageTypesAcidOrFire",
    "acid|slashing": "SFRPG.DamageTypesAcidOrSlashing",    
    "cold": "SFRPG.DamageTypesCold",
    "cold+piercing": "SFRPG.DamageTypesColdAndPiercing",
    "cold+slashing": "SFRPG.DamageTypesColdAndSlashing",
    "cold|fire": "SFRPG.DamageTypesColdOrFire",
    "electricity": "SFRPG.DamageTypesElectricity",
    "electricity+fire": "SFRPG.DamageTypesElectricityAndFire",
    "electricity+piercing": "SFRPG.DamageTypesElectricityAndPiercing",
    "electricity+slashing": "SFRPG.DamageTypesElectricityAndSlashing",
    "force": "SFRPG.DamageTypesForce",
    "fire": "SFRPG.DamageTypesFire",
    "fire+force": "SFRPG.DamageTypesFireAndForce",
    "fire+piercing": "SFRPG.DamageTypesFireAndPiercing",
    "fire+slashing": "SFRPG.DamageTypesFireAndSlashing",
    "fire|slashing": "SFRPG.DamageTypesFireOrSlashing",
    "fire|sonic": "SFRPG.DamageTypesFireOrSonic",
    "sonic": "SFRPG.DamageTypesSonic",
    "bludgeoning": "SFRPG.DamageTypesBludgeoning",
    "bludgeoning+cold": "SFRPG.DamageTypesBludgeoningAndCold",
    "bludgeoning+electricity": "SFRPG.DamageTypesBludgeoningAndElectricity",
    "bludgeoning+fire": "SFRPG.DamageTypesBludgeoningAndFire",
    "bludgeoning+sonic": "SFRPG.DamageTypesBludgeoningAndSonic",
    "piercing": "SFRPG.DamageTypesPiercing",
    "piercing+sonic": "SFRPG.DamageTypesPiercingAndSonic",
    "slashing": "SFRPG.DamageTypesSlashing",
    "slashing+piercing": "SFRPG.DamageTypesSlashingAndPiercing",
    "slashing+sonic": "SFRPG.DamageTypesSlashingAndSonic",
};

SFRPG.distanceUnits = {
    "none": "SFRPG.None",
    "personal": "SFRPG.Personal",
    "touch": "SFRPG.Touch",
    "close": "SFRPG.Close",
    "medium": "SFRPG.Medium",
    "long": "SFRPG.Long",
    "planetary": "SFRPG.Planetary",
    "system": "SFRPG.SystemWide",
    "plane": "SFRPG.Plane",
    "unlimited": "SFRPG.Unlimited",
    "ft": "SFRPG.Ft",
    "meter": "SFRPG.Meter",
    "mi": "SFRPG.Mi",
    "spec": "SFRPG.Special",
    "any": "SFRPG.DistAny"
};

SFRPG.targetTypes = {};

SFRPG.timePeriods = {};

// Healing types
SFRPG.healingTypes = {
    "healing": "SFRPG.HealingTypesHealing"
};

SFRPG.spellPreparationModes = {
    "always": "SFRPG.SpellPreparationModesAlways",
    "innate": "SFRPG.SpellPreparationModesInnate"
};

SFRPG.limitedUsePeriods = {
    "sr": "SFRPG.LimitedUsePeriodsShort",
    "lr": "SFRPG.LimitedUsePeriodsLong",
    "day": "SFRPG.LimitedUsePeriodsDay",
    "charges": "SFRPG.LimitedUsePeriodsCharges"
};

SFRPG.senses = {
    "bs": "SFRPG.SenesBS",
    "bl": "SFRPG.SenesBL",
    "dark": "SFRPG.SenesDark",
    "llv": "SFRPG.SenesLLV",
    "st": "SFRPG.SensesST"
};

SFRPG.skills = {
    "acr": "SFRPG.SkillAcr",
    "ath": "SFRPG.SkillAth",
    "blu": "SFRPG.SkillBlu",
    "com": "SFRPG.SkillCom",
    "cul": "SFRPG.SkillCul",
    "dip": "SFRPG.SkillDip",
    "dis": "SFRPG.SkillDis",
    "eng": "SFRPG.SkillEng",
    "int": "SFRPG.SkillInt",
    "lsc": "SFRPG.SkillLsc",
    "med": "SFRPG.SkillMed",
    "mys": "SFRPG.SkillMys",
    "per": "SFRPG.SkillPer",
    "pro": "SFRPG.SkillPro",
    "phs": "SFRPG.SkillPsc",
    "pil": "SFRPG.SkillPil",
    "sen": "SFRPG.SkillSen",
    "sle": "SFRPG.SkillSle",
    "ste": "SFRPG.SkillSte",
    "sur": "SFRPG.SkillSur"
};

// Weapon Types
SFRPG.weaponTypes = {
    "basicM": "SFRPG.WeaponTypesBasicMelee",
    "advancedM": "SFRPG.WeaponTypesAdvMelee",
    "smallA": "SFRPG.WeaponTypesSmallArms",
    "longA": "SFRPG.WeaponTypesLongArms",
    "heavy": "SFRPG.WeaponTypesHeavy",
    "sniper": "SFRPG.WeaponTypesSniper",
    "grenade": "SFRPG.WeaponTypesGrenades",
    "special": "SFRPG.WeaponTypesSpecial",
    "solarian": "SFRPG.WeaponTypesSolarian"
};

// Weapons sub categories
SFRPG.weaponCategories = {
    "cryo"         : "SFRPG.WeaponCategoriesCryo",
    "disruption"   : "SFRPG.WeaponCategoriesDisruption",
    "disintegrator": "SFRPG.WeaponCategoriesDisintegrator",
    "flame"        : "SFRPG.WeaponCategoriesFlame",
    "laser"        : "SFRPG.WeaponCategoriesLaser",
    "plasma"       : "SFRPG.WeaponCategoriesPlasma",
    "projectile"   : "SFRPG.WeaponCategoriesProjectile",
    "shock"        : "SFRPG.WeaponCategoriesShock",
    "sonic"        : "SFRPG.WeaponCategoriesSonic",
    "uncategorized": "SFRPG.WeaponCategoriesUncategorized"
};

// Weapon Properties
SFRPG.weaponProperties = {
    "one": "SFRPG.WeaponPropertiesOneHanded",
    "two": "SFRPG.WeaponPropertiesTwoHanded",
    "amm": "SFRPG.WeaponPropertiesAmmunition",
    "aeon": "SFRPG.WeaponPropertiesAeon",
    "analog": "SFRPG.WeaponPropertiesAnalog",
    "antibiological": "SFRPG.WeaponPropertiesAntibiological",
    "archaic": "SFRPG.WeaponPropertiesArchaic",
    "aurora": "SFRPG.WeaponPropertiesAurora",
    "automatic": "SFRPG.WeaponPropertiesAutomatic",
    "blast": "SFRPG.WeaponPropertiesBlast",
    "block": "SFRPG.WeaponPropertiesBlock",
    "boost": "SFRPG.WeaponPropertiesBoost",
    "breach": "SFRPG.WeaponPropertiesBreach",
    "breakdown": "SFRPG.WeaponPropertiesBreakdown",
    "bright": "SFRPG.WeaponPropertiesBright",
    "cluster": "SFRPG.WeaponPropertiesCluster",
    "conceal": "SFRPG.WeaponsPropertiesConceal",
    "deconstruct": "SFRPG.WeaponPropertiesDeconstruct",
    "deflect": "SFRPG.WeaponPropertiesDeflect",
    "disarm": "SFRPG.WeaponPropertiesDisarm",
    "double": "SFRPG.WeaponPropertiesDouble",
    "drainCharge": "SFRPG.WeaponPropertiesDrainCharge",
    "echo": "SFRPG.WeaponPropertiesEcho",
    "entangle": "SFRPG.WeaponPropertiesEntangle",
    "explode": "SFRPG.WeaponPropertiesExplode",
    "extinguish": "SFRPG.WeaponPropertiesExtinguish",
    "feint": "SFRPG.WeaponPropertiesFeint",
    "fiery": "SFRPG.WeaponPropertiesFiery",
    "firstArc": "SFRPG.WeaponPropertiesFirstArc",
    "flexibleLine": "SFRPG.WeaponPropertiesFlexibleLine",
    "force": "SFRPG.WeaponPropertiesForce",
    "freeHands": "SFRPG.WeaponPropertiesFreeHands",
    "fueled": "SFRPG.WeaponPropertiesFueled",
    "grapple": "SFRPG.WeaponPropertiesGrapple",
    "gravitation": "SFRPG.WeaponPropertiesGravitation",
    "guided": "SFRPG.WeaponPropertiesGuided",
    "harrying": "SFRPG.WeaponPropertiesHarrying",
    "holyWater": "SFRPG.WeaponPropertiesHolyWater",
    "hybrid": "SFRPG.WeaponPropertiesHybrid",
    "ignite": "SFRPG.WeaponPropertiesIgnite",
    "indirect": "SFRPG.WeaponPropertiesIndirect",
    "injection": "SFRPG.WeaponPropertiesInjection",
    "integrated": "SFRPG.WeaponPropertiesIntegrated",
    "line": "SFRPG.WeaponPropertiesLine",
    "living": "SFRPG.WeaponPropertiesLiving",
    "lockdown": "SFRPG.WeaponPropertiesLockdown",
    "mind-affecting": "SFRPG.WeaponPropertiesMindAffecting",
    "mine": "SFRPG.WeaponPropertiesMine",
    "mire": "SFRPG.WeaponPropertiesMire",
    "modal": "SFRPG.WeaponPropertiesModal",
    "necrotic": "SFRPG.WeaponPropertiesNecrotic",
    "nonlethal": "SFRPG.WeaponPropertiesNonlethal",
    "operative": "SFRPG.WeaponPropertiesOperative",
    "penetrating": "SFRPG.WeaponPropertiesPenetrating",
    "polarize": "SFRPG.WeaponPropertiesPolarize",
    "polymorphic": "SFRPG.WeaponPropertiesPolymorphic",
    "powered": "SFRPG.WeaponPropertiesPowered",
    "professional": "SFRPG.WeaponPropertiesProfessional",
    "punchGun": "SFRPG.WeaponPropertiesPunchGun",
    "qreload": "SFRPG.WeaponPropertiesQuickReload",
    "radioactive": "SFRPG.WeaponPropertiesRadioactive",
    "reach": "SFRPG.WeaponPropertiesReach",
    "recall": "SFRPG.WeaponPropertiesRecall",
    "regrowth": "SFRPG.WeaponPropertiesRegrowth",
    "relic": "SFRPG.WeaponPropertiesRelic",
    "reposition": "SFRPG.WeaponPropertiesReposition",
    "shape": "SFRPG.WeaponPropertiesShape",
    "shatter": "SFRPG.WeaponPropertiesShatter",
    "shells": "SFRPG.WeaponPropertiesShells",
    "shield": "SFRPG.WeaponPropertiesShield",
    "sniper": "SFRPG.WeaponPropertiesSniper",
    "stun": "SFRPG.WeaponPropertiesStun",
    "subtle": "SFRPG.WeaponPropertiesSubtle",
    "sunder": "SFRPG.WeaponPropertiesSunder",
    "swarm": "SFRPG.WeaponPropertiesSwarm",
    "tail": "SFRPG.WeaponPropertiesTail",
    "teleportive": "SFRPG.WeaponPropertiesTeleportive",
    "thought": "SFRPG.WeaponPropertiesThought",
    "throttle": "SFRPG.WeaponPropertiesThrottle",
    "thrown": "SFRPG.WeaponPropertiesThrown",
    "trip": "SFRPG.WeaponPropertiesTrip",
    "unbalancing": "SFRPG.WeaponPropertiesUnbalancing",
    "underwater": "SFRPG.WeaponPropertiesUnderwater",
    "unwieldy": "SFRPG.WeaponPropertiesUnwieldy",
    "variantBoost": "SFRPG.WeaponPropertiesVariantBoost",
    "wideLine": "SFRPG.WeaponPropertiesWideLine"
};

SFRPG.weaponPropertiesTooltips = {
    "one": "SFRPG.WeaponPropertiesOneHandedTooltip",
    "two": "SFRPG.WeaponPropertiesTwoHandedTooltip",
    "aeon": "SFRPG.WeaponPropertiesAeonTooltip",
    "analog": "SFRPG.WeaponPropertiesAnalogTooltip",
    "antibiological": "SFRPG.WeaponPropertiesAntibiologicalTooltip",
    "archaic": "SFRPG.WeaponPropertiesArchaicTooltip",
    "aurora": "SFRPG.WeaponPropertiesAuroraTooltip",
    "automatic": "SFRPG.WeaponPropertiesAutomaticTooltip",
    "blast": "SFRPG.WeaponPropertiesBlastTooltip",
    "block": "SFRPG.WeaponPropertiesBlockTooltip",
    "boost": "SFRPG.WeaponPropertiesBoostTooltip",
    "breach": "SFRPG.WeaponPropertiesBreachTooltip",
    "breakdown": "SFRPG.WeaponPropertiesBreakdownTooltip",
    "bright": "SFRPG.WeaponPropertiesBrightTooltip",
    "conceal": "SFRPG.WeaponsPropertiesConcealTooltip",
    "cluster": "SFRPG.WeaponPropertiesClusterTooltip",
    "deconstruct": "SFRPG.WeaponPropertiesDeconstructTooltip",
    "deflect": "SFRPG.WeaponPropertiesDeflectTooltip",
    "disarm": "SFRPG.WeaponPropertiesDisarmTooltip",
    "double": "SFRPG.WeaponPropertiesDoubleTooltip",
    "shatter": "SFRPG.WeaponPropertiesShatterTooltip",
    "drainCharge": "SFRPG.WeaponPropertiesDrainChargeTooltip",
    "echo": "SFRPG.WeaponPropertiesEchoTooltip",
    "entangle": "SFRPG.WeaponPropertiesEntangleTooltip",
    "explode": "SFRPG.WeaponPropertiesExplodeTooltip",
    "extinguish": "SFRPG.WeaponPropertiesExtinguishTooltip"

};

SFRPG.spellAreaShapes = {
    "": "",
    "cone": "SFRPG.SpellAreaShapesCone",
    "cylinder": "SFRPG.SpellAreaShapesCylinder",
    "line": "SFRPG.SpellAreaShapesLine",
    "sphere": "SFRPG.SpellAreaShapesSphere",
    "shapable": "SFRPG.SpellAreaShapesShapable",
    "other": "SFRPG.SpellAreaShapesOther"
};

SFRPG.spellAreaEffects = {
    "": "",
    "burst"    : "SFRPG.SpellAreaEffects.Burst",
    "emanation": "SFRPG.SpellAreaEffects.Emanation",
    "spread"   : "SFRPG.SpellAreaEffects.Spread"
}

// Weapon special abilities
SFRPG.weaponSpecial = {
    "analog"     : "SFRPG.WeaponSpecial.Analog",
    "archaic"    : "SFRPG.WeaponSpecial.Archaic",
    "auto"       : "SFRPG.WeaponSpecial.Automatic",
    "blast"      : "SFRPG.WeaponSpecial.Blast",
    "block"      : "SFRPG.WeaponSpecial.Block",
    "boost"      : "SFRPG.WeaponSpecial.Boost",
    "bright"     : "SFRPG.WeaponSpecial.Bright",
    "disarm"     : "SFRPG.WeaponSpecial.Disarm",
    "entangle"   : "SFRPG.WeaponSpecial.Entangle",
    "exploade"   : "SFRPG.WeaponSpecial.Explode",
    "injection"  : "SFRPG.WeaponSpecial.Injection",
    "line"       : "SFRPG.WeaponSpecial.Line",
    "nonlethal"  : "SFRPG.WeaponSpecial.Nonlethal",
    "operative"  : "SFRPG.WeaponSpecial.Operative",
    "penetrating": "SFRPG.WeaponSpecial.Penetrating",
    "powered"    : "SFRPG.WeaponSpecial.Powered",
    "quickReload": "SFRPG.WeaponSpecial.Quick Reload",
    "reach"      : "SFRPG.WeaponSpecial.Reach",
    "sniper"     : "SFRPG.WeaponSpecial.Sniper",
    "stun"       : "SFRPG.WeaponSpecial.Stun",
    "thrown"     : "SFRPG.WeaponSpecial.Thrown",
    "trip"       : "SFRPG.WeaponSpecial.Trip",
    "unwieldy"   : "SFRPG.WeaponSpecial.Unwieldy"
};

// Weapon critical hit effects
SFRPG.weaponCriticalHitEffects = {
    "arc"        : "SFRPG.WeaponCriticalHitEffects.Arc",
    "bleed"      : "SFRPG.WeaponCriticalHitEffects.Bleed",
    "burn"       : "SFRPG.WeaponCriticalHitEffects.Burn",
    "corrode"    : "SFRPG.WeaponCriticalHitEffects.Corrode",
    "deafen"     : "SFRPG.WeaponCriticalHitEffects.Deafen",
    "injection"  : "SFRPG.WeaponCriticalHitEffects.Injection",
    "knockdown"  : "SFRPG.WeaponCriticalHitEffects.Knockdown",
    "severeWound": "SFRPG.WeaponCriticalHitEffects.SevereWound",
    "staggered"  : "SFRPG.WeaponCriticalHitEffects.Staggered",
    "stunned"    : "SFRPG.WeaponCriticalHitEffects.Stunned",
    "wound"      : "SFRPG.WeaponCriticalHitEffects.Wound"
};

// Allowed armor types for upgrades
SFRPG.allowedArmorTypes = {
    "light": "Light Armor",
    "heavy": "Heavy Armor",
    "power": "Power Armor",
    "lightAndHeavy": "Light and Heavy Armor",
    "heavyAndPower": "Heavy and Power Armor",
    "shield": "Shields"
};

// Equipment types
SFRPG.armorTypes = {
    "light": "SFRPG.ArmorTypes.Light",
    "heavy": "SFRPG.ArmorTypes.Heavy",
    "power": "SFRPG.ArmorTypes.Power"
};

SFRPG.equipmentTypes = SFRPG.armorTypes;

// Spell Schools
SFRPG.spellSchools = {
    "abj": "SFRPG.Magic.Schools.Abjuration",
    "con": "SFRPG.Magic.Schools.Conjuration",
    "div": "SFRPG.Magic.Schools.Divination",
    "enc": "SFRPG.Magic.Schools.Enchantment",
    "evo": "SFRPG.Magic.Schools.Evocation",
    "ill": "SFRPG.Magic.Schools.Illusion",
    "nec": "SFRPG.Magic.Schools.Necromancy",
    "trs": "SFRPG.Magic.Schools.Transmutation",
    "uni": "SFRPG.Magic.Schools.Universal"
};

// Spell Levels
SFRPG.spellLevels = {
    0: "SFRPG.Magic.Levels.0",
    1: "SFRPG.Magic.Levels.1",
    2: "SFRPG.Magic.Levels.2",
    3: "SFRPG.Magic.Levels.3",
    4: "SFRPG.Magic.Levels.4",
    5: "SFRPG.Magic.Levels.5",
    6: "SFRPG.Magic.Levels.6"
};

// Feat types
SFRPG.featTypes = {
    "general": "SFRPG.FeatTypes.General",
    "combat" : "SFRPG.FeatTypes.Combat"
};

/**
 * The avaialbe sizes for an Actor
 * @type {Object}
 */
SFRPG.actorSizes = {
    "fine": "SFRPG.SizeFine",
    "diminutive": "SFRPG.SizeDim",
    "tiny": "SFRPG.SizeTiny",
    "small": "SFRPG.SizeSmall",
    "medium": "SFRPG.SizeMedium",
    "large": "SFRPG.SizeLarge",
    "huge": "SFRPG.SizeHuge",
    "gargantuan": "SFRPG.SizeGargantuan",
    "colossal": "SFRPG.SizeColossal"
};

SFRPG.starshipSizes = {
    "tiny": "SFRPG.SizeTiny",
    "small": "SFRPG.SizeSmall",
    "medium": "SFRPG.SizeMedium",
    "large": "SFRPG.SizeLarge",
    "huge": "SFRPG.SizeHuge",
    "gargantuan": "SFRPG.SizeGargantuan",
    "colossal": "SFRPG.SizeColossal",
    "superColossal": "SFRPG.ShipSystems.Size.Supercolossal"
};

SFRPG.itemSizes = {
    "fine": "SFRPG.SizeFine",
    "diminutive": "SFRPG.SizeDim",
    "tiny": "SFRPG.SizeTiny",
    "small": "SFRPG.SizeSmall",
    "medium": "SFRPG.SizeMedium",
    "large": "SFRPG.SizeLarge",
    "huge": "SFRPG.SizeHuge",
    "gargantuan": "SFRPG.SizeGargantuan",
    "colossal": "SFRPG.SizeColossal"
};

/**
 * The amount of space on a 5ft grid square that a 
 * token of a specific size takes.
 * @type {Object}
 */
SFRPG.tokenSizes = {
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

SFRPG.allowedClasses = {
    "myst": "SFRPG.AllowedClasses.Myst",
    "tech": "SFRPG.AllowedClasses.Tech",
    "wysh": "SFRPG.AllowedClasses.Wysh"
};

SFRPG.itemActionTypes = {
    "mwak": "SFRPG.ActionMWAK",
    "rwak": "SFRPG.ActionRWAK",
    "msak": "SFRPG.ActionMSAK",
    "rsak": "SFRPG.ActionRSAK",
    "save": "SFRPG.ActionSave",
    "heal": "SFRPG.ActionHeal",
    "abil": "SFRPG.ActionAbil",
    "util": "SFRPG.ActionUtil",
    "other": "SFRPG.ActionOther"
};

SFRPG.conditionTypes = {
    "asleep": "SFRPG.ConditionsAsleep",
    "bleeding": "SFRPG.ConditionsBleeding",
    "blinded": "SFRPG.ConditionsBlinded",
    "broken": "SFRPG.ConditionsBroken",
    "burning": "SFRPG.ConditionsBurning",
    "confused": "SFRPG.ConditionsConfused",
    "cowering": "SFRPG.ConditionsCowering",
    "dazed": "SFRPG.ConditionsDazed",
    "dazzled": "SFRPG.ConditionsDazzled",
    "dead": "SFRPG.ConditionsDead",
    "deafened": "SFRPG.ConditionsDeafened",
    "dying": "SFRPG.ConditionsDying",
    "encumbered": "SFRPG.ConditionsEncumbered",
    "entangled": "SFRPG.ConditionsEntangled",
    "exhausted": "SFRPG.ConditionsExhausted",
    "fascinated": "SFRPG.ConditionsFascinated",
    "fatigued": "SFRPG.ConditionsFatigued",
    "flat-footed": "SFRPG.ConditionsFlatFooted",
    "frightened": "SFRPG.ConditionsFrightened",
    "grappled": "SFRPG.ConditionsGrappled",
    "helpless": "SFRPG.ConditionsHelpless",
    "nauseated": "SFRPG.ConditionsNauseated",
    "off-kilter": "SFRPG.ConditionsOffKilter",
    "off-target": "SFRPG.ConditionsOffTarget",
    "overburdened": "SFRPG.ConditionsOverburdened",
    "panicked": "SFRPG.ConditionsPanicked",
    "paralyzed": "SFRPG.ConditionsParalyzed",
    "pinned": "SFRPG.ConditionsPinned",
    "prone": "SFRPG.ConditionsProne",
    "shaken": "SFRPG.ConditionsShaken",
    "sickened": "SFRPG.ConditionsSickened",
    "stable": "SFRPG.ConditionsStable",
    "staggered": "SFRPG.ConditionsStaggered",
    "stunned": "SFRPG.ConditionsStunned",
    "unconscious": "SFRPG.ConditionsUnconscious"
};

SFRPG.languages = {
	"abyssal": "SFRPG.LanguagesAbyssal",
	"akiton": "SFRPG.LanguagesAkitonian",
	"aklo": "SFRPG.LanguagesAklo",	
	"aquan": "SFRPG.LanguagesAquan",
	"arkanen": "SFRPG.LanguagesArkanen",
	"auran": "SFRPG.LanguagesAuran",
	"azlanti": "SFRPG.LanguagesAzlanti",	
	"brethedan": "SFRPG.LanguagesBrethedan",
	"castrovelian": "SFRPG.LanguagesCastrovelian",
	"celestial": "SFRPG.LanguagesCelestial",
	"common": "SFRPG.LanguagesCommon",
	"draconic": "SFRPG.LanguagesDraconic",
	"drow": "SFRPG.LanguagesDrow",
	"dwarven": "SFRPG.LanguagesDwarven",
	"elven": "SFRPG.LanguagesElven",	
	"eoxian": "SFRPG.LanguagesEoxian",
	"gnome": "SFRPG.LanguagesGnome",
	"goblin": "SFRPG.LanguagesGoblin",
	"halfling": "SFRPG.LanguagesHalfling",
	"ignan": "SFRPG.LanguagesIgnan",
	"infernal": "SFRPG.LanguagesInfernal",
	"kalo": "SFRPG.LanguagesKalo",	
	"kasatha": "SFRPG.LanguagesKasatha",
	"Nchaki": "SFRPG.LanguagesNchaki",
	"orc": "SFRPG.LanguagesOrc",
	"sarcesian": "SFRPG.LanguagesSarcesian",
	"shirren": "SFRPG.LanguagesShirren",
	"shobhad": "SFRPG.LanguagesShobhad",	
	"terran": "SFRPG.LanguagesTerran",
	"triaxian": "SFRPG.LanguagesTriaxian",
	"vercite": "SFRPG.LanguagesVercite",
	"vesk": "SFRPG.LanguagesVesk",
	"ysoki": "SFRPG.LanguagesYsoki"
};

SFRPG.augmentationTypes = {
    "cybernetic": "SFRPG.Cybernetic",
    "biotech": "SFRPG.Biotech",
    "magitech": "SFRPG.Magitech",
    "necrograft": "SFRPG.Necrograft",
    "personal": "SFRPG.PersonalUpgrade"
};

SFRPG.consumableTypes = {
    "serum"    : "SFRPG.ConsumableTypes.Serum",
    "ampoule"  : "SFRPG.ConsumableTypes.Ampoule",
    "spellGem" : "SFRPG.ConsumableTypes.SpellGem",
    "drugs"    : "SFRPG.ConsumableTypes.Drugs",
    "medicne"  : "SFRPG.ConsumableTypes.Medicine",
    "poison"   : "SFRPG.ConsumableTypes.Poison",
    "foodDrink": "SFRPG.ConsumableTypes.FoodDrink"
};

SFRPG.augmentationSytems = {
    "none": "SFRPG.None",
    "arm": "SFRPG.AugArm",
    "armAndHand" : "SFRPG.AugArmAndHand",
    "allArms": "SFRPG.AugAllArms",
    "brain": "SFRPG.AugBrain",
    "brainHeartLungs": "SFRPG.AugBrainHeartLungs",
    "brainAndEyes": "SFRPG.AugBrainAndEyes",
    "ears": "SFRPG.AugEars",
    "earsAndThroat": "SFRPG.AugEarsAndThroat",
    "endocrine": "SFRPG.AugEndocrine",
    "eye": "SFRPG.AugEye",
    "eyes": "SFRPG.AugEyes",
    "foot": "SFRPG.AugFoot",
    "allFeet": "SFRPG.AugAllFeet",
    "hand": "SFRPG.AugHand",
    "allHands": "SFRPG.AugAllHands",
    "heart": "SFRPG.AugHeart",
    "leg": "SFRPG.AugLeg",
    "legAndFoot": "SFRPG.AugLegAndFoot",
    "allLegs": "SFRPG.AugAllLegs",
    "allLegsAndFeet": "SFRPG.AugAllLegsAndFeet",
    "lungs": "SFRPG.AugLungs",
    "lungsAndThroat": "SFRPG.AugLungsAndThroat",
    "spinal": "SFRPG.AugSpinalColumn",
    "skin": "SFRPG.AugSkin",
    "skinAndThroat": "SFRPG.AugSkinAndThroat",
    "throat": "SFRPG.AugThroat"
};

/*--------------------------------*
 * Starship properties and values *
 *--------------------------------*/
SFRPG.maneuverability = {
    "clumsy" : "SFRPG.ShipSystems.Maneuverability.Clumsy",
    "poor"   : "SFRPG.ShipSystems.Maneuverability.Poor",
    "average": "SFRPG.ShipSystems.Maneuverability.Average",
    "good"   : "SFRPG.ShipSystems.Maneuverability.Good",
    "perfect": "SFRPG.ShipSystems.Maneuverability.Perfect"
};

// Starship Weapons
SFRPG.starshipWeaponTypes = {
    "direct"  : "SFRPG.ShipSystems.StarshipWeaponTypes.Direct",
    "ecm":      "SFRPG.ShipSystems.StarshipWeaponTypes.ECM",
    "melee":    "SFRPG.ShipSystems.StarshipWeaponTypes.Melee",
    "tracking": "SFRPG.ShipSystems.StarshipWeaponTypes.Tracking"
};

SFRPG.starshipWeaponClass = {
    "light"  : "SFRPG.ShipSystems.StarshipWeaponClass.Light",
    "heavy"  : "SFRPG.ShipSystems.StarshipWeaponClass.Heavy",
    "capital": "SFRPG.ShipSystems.StarshipWeaponClass.Capital",
    "spinal":  "SFRPG.ShipSystems.StarshipWeaponClass.Spinal"
};

SFRPG.starshipWeaponProperties = {
    "anchoring" : "SFRPG.ShipSystems.StarshipWeaponProperties.Anchoring", // SOM
    "array"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Array", // CRB
    "automated" : "SFRPG.ShipSystems.StarshipWeaponProperties.Automated", // SOM
    "broad"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Broad", // CRB
    "bugging"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Bugging", // Near Space
    "burrowing" : "SFRPG.ShipSystems.StarshipWeaponProperties.Burrowing", // Pact Worlds
    "buster"    : "SFRPG.ShipSystems.StarshipWeaponProperties.Buster", // SOM
    "connecting": "SFRPG.ShipSystems.StarshipWeaponProperties.Connecting", // The Last Refuge
    "deathField": "SFRPG.ShipSystems.StarshipWeaponProperties.DeathField", // AA 3
    "deployed"  : "SFRPG.ShipSystems.StarshipWeaponProperties.Deployed", // SOM
    "drone"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Drone", // The Reach of Empire
    "emp"       : "SFRPG.ShipSystems.StarshipWeaponProperties.Emp", // CRB
    "flakArea"  : "SFRPG.ShipSystems.StarshipWeaponProperties.FlakArea", // The Last Refuge
    "forceField": "SFRPG.ShipSystems.StarshipWeaponProperties.ForceField", // SOM
    "gravityTether": "SFRPG.ShipSystems.StarshipWeaponProperties.GravityTether", // Near Space
    "gravityWell": "SFRPG.ShipSystems.StarshipWeaponProperties.GravityWell", // SOM
    "hacking"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Hacking", // SOM
    "immobilize": "SFRPG.ShipSystems.StarshipWeaponProperties.Immobilize", // Deceivers' Moon
    "intimidating": "SFRPG.ShipSystems.StarshipWeaponProperties.Intimidating", // SOM
    "irradiateL": "SFRPG.ShipSystems.StarshipWeaponProperties.IrradiateL", // CRB
    "irradiateM": "SFRPG.ShipSystems.StarshipWeaponProperties.IrradiateM", // CRB
    "irradiateH": "SFRPG.ShipSystems.StarshipWeaponProperties.IrradiateH", // CRB
    "jamming"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Jamming", // Near Space
    "limited"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Limited", // CRB
    "line"      : "SFRPG.ShipSystems.StarshipWeaponProperties.Line", // CRB
    "mine"      : "SFRPG.ShipSystems.StarshipWeaponProperties.Mine", // SOM
    "mystical"  : "SFRPG.ShipSystems.StarshipWeaponProperties.Mystical", // SOM
    "navScram"  : "SFRPG.ShipSystems.StarshipWeaponProperties.NavScram", // SOM
    "numbing"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Numbing", // SOM
    "orbital"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Orbital", // SOM
    "pod"       : "SFRPG.ShipSystems.StarshipWeaponProperties.Pod", // SOM
    "point"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Point", // CRB
    "quantum"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Quantum", // CRB
    "radiant"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Radiant", // The Reach of Empire
    "rail"      : "SFRPG.ShipSystems.StarshipWeaponProperties.Rail", // SOM
    "ramming"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Ramming", // SOM
    "redirect"  : "SFRPG.ShipSystems.StarshipWeaponProperties.Redirect", // Deceivers' Moon
    "restricted": "SFRPG.ShipSystems.StarshipWeaponProperties.Restricted", // SOM
    "ripper"    : "SFRPG.ShipSystems.StarshipWeaponProperties.Ripper", // CRB
    "scatterscan": "SFRPG.ShipSystems.StarshipWeaponProperties.Scatterscan", // Deceivers' Moon
    "smart"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Smart", // SOM
    "smoldering": "SFRPG.ShipSystems.StarshipWeaponProperties.Smoldering", // Near Space
    "spore"     : "SFRPG.ShipSystems.StarshipWeaponProperties.Spore", // Pact Worlds
    "suspending": "SFRPG.ShipSystems.StarshipWeaponProperties.Suspending", // Near Space
    "sustained" : "SFRPG.ShipSystems.StarshipWeaponProperties.Sustained", // Soldiers of Brass
    "teleportation": "SFRPG.ShipSystems.StarshipWeaponProperties.Teleportation", // SOM
    "tractor"   : "SFRPG.ShipSystems.StarshipWeaponProperties.Tractor", // CRB
    "transposition": "SFRPG.ShipSystems.StarshipWeaponProperties.Transposition", // SOM
    "vandalDrones": "SFRPG.ShipSystems.StarshipWeaponProperties.VandalDrones", // AA 3
    "volatile": "SFRPG.ShipSystems.StarshipWeaponProperties.Volatile", // Empire of Bones
    "vortex"    : "SFRPG.ShipSystems.StarshipWeaponProperties.Vortex" // CRB
};

SFRPG.starshipArcs = {
    "forward"  : "SFRPG.ShipSystems.StarshipArcs.Forward",
    "starboard": "SFRPG.ShipSystems.StarshipArcs.Starboard",
    "aft"      : "SFRPG.ShipSystems.StarshipArcs.Aft",
    "port"     : "SFRPG.ShipSystems.StarshipArcs.Port",
    "turret"   : "SFRPG.ShipSystems.StarshipArcs.Turret"
};

SFRPG.starshipWeaponRanges = {
    "none":   "SFRPG.ShipSystems.StarshipWeaponRanges.None",
    "short" : "SFRPG.ShipSystems.StarshipWeaponRanges.Short",
    "medium": "SFRPG.ShipSystems.StarshipWeaponRanges.Medium",
    "long"  : "SFRPG.ShipSystems.StarshipWeaponRanges.Long"
};

SFRPG.starshipRoles = {
    "pilot"          : "SFRPG.ShipSystems.StarshipRoles.Pilot",
    "captain"        : "SFRPG.ShipSystems.StarshipRoles.Captain",
    "engineers"      : "SFRPG.ShipSystems.StarshipRoles.Engineers",
    "gunners"        : "SFRPG.ShipSystems.StarshipRoles.Gunners",
    "scienceOfficers": "SFRPG.ShipSystems.StarshipRoles.ScienceOfficers",
    "passengers"     : "SFRPG.ShipSystems.StarshipRoles.Passengers"
};

SFRPG.starshipRoleNames = {
    "captain": "SFRPG.StarshipSheet.Role.Captain",
    "pilot": "SFRPG.StarshipSheet.Role.Pilot",
    "gunner": "SFRPG.StarshipSheet.Role.Gunner",
    "engineer": "SFRPG.StarshipSheet.Role.Engineer",
    "scienceOfficer": "SFRPG.StarshipSheet.Role.ScienceOfficer",
    "chiefMate": "SFRPG.StarshipSheet.Role.ChiefMate",
    "magicOfficer": "SFRPG.StarshipSheet.Role.MagicOfficer",
    "minorCrew": "SFRPG.StarshipSheet.Role.MinorCrew",
    "openCrew": "SFRPG.StarshipSheet.Role.OpenCrew"
};

// starship value maps
SFRPG.starshipSystemStatus = {
    "nominal": "SFRPG.StarshipSheet.Critical.Status.Nominal",
    "glitching": "SFRPG.StarshipSheet.Critical.Status.Glitching",
    "malfunctioning": "SFRPG.StarshipSheet.Critical.Status.Malfunctioning",
    "wrecked": "SFRPG.StarshipSheet.Critical.Status.Wrecked"
};

SFRPG.starshipSizeMod = {
    "tiny": 2,
    "small": 1,
    "medium": 0,
    "large": -1,
    "huge": -2,
    "gargantuan": -4,
    "colossal": -8
};

// End starship stuff

SFRPG.vehicleSizes = {
    "diminutive": "SFRPG.SizeDim",
    "tiny": "SFRPG.SizeTiny",
    "small": "SFRPG.SizeSmall",
    "medium": "SFRPG.SizeMedium",
    "large": "SFRPG.SizeLarge",
    "huge": "SFRPG.SizeHuge",
    "gargantuan": "SFRPG.SizeGargantuan",
    "colossal": "SFRPG.SizeColossal"
};

SFRPG.vehicleTypes = {
    "land" : "SFRPG.Vehicles.VehicleTypes.Land",
    "water": "SFRPG.Vehicles.VehicleTypes.Water",
    "hover": "SFRPG.Vehicles.VehicleTypes.Hover",
    "landW": "SFRPG.Vehicles.VehicleTypes.Landw",
    "air"  : "SFRPG.Vehicles.VehicleTypes.Air",
    "landA": "SFRPG.Vehicles.VehicleTypes.Landa",
    "landATW": "SFRPG.Vehicles.VehicleTypes.Landatw",
    "landAW": "SFRPG.Vehicles.VehicleTypes.Landaw",
    "landT": "SFRPG.Vehicles.VehicleTypes.Landt",
    "landTW": "SFRPG.Vehicles.VehicleTypes.Landtw"
};

SFRPG.vehicleCoverTypes = {
    "none"    : "SFRPG.Vehicles.VehicleCoverTypes.None",
    "cover"   : "SFRPG.Vehicles.VehicleCoverTypes.Cover",
    "soft"    : "SFRPG.Vehicles.VehicleCoverTypes.Soft",
    "partial" : "SFRPG.Vehicles.VehicleCoverTypes.Partial",
    "improved": "SFRPG.Vehicles.VehicleCoverTypes.Improved",
    "total"   : "SFRPG.Vehicles.VehicleCoverTypes.Total"
};

/**
 * Base Attack Bonus Progression
 */
SFRPG.babProgression = {
    "moderate": "SFRPG.BABProgressionModerate",
    "full": "SFRPG.BABProgressionFull"
};

/**
 * Saving throw modifier progression
 */
SFRPG.saveProgression = {
    "slow": "SFRPG.SaveProgressionSlow",
    "fast": "SFRPG.SaveProgressionFast"
};

SFRPG.modifierTypes = {
    "ability": "SFRPG.ModifierTypeAbility",
    "armor": "SFRPG.ModifierTypeArmor",
    "base": "SFRPG.ModifierTypeBase",
    "circumstance": "SFRPG.ModifierTypeCircumstance",
    "divine": "SFRPG.ModifierTypeDivine",
    "enhancement": "SFRPG.ModifierTypeEnhancement",
    "insight": "SFRPG.ModifierTypeInsight",
    "luck": "SFRPG.ModifierTypeLuck",
    "morale": "SFRPG.ModifierTypeMorale",
    "racial": "SFRPG.ModifierTypeRacial",
    "untyped": "SFRPG.ModifierTypeUntyped"
};

// See modules/modifiers/types.js, SFRPGEffectType
SFRPG.modifierEffectTypes = {
    "ac": "SFRPG.ModifierEffectTypeAC",
    "hit-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Hitpoints",
    "stamina-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Stamina",
    "resolve-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Resolve",
    "base-attack-bonus": "SFRPG.ActorSheet.Modifiers.EffectTypes.BaseAttackBonus",
    "cmd": "SFRPG.ModifierEffectTypeCMD",
    "acp": "SFRPG.ModifierEffectTypeACP",
    "initiative": "SFRPG.ModifierEffectTypeInit",
    "ability-skills": "SFRPG.ModifierEffectTypeAbilitySkills",
    "ability-score": "SFRPG.ModifierEffectTypeAbilityScore",
    "ability-check": "SFRPG.ModifierEffectTypeAbilityCheck",
    "ability-checks": "SFRPG.ModifierEffectTypeAbilityChecks",
    "skill": "SFRPG.ModifierEffectTypeSkill",
    "all-skills": "SFRPG.ModifierEffectTypeAllSkills",
    "skill-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Skillpoints",
    "skill-ranks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SkillRanks",
    "saves": "SFRPG.ModifierEffectTypeSaves",
    "save": "SFRPG.ModifierEffectTypeSave",
    "ranged-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackRolls",
    "melee-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackRolls",
    "spell-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackRolls",
    "weapon-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackRolls",
    "all-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackRolls",
    "weapon-property-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyAttackRolls",
    "ranged-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackDamage",
    "melee-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackDamage",
    "spell-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackDamage",
    "weapon-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackDamage",
    "all-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackDamage",
    "weapon-property-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyDamage",
    "bulk": "SFRPG.ActorSheet.Modifiers.EffectTypes.Encumbrance"
};

SFRPG.modifierType = {
    "constant": "SFRPG.ModifierTypeConstant",
    "formula": "SFRPG.ModifierTypeFormula"
};

SFRPG.modifierArmorClassAffectedValues = {
    "both": "SFRPG.ModifierArmorClassBoth",
    "eac": "SFRPG.EnergyArmorClass",
    "kac": "SFRPG.KineticArmorClass"
};

SFRPG.CHARACTER_EXP_LEVELS = [
    0, 1300, 3300, 6000, 10000, 15000, 23000, 34000, 50000, 71000,
    105000, 145000, 210000, 295000, 425000, 600000, 850000, 1200000,
    1700000, 2400000
];

SFRPG.CR_EXP_LEVELS = [
    50, 400, 600, 800, 1200, 1600, 2400, 3200, 4800,
    6400, 9600, 12800, 19200, 25600, 38400, 51200, 76800, 102400,
    153600, 204800, 307200, 409600, 614400, 819200, 1228800, 1638400
];

SFRPG.statusEffectIcons = [
    "systems/sfrpg/icons/conditions/asleep.png",
    "systems/sfrpg/icons/conditions/bleeding.png",
    "systems/sfrpg/icons/conditions/blinded.png",
    "systems/sfrpg/icons/conditions/broken.png",
    "systems/sfrpg/icons/conditions/burning.png",
    "systems/sfrpg/icons/conditions/confused.png",
    "systems/sfrpg/icons/conditions/cowering.png",
    "systems/sfrpg/icons/conditions/dazed.png",
    "systems/sfrpg/icons/conditions/dazzled.png",
    "systems/sfrpg/icons/conditions/dead.png",
    "systems/sfrpg/icons/conditions/deafened.png",
    "systems/sfrpg/icons/conditions/dying.png",
    "systems/sfrpg/icons/conditions/encumbered.png",
    "systems/sfrpg/icons/conditions/entangled.png",
    "systems/sfrpg/icons/conditions/exhausted.png",
    "systems/sfrpg/icons/conditions/fascinated.png",
    "systems/sfrpg/icons/conditions/fatigued.png",
    "systems/sfrpg/icons/conditions/flatfooted.png",
    "systems/sfrpg/icons/conditions/frightened.png",
    "systems/sfrpg/icons/conditions/grappled.png",
    "systems/sfrpg/icons/conditions/helpless.png",
    "systems/sfrpg/icons/conditions/nauseated.png",
    "systems/sfrpg/icons/conditions/offkilter.png",
    "systems/sfrpg/icons/conditions/offtarget.png",
    "systems/sfrpg/icons/conditions/overburdened.png",
    "systems/sfrpg/icons/conditions/panicked.png",
    "systems/sfrpg/icons/conditions/paralyzed.png",
    "systems/sfrpg/icons/conditions/pinned.png",
    "systems/sfrpg/icons/conditions/prone.png",
    "systems/sfrpg/icons/conditions/shaken.png",
    "systems/sfrpg/icons/conditions/sickened.png",
    "systems/sfrpg/icons/conditions/staggered.png",
    "systems/sfrpg/icons/conditions/stable.png",
    "systems/sfrpg/icons/conditions/stunned.png",
    "systems/sfrpg/icons/conditions/unconscious.png"
];

SFRPG.statusEffectIconMapping = {
    "asleep": "systems/sfrpg/icons/conditions/asleep.png",
    "bleeding": "systems/sfrpg/icons/conditions/bleeding.png",
    "blinded": "systems/sfrpg/icons/conditions/blinded.png",
    "broken": "systems/sfrpg/icons/conditions/broken.png",
    "burning": "systems/sfrpg/icons/conditions/burning.png",
    "confused": "systems/sfrpg/icons/conditions/confused.png",
    "cowering": "systems/sfrpg/icons/conditions/cowering.png",
    "dazed": "systems/sfrpg/icons/conditions/dazed.png",
    "dazzled": "systems/sfrpg/icons/conditions/dazzled.png",
    "dead": "systems/sfrpg/icons/conditions/dead.png",
    "deafened": "systems/sfrpg/icons/conditions/deafened.png",
    "dying": "systems/sfrpg/icons/conditions/dying.png",
    "encumbered": "systems/sfrpg/icons/conditions/encumbered.png",
    "entangled": "systems/sfrpg/icons/conditions/entangled.png",
    "exhausted": "systems/sfrpg/icons/conditions/exhausted.png",
    "fascinated": "systems/sfrpg/icons/conditions/fascinated.png",
    "fatigued": "systems/sfrpg/icons/conditions/fatigued.png",
    "flat-footed": "systems/sfrpg/icons/conditions/flatfooted.png",
    "frightened": "systems/sfrpg/icons/conditions/frightened.png",
    "grappled": "systems/sfrpg/icons/conditions/grappled.png",
    "helpless": "systems/sfrpg/icons/conditions/helpless.png",
    "nauseated": "systems/sfrpg/icons/conditions/nauseated.png",
    "off-kilter": "systems/sfrpg/icons/conditions/offkilter.png",
    "off-target": "systems/sfrpg/icons/conditions/offtarget.png",
    "overburdened": "systems/sfrpg/icons/conditions/overburdened.png",
    "panicked": "systems/sfrpg/icons/conditions/panicked.png",
    "paralyzed": "systems/sfrpg/icons/conditions/paralyzed.png",
    "pinned": "systems/sfrpg/icons/conditions/pinned.png",
    "prone": "systems/sfrpg/icons/conditions/prone.png",
    "shaken": "systems/sfrpg/icons/conditions/shaken.png",
    "sickened": "systems/sfrpg/icons/conditions/sickened.png",
    "stable": "systems/sfrpg/icons/conditions/stable.png",
    "staggered": "systems/sfrpg/icons/conditions/staggered.png",
    "stunned": "systems/sfrpg/icons/conditions/stunned.png",
    "unconscious": "systems/sfrpg/icons/conditions/unconscious.png"
};

// TODO localize
SFRPG.conditions = {
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
    "dying": {
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
    "flat-footed": {
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
    "off-kilter": {
        modifiers: [],
        tooltip: "<strong>Off-kilter</strong><br><br>You can't take move actions except to right yourself, you take a -2 penalty to attacks, and you're flat-footed."
    },
    "off-target": {
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

// TODO localize
SFRPG.characterFlags = {
    "solarianAttunement": {
        name: "Solarian Attunement",
        hint: "You can enabled the management of attenument inside the combat tracker.",
        section: "SFRPG.CharacterFlagsSectionClassFeatures",
        type: Boolean
    }/*, //Disable temporary the time than Vanguard and Qi Soldier mechanical system be ready
    "vanguardEntropy": {
        name: "Vanguard's Entropy Points",
        hint: "You can enabled the management of Entropy Points inside the combat tracker.",
        section: "SFRPG.CharacterFlagsSectionClassFeatures",
        type: Boolean
    },
    "soldierKi": {
        name: "Soldier Ki Points",
        hint: "You can enabled the management of Solider Ki Point inside the combat tracker.",
        section: "SFRPG.CharacterFlagsSectionClassFeatures",
        type: Boolean
    }*/
};

/**
 * Saving throw modifier progression
 */
SFRPG.counterClassesLabel = {
    "soldierKi": "SFRPG.CounterClassesKiSoldier",
    "vanguardEntropy": "SFRPG.CounterClassesVanguard",
    "solarianAttunement": "SFRPG.CounterClassesSolarian"
};

SFRPG.droneHitpointsPerLevel = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 190, 210, 230];
SFRPG.droneResolveMethod = (droneLevel) => { return (droneLevel >= 10 ? Math.floor(droneLevel / 2) : 0); }
SFRPG.droneACBonusPerLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
SFRPG.droneBABBonusPerLevel = [1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 15];
SFRPG.droneGoodSaveBonusPerLevel = [2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 9, 9, 9];
SFRPG.droneBadSaveBonusPerLevel = [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5];
SFRPG.droneFeatsPerLevel = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8];
SFRPG.droneModsPerLevel = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
SFRPG.droneAbilityScoreIncreaseLevels = [4, 7, 10, 13, 16, 19];

SFRPG.capacityUsagePer = {
    "action": "SFRPG.Capacity.UsagePer.Action",
    "shot": "SFRPG.Capacity.UsagePer.Shot",
    "round": "SFRPG.Capacity.UsagePer.Round",
    "minute": "SFRPG.Capacity.UsagePer.Minute",
    "hour": "SFRPG.Capacity.UsagePer.Hour",
    "day": "SFRPG.Capacity.UsagePer.Day"
};

SFRPG.itemTypes = {
    "asi": "SFRPG.Items.Categories.AbilityScoreIncrease",
    "archetypes": "SFRPG.Items.Categories.Archetypes",
    "augmentation": "SFRPG.Items.Categories.Augmentations",
    "chassis": "SFRPG.Items.Categories.DroneChassis",
    "class": "SFRPG.Items.Categories.Classes",
    "consumable": "SFRPG.Items.Categories.Consumables",
    "container": "SFRPG.Items.Categories.Containers",
    "equipment": "SFRPG.Items.Categories.Armor",
    "feat": "SFRPG.Items.Categories.Feats",
    "fusion": "ITEM.TypeFusion",
    "goods": "SFRPG.Items.Categories.Goods",
    "hybrid": "SFRPG.Items.Categories.HybridItems",
    "magic": "SFRPG.Items.Categories.MagicItems",
    "mod": "SFRPG.Items.Categories.DroneMods",
    "race": "SFRPG.Items.Categories.Races",
    "spell": "SFRPG.Items.Categories.Spells",
    "starshipAction": "SFRPG.Items.Categories.StarshipActions",
    "starshipAblativeArmor": "SFRPG.Items.Categories.StarshipAblativeArmors",
    "starshipArmor": "SFRPG.Items.Categories.StarshipArmors",
    "starshipComputer": "SFRPG.Items.Categories.StarshipComputers",
    "starshipCrewQuarter": "SFRPG.Items.Categories.StarshipCrewQuarters",
    "starshipDefensiveCountermeasure": "SFRPG.Items.Categories.StarshipDefensiveCountermeasures",
    "starshipDriftEngine": "SFRPG.Items.Categories.StarshipDriftEngine",
    "starshipExpansionBay": "SFRPG.Items.Categories.StarshipExpansionBays",
    "starshipFortifiedHull": "SFRPG.Items.Categories.StarshipFortifiedHulls",
    "starshipFrame": "SFRPG.Items.Categories.StarshipFrames",
    "starshipOtherSystem": "SFRPG.Items.Categories.StarshipOtherSystems",
    "starshipPowerCore": "SFRPG.Items.Categories.StarshipPowerCores",
    "starshipReinforcedBulkhead": "SFRPG.Items.Categories.StarshipReinforcedBulkheads",
    "starshipSecuritySystem": "SFRPG.Items.Categories.StarshipSecuritySystems",
    "starshipSensor": "SFRPG.Items.Categories.StarshipSensors",
    "starshipShield": "SFRPG.Items.Categories.StarshipShields",
    "starshipThruster": "SFRPG.Items.Categories.StarshipThrusters",
    "starshipWeapon": "SFRPG.Items.Categories.StarshipWeapons",
    "technological": "SFRPG.Items.Categories.TechnologicalItems",
    "theme": "SFRPG.Items.Categories.Themes",
    "upgrade": "ITEM.TypeUpgrade",
    "weapon": "SFRPG.Items.Categories.Weapons",
    "shield": "SFRPG.Items.Categories.Shields",
    "ammunition": "SFRPG.Items.Categories.Ammunition",
    "weaponAccessory": "ITEM.TypeWeaponaccessory",
    "vehicleAttack": "SFRPG.Items.Categories.VehicleAttacks",
    "vehicleSystem": "SFRPG.Items.Categories.VehicleSystems"
};

SFRPG.containableTypes = {
    "weapon"       : "SFRPG.Items.Categories.Weapons",
    "equipment"    : "SFRPG.Items.Categories.Equipment",
    "consumable"   : "SFRPG.Items.Categories.Consumables",
    "goods"        : "SFRPG.Items.Categories.Goods",
    "container"    : "SFRPG.Items.Categories.Containers",
    "hybrid"       : "SFRPG.Items.Categories.HybridItems",
    "magic"        : "SFRPG.Items.Categories.MagicItems",
    "technological": "SFRPG.Items.Categories.TechnologicalItems",
    "fusion"       : "SFRPG.Items.Categories.WeaponFusions",
    "upgrade"      : "SFRPG.Items.Categories.ArmorUpgrades",
    "spell"        : "SFRPG.Items.Categories.Spells",
    "augmentation" : "SFRPG.Items.Categories.Augmentations",
    "shield"       : "SFRPG.Items.Categories.Shields",
    "weaponAccessory": "SFRPG.Items.Categories.WeaponAccessories",
    "vehicleAttack": "SFRPG.Items.Categories.VehicleAttacks",
    "vehicleSystem": "SFRPG.Items.Categories.VehicleSystems"
};

SFRPG.combatTypes = [
    "normal",
    "starship",
    "vehicleChase"
];

/**
 * The supported weapon types for weapon accessories
 */
SFRPG.weaponAccessoriesSupportedTypes = {
    "any": "SFRPG.Items.WeaponAccessory.SupportedType.Any",
    "heavyWeapon": "SFRPG.Items.WeaponAccessory.SupportedType.HeavyWeapon",
    "meleeWeapon": "SFRPG.Items.WeaponAccessory.SupportedType.MeleeWeapon",
    "projectile": "SFRPG.Items.WeaponAccessory.SupportedType.Projectile",
    "railedWeapon": "SFRPG.Items.WeaponAccessory.SupportedType.RailedWeapon",
    "smallarm": "SFRPG.Items.WeaponAccessory.SupportedType.SmallArm"
};