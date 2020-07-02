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
    "sonic": "SFRPG.DamageTypesSonic"
};

SFRPG.kineticDamageTypes = {
    "bludgeoning": "SFRPG.DamageTypesBludgeoning",
    "piercing": "SFRPG.DamageTypesPiercing",
    "slashing": "SFRPG.DamageTypesSlashing"
};

SFRPG.damageTypes = {
    ...SFRPG.energyDamageTypes,
    ...SFRPG.kineticDamageTypes
};

SFRPG.weaponDamageTypes = {
    "acid": "SFRPG.DamageTypesAcid",
    "acid+bludgeoning": "SFRPG.DamageTypesAcidAndBludgeoning",
    "acid+fire": "SFRPG.DamageTypesAcidAndFire",
    "acid+piercing": "SFRPG.DamageTypesAcidAndPiercing",
    "acid+slashing": "SFRPG.DamageTypesAcidAndSlashing",
    "acid|fire": "SFRPG.DamageTypesAcidOrFire",
    "acid|slashing": "SFRPG.DamageTypesAcidOrSlashing",    
    "cold": "SFRPG.DamageTypesCold",
    "cold+piercing": "SFRPG.DamageTypesColdAndPiercing",
    "cold|fire": "SFRPG.DamageTypesColdOrFire",
    "electricity": "SFRPG.DamageTypesElectricity",
    "electricity+fire": "SFRPG.DamageTypesElectricityAndFire",
    "electricity+piercing": "SFRPG.DamageTypesElectricityAndPiercing",
    "electricity+slashing": "SFRPG.DamageTypesElectricityAndSlashing",
    "fire": "SFRPG.DamageTypesFire",
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
    "cryo": "SFRPG.WeaponCategoriesCryo",
    "flame": "SFRPG.WeaponCategoriesFlame",
    "laser": "SFRPG.WeaponCategoriesLaser",
    "plasma": "SFRPG.WeaponCategoriesPlasma",
    "projectile": "SFRPG.WeaponCategoriesProjectile",
    "shock": "SFRPG.WeaponCategoriesShock",
    "sonic": "SFRPG.WeaponCategoriesSonic",
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
    "relic": "SFRPG.WeaponPropertiesRelic",
    "reposition": "SFRPG.WeaponPropertiesReposition",
    "shape": "SFRPG.WeaponPropertiesShape",
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
    "underwater": "SFRPG.WeaponPropertiesUnderwater",
    "unwieldy": "SFRPG.WeaponPropertiesUnwieldy",
    "variantBoost": "SFRPG.WeaponPropertiesVariantBoost",
    "wideLine": "SFRPG.WeaponPropertiesWideLine"
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
    "burst": "Burst",
    "emanation": "Emanation",
    "spread": "Spread"
}

// Weapon special abilities
SFRPG.weaponSpecial = {
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
SFRPG.weaponCriticalHitEffects = {
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
SFRPG.armorTypes = {
    "light": "Light Armor",
    "heavy": "Heavy Armor",
    "power": "Power Armor",
    "shield": "Shields"
};

SFRPG.equipmentTypes = SFRPG.armorTypes;

// Spell Schools
SFRPG.spellSchools = {
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
SFRPG.spellLevels = {
    0: "0 Level",
    1: "1st Level",
    2: "2nd Level",
    3: "3rd Level",
    4: "4th Level",
    5: "5th Level",
    6: "6th Level"
};

// Feat types
SFRPG.featTypes = {
    "general": "General Feats",
    "combat": "Combat Feats"
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
    "myst": "Mystic",
    "tech": "Technomancer",
    "wysh": "Witchwarper"
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
    "dyning": "SFRPG.ConditionsDying",
    "encumbered": "SFRPG.ConditionsEncumbered",
    "entangled": "SFRPG.ConditionsEntangled",
    "exhausted": "SFRPG.ConditionsExhausted",
    "fascinated": "SFRPG.ConditionsFascinated",
    "fatigued": "SFRPG.ConditionsFatigued",
    "flatfooted": "SFRPG.ConditionsFlatFooted",
    "frightened": "SFRPG.ConditionsFrightened",
    "grappled": "SFRPG.ConditionsGrappled",
    "helpless": "SFRPG.ConditionsHelpless",
    "nauseated": "SFRPG.ConditionsNauseated",
    "offkilter": "SFRPG.ConditionsOffKilter",
    "offtarget": "SFRPG.ConditionsOffTarget",
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
	"ysoki": "SFRPG.LanguagesYosoki"
};

SFRPG.augmentationTypes = {
    "cybernetic": "SFRPG.Cybernetic",
    "biotech": "SFRPG.Biotech",
    "magitech": "SFRPG.Magitech",
    "necrograft": "SFRPG.Necrograft",
    "personal": "SFRPG.PersonalUpgrade"
};

SFRPG.consumableTypes = {
    "serum": "Serums",
    "ampoule": "Spell Ampoules",
    "spellGem": "Spell Gems",
    "drugs": "Drugs",
    "medicne": "Medicinals",
    "poison": "Poisons"
};

SFRPG.augmentationSytems = {
    "arm": "SFRPG.AugArm",
    "allArms": "SFRPG.AugAllArms",
    "brain": "SFRPG.AugBrain",
    "ears": "SFRPG.AugEars",
    "eyes": "SFRPG.AugEyes",
    "foot": "SFRPG.AugFoot",
    "allFeet": "SFRPG.AugAllFeet",
    "hand": "SFRPG.AugHand",
    "allHands": "SFRPG.AugAllHands",
    "heart": "SFRPG.AugHeart",
    "leg": "SFRPG.AugLeg",
    "allLegs": "SFRPG.AugAllLegs",
    "lungs": "SFRPG.AugLungs",
    "spinal": "SFRPG.AugSpinalColumn",
    "skin": "SFRPG.AugSkin",
    "throat": "SFRPG.AugThroat"
};

/*--------------------------------*
 * Starship properties and values *
 *--------------------------------*/
SFRPG.maneuverability = {
    "clumsy": "Clumsy",
    "poor": "Poor",
    "average": "Average",
    "good": "Good",
    "perfect": "Perfect"
};

SFRPG.powerCoreSystems = {
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

SFRPG.thrusterSystems = {
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

SFRPG.armorSystems = {
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

SFRPG.computerSystems = {
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

SFRPG.crewQuarterSystems = {
    "common": "Common",
    "good": "Good",
    "luxurious": "Luxurious"
};

SFRPG.defenseSystems = {
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

SFRPG.driftEngineSystems = {
    "basic": "Signal Basic",
    "booster": "Signal Booster",
    "major": "Signal Major",
    "superior": "Signal Superior",
    "ultra": "Signal Ultra"
};

SFRPG.sensorSystems = {
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

SFRPG.shieldSystems = {
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

SFRPG.expansionBaySystems = {
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

SFRPG.securitySystems = {
    "antiHack": "Anti-Hacking Sytems",
    "antiPer": "Antipersonnel Weapon",
    "bio": "Biometric Locks",
    "compCounter": "Computer Countermeasures",
    "selfDestruct": "Self-Destruct System"
};

// TODO: Not currently used, but keeping it here
// for future use
SFRPG.baseFrames = {
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
SFRPG.starshipWeaponTypes = {
    "direct": "Direct-fire",
    "tracking": "Tracking"
};

SFRPG.starshipWeaponClass = {
    "light": "Light",
    "heavy": "Heavy",
    "capital": "Capital"
};

SFRPG.starshipWeaponProperties = {
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

SFRPG.starshipArcs = {
    "forward": "Forward",
    "starboard": "Starboard",
    "aft": "Aft",
    "port": "Port",
    "turret": "Turret"
};

SFRPG.starshipWeaponRanges = {
    "short": "Short",
    "medium": "Medium",
    "long": "Long"
};

SFRPG.starshipRoles = {
    "pilot": "Pilot",
    "captain": "Captain",
    "engineers": "Engineers",
    "gunners": "Gunners",
    "scienceOfficers": "Science Officers",
    "passengers": "Passengers"
};

// starship value maps
SFRPG.shieldsMap = {
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

SFRPG.armorDefenseMap = {
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

SFRPG.thrustersMap = {
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

SFRPG.powercoreMap = {
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

SFRPG.driftEngineMap = {
    "basic": 1,
    "booster": 2,
    "major": 3,
    "superior": 4,
    "ultra": 5
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
    "land": "Land",
    "water": "Water",
    "hover": "Hover",
    "landW": "Land and water",
    "air": "Air",
    "landA": "Land and air"
};

SFRPG.vehicleCoverTypes = {
    "none": "None",
    "cover": "Cover",
    "soft": "Soft cover",
    "partial": "Partial cover",
    "total": "Total cover"
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

SFRPG.modifierEffectTypes = {
    "ac": "SFRPG.ModifierEffectTypeAC",
    "cmd": "SFRPG.ModifierEffectTypeCMD",
    "acp": "SFRPG.ModifierEffectTypeACP",
    "initiative": "SFRPG.ModifierEffectTypeInit",
    "ability-skills": "SFRPG.ModifierEffectTypeAbilitySkills",
    "skill": "SFRPG.ModifierEffectTypeSkill",
    "all-skills": "SFRPG.ModifierEffectTypeAllSkills",
    "saves": "SFRPG.ModifierEffectTypeSaves",
    "save": "SFRPG.ModifierEffectTypeSave"
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
    "dyning": "systems/sfrpg/icons/conditions/dying.png",
    "encumbered": "systems/sfrpg/icons/conditions/encumbered.png",
    "entangled": "systems/sfrpg/icons/conditions/entangled.png",
    "exhausted": "systems/sfrpg/icons/conditions/exhausted.png",
    "fascinated": "systems/sfrpg/icons/conditions/fascinated.png",
    "fatigued": "systems/sfrpg/icons/conditions/fatigued.png",
    "flatfooted": "systems/sfrpg/icons/conditions/flatfooted.png",
    "frightened": "systems/sfrpg/icons/conditions/frightened.png",
    "grappled": "systems/sfrpg/icons/conditions/grappled.png",
    "helpless": "systems/sfrpg/icons/conditions/helpless.png",
    "nauseated": "systems/sfrpg/icons/conditions/nauseated.png",
    "offkilter": "systems/sfrpg/icons/conditions/offkilter.png",
    "offtarget": "systems/sfrpg/icons/conditions/offtarget.png",
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

SFRPG.allowedClasses = {
    "myst": "Mystic",
    "tech": "Technomancer",
    "wysh": "Witchwarper"
};

SFRPG.characterFlags = {
    "improvedInititive": {
        name: "SFRPG.ImprovedInitiativeLabel",
        hint: "SFRPG.ImprovedInitiativeHint",
        section: "SFRPG.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "greatFortitude": {
        name: "SFRPG.GreatFortitudeLabel",
        hint: "SFRPG.GreatFortitudeHint",
        section: "SFRPG.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "ironWill": {
        name: "SFRPG.IronWillLabel",
        hint: "SFRPG.IronWillHint",
        section: "SFRPG.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "lightningReflexes": {
        name: "SFRPG.LightningReflexesLabel",
        hint: "SFRPG.LightningReflexesHint",
        section: "SFRPG.CharacterFlagsSectionFeats",
        type: Boolean
    },
    "flatAffect": {
        name: "Flat Affect",
        hint: "You take a -2 penalty to Sense Motive checks, but the DCs of Sense Motive checks attempted against you increase by 2.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "historian": {
        name: "Historian",
        hint: "Due to your in-depth historical training and the wide-ranging academic background knowledge you possess, you receive a +2 racial bonus to Culture checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "naturalGrace": {
        name: "Natural Grace",
        hint: "You recieve a +2 racial bonus to Acrobatics and Athletics checks",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "culturalFascination": {
        name: "Cultural Fascination",
        hint: "You recieve a +2 racial bonus to Culture and Diplomacy checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "armorSavant": {
        name: "Armor Savant",
        hint: "When wearing armor, you gain a +1 racial bonus to AC. When you're wearing heavy armor, your armor check penalty is 1 less severe than normal.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "scrounger": {
        name: "Scrounger",
        hint: "You receive a +2 racial bonus to Engineering, Stealth, and Survival checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "elvenMagic": {
        name: "Elven Magic",
        hint: "You receive a +2 racial bonus to caster level checks to overcome spell resistance. In addition, you receive a +2 racial bonus to Mysticism skill checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "keenSenses": {
        name: "Keen Senses",
        hint: "You receive a +2 racial bonus to Perception skill checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "curious": {
        name: "Curious",
        hint: "You receive a +2 racial bonus to Culture checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "intimidating": {
        name: "Intimidating",
        hint: "You receive a +2 racial bonus to Intimidate skill checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "selfSufficient": {
        name: "Self-Sufficient",
        hint: "You receive a +2 racial bonus to Survival skill checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "halflingLuck": {
        name: "Halfling Luck",
        hint: "Halflings receive a +1 racial bonus to all saving throws.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "sneaky": {
        name: "Sneaky",
        hint: "You receive a +2 racial bonus to Stealth checks",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "sureFooted": {
        name: "Sure-Footed",
        hint: "You receive a +2 racial bonus to Acrobatics and Athletics skill checks.",
        section: "SFRPG.CharacterFlagsSectionRacialTraits",
        type: Boolean
    },
    "rapidResponse": {
        name: "Rapid Response",
        hint: "You gain +4 bonus to initiative checks and increase your land speed by 10 feet.",
        section: "SFRPG.CharacterFlagsSectionClassFeatures",
        type: Boolean
    },
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
