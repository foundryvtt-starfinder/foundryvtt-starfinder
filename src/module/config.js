import BrowserEnricher from "./system/enrichers/browser.js";
import CheckEnricher from "./system/enrichers/check.js";
import IconEnricher from "./system/enrichers/icon.js";

// Namespace SFRPG Configuration Values
export const SFRPG = {};

SFRPG.actorTypes = {
    "character": "ACTOR.TypeCharacter",
    "drone": "ACTOR.TypeDrone",
    "hazard": "ACTOR.TypeHazard",
    "npc": "ACTOR.TypeNpc",
    "npc2": "ACTOR.TypeNpc2",
    "starshop": "ACTOR.TypeStarship",
    "vehicle": "ACTOR.TypeVehicle"
};

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
 * NPC alignment options
 * @type {Object}
 */
SFRPG.alignmentsNPC = {
    "lg": "SFRPG.AlignmentLG",
    "ng": "SFRPG.AlignmentNG",
    "cg": "SFRPG.AlignmentCG",
    "ln": "SFRPG.AlignmentLN",
    "n": "SFRPG.AlignmentTN",
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
    "round": "SFRPG.AbilityActivationTypesRound",
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
    "credit": "SFRPG.Currencies.Credits",
    "upb": "SFRPG.Currencies.UPBs",
    "bp": "SFRPG.Currencies.BPs"
};

// Damage Types
SFRPG.energyDamageTypes = {
    "acid": "SFRPG.Damage.Types.Acid",
    "cold": "SFRPG.Damage.Types.Cold",
    "electricity": "SFRPG.Damage.Types.Electricity",
    "fire": "SFRPG.Damage.Types.Fire",
    "sonic": "SFRPG.Damage.Types.Sonic"
};

SFRPG.kineticDamageTypes = {
    "bludgeoning": "SFRPG.Damage.Types.Bludgeoning",
    "piercing": "SFRPG.Damage.Types.Piercing",
    "slashing": "SFRPG.Damage.Types.Slashing"
};

SFRPG.damageTypeToAcronym = {
    "acid": "A",
    "cold": "C",
    "electricity": "E",
    "fire": "F",
    "sonic": "So",
    "bludgeoning": "B",
    "piercing": "P",
    "slashing": "S"
};

SFRPG.damageTypes = {
    ...SFRPG.energyDamageTypes,
    ...SFRPG.kineticDamageTypes,
    "radiation": "SFRPG.Damage.Types.Radiation",
    "nonlethal": "SFRPG.Damage.Types.Nonlethal"
};

SFRPG.damageTypeOperators = {
    "and": "SFRPG.Damage.Types.Operators.And",
    "or": "SFRPG.Damage.Types.Operators.Or"
};

SFRPG.descriptors = {
    "acid": "SFRPG.Descriptors.Acid",
    "air": "SFRPG.Descriptors.Air",
    "calling": "SFRPG.Descriptors.Calling",
    "chaotic": "SFRPG.Descriptors.Chaotic",
    "charm": "SFRPG.Descriptors.Charm",
    "cold": "SFRPG.Descriptors.Cold",
    "compulsion": "SFRPG.Descriptors.Compulsion",
    "creation": "SFRPG.Descriptors.Creation",
    "curse": "SFRPG.Descriptors.Curse",
    "darkness": "SFRPG.Descriptors.Darkness",
    "death": "SFRPG.Descriptors.Death",
    "disease": "SFRPG.Descriptors.Disease",
    "earth": "SFRPG.Descriptors.Earth",
    "electricity": "SFRPG.Descriptors.Electricity",
    "emotion": "SFRPG.Descriptors.Emotion",
    "evil": "SFRPG.Descriptors.Evil",
    "fear": "SFRPG.Descriptors.Fear",
    "fire": "SFRPG.Descriptors.Fire",
    "force": "SFRPG.Descriptors.Force",
    "good": "SFRPG.Descriptors.Good",
    "healing": "SFRPG.Descriptors.Healing",
    "language-dependent": "SFRPG.Descriptors.LanguageDependent",
    "lawful": "SFRPG.Descriptors.Lawful",
    "light": "SFRPG.Descriptors.Light",
    "mind-affecting": "SFRPG.Descriptors.MindAffecting",
    "pain": "SFRPG.Descriptors.Pain",
    "poison": "SFRPG.Descriptors.Poison",
    "polymorph": "SFRPG.Descriptors.Polymorph",
    "radiation": "SFRPG.Descriptors.Radiation",
    "scrying": "SFRPG.Descriptors.Scrying",
    "sense-dependent": "SFRPG.Descriptors.SenseDependent",
    "shadow": "SFRPG.Descriptors.Shadow",
    "sonic": "SFRPG.Descriptors.Sonic",
    "summoning": "SFRPG.Descriptors.Summoning",
    "teleportation": "SFRPG.Descriptors.Teleportation",
    "water": "SFRPG.Descriptors.Water"
};

SFRPG.descriptorsTooltips = {
    "calling": "SFRPG.Descriptors.CallingDescription",
    "charm": "SFRPG.Descriptors.CharmDescription",
    "compulsion": "SFRPG.Descriptors.CompulsionDescription",
    "creation": "SFRPG.Descriptors.CreationDescription",
    "force": "SFRPG.Descriptors.ForceDescription",
    "language-dependent": "SFRPG.Descriptors.LanguageDependentDescription",
    "mind-affecting": "SFRPG.Descriptors.MindAffectingDescription",
    "pain": "SFRPG.Descriptors.PainDescription",
    "scrying": "SFRPG.Descriptors.ScryingDescription",
    "sense-dependent": "SFRPG.Descriptors.SenseDependentDescription",
    "shadow": "SFRPG.Descriptors.ShadowDescription",
    "summoning": "SFRPG.Descriptors.SummoningDescription",
    "teleportation": "SFRPG.Descriptors.TeleportationDescription"
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
    "slashing+sonic": "SFRPG.DamageTypesSlashingAndSonic"
};

SFRPG.ammunitionTypes = {
    "charge": "SFRPG.Items.Ammunition.Type.Charges",
    "roundS": "SFRPG.Items.Ammunition.Type.SmallArmRounds",
    "roundL": "SFRPG.Items.Ammunition.Type.LongarmAndSniperRounds",
    "roundH": "SFRPG.Items.Ammunition.Type.HeavyRounds",
    "arrow": "SFRPG.Items.Ammunition.Type.Arrows",
    "dart": "SFRPG.Items.Ammunition.Type.Darts",
    "fuel": "SFRPG.Items.Ammunition.Type.Fuel",
    "missile": "SFRPG.Items.Ammunition.Type.Missiles",
    "rocket": "SFRPG.Items.Ammunition.Type.Rockets",
    "shell": "SFRPG.Items.Ammunition.Type.Shells",
    "flare": "SFRPG.Items.Ammunition.Type.Flares",
    "flechettes": "SFRPG.Items.Ammunition.Type.Flechettes",
    "nanite": "SFRPG.Items.Ammunition.Type.Nanites",
    "caustrol": "SFRPG.Items.Ammunition.Type.Caustrol",
    "sclerite": "SFRPG.Items.Ammunition.Type.Sclerites",
    "moodGoo": "SFRPG.Items.Ammunition.Type.MoodGoo",
    "thasphalt": "SFRPG.Items.Ammunition.Type.Thasphalt",
    "thasteronPellets": "SFRPG.Items.Ammunition.Type.ThasteronPellets"
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
    "bs": "SFRPG.SensesTypes.SensesBS",
    "bl": "SFRPG.SensesTypes.SensesBL",
    "dark": "SFRPG.SensesTypes.SensesDark",
    "llv": "SFRPG.SensesTypes.SensesLLV",
    "st": "SFRPG.SensesTypes.SensesST"
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
    "buttressing": "SFRPG.WeaponPropertiesButtressing",
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
    "gearArray": "SFRPG.WeaponPropertiesGearArray",
    "grapple": "SFRPG.WeaponPropertiesGrapple",
    "gravitation": "SFRPG.WeaponPropertiesGravitation",
    "guided": "SFRPG.WeaponPropertiesGuided",
    "harrying": "SFRPG.WeaponPropertiesHarrying",
    "holyWater": "SFRPG.WeaponPropertiesHolyWater",
    "hybrid": "SFRPG.WeaponPropertiesHybrid",
    "hydrodynamic": "SFRPG.WeaponPropertiesHydrodynamic",
    "ignite": "SFRPG.WeaponPropertiesIgnite",
    "indirect": "SFRPG.WeaponPropertiesIndirect",
    "injection": "SFRPG.WeaponPropertiesInjection",
    "instrumental": "SFRPG.WeaponPropertiesInstrumental",
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
    "propel": "SFRPG.WeaponPropertiesPropel",
    "punchGun": "SFRPG.WeaponPropertiesPunchGun",
    "qreload": "SFRPG.WeaponPropertiesQuickReload",
    "radioactive": "SFRPG.WeaponPropertiesRadioactive",
    "reach": "SFRPG.WeaponPropertiesReach",
    "recall": "SFRPG.WeaponPropertiesRecall",
    "regrowth": "SFRPG.WeaponPropertiesRegrowth",
    "relic": "SFRPG.WeaponPropertiesRelic",
    "reposition": "SFRPG.WeaponPropertiesReposition",
    "scramble": "SFRPG.WeaponPropertiesScramble",
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
    "thruster": "SFRPG.WeaponPropertiesThruster",
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
    "buttressing": "SFRPG.WeaponPropertiesButtressingTooltip",
    "conceal": "SFRPG.WeaponsPropertiesConcealTooltip",
    "cluster": "SFRPG.WeaponPropertiesClusterTooltip",
    "deconstruct": "SFRPG.WeaponPropertiesDeconstructTooltip",
    "deflect": "SFRPG.WeaponPropertiesDeflectTooltip",
    "disarm": "SFRPG.WeaponPropertiesDisarmTooltip",
    "double": "SFRPG.WeaponPropertiesDoubleTooltip",
    "drainCharge": "SFRPG.WeaponPropertiesDrainChargeTooltip",
    "echo": "SFRPG.WeaponPropertiesEchoTooltip",
    "entangle": "SFRPG.WeaponPropertiesEntangleTooltip",
    "explode": "SFRPG.WeaponPropertiesExplodeTooltip",
    "extinguish": "SFRPG.WeaponPropertiesExtinguishTooltip",
    "feint": "SFRPG.WeaponPropertiesFeintTooltip",
    "fiery": "SFRPG.WeaponPropertiesFieryTooltip",
    "firstArc": "SFRPG.WeaponPropertiesFirstArcTooltip",
    "flexibleLine": "SFRPG.WeaponPropertiesFlexibleLineTooltip",
    "force": "SFRPG.WeaponPropertiesForceTooltip",
    "freeHands": "SFRPG.WeaponPropertiesFreeHandsTooltip",
    "fueled": "SFRPG.WeaponPropertiesFueledTooltip",
    "gearArray": "SFRPG.WeaponPropertiesGearArrayTooltip",
    "grapple": "SFRPG.WeaponPropertiesGrappleTooltip",
    "gravitation": "SFRPG.WeaponPropertiesGravitationTooltip",
    "guided": "SFRPG.WeaponPropertiesGuidedTooltip",
    "harrying": "SFRPG.WeaponPropertiesHarryingTooltip",
    "holyWater": "SFRPG.WeaponPropertiesHolyWaterTooltip",
    "hybrid": "SFRPG.WeaponPropertiesHybridTooltip",
    "hydrodynamic": "SFRPG.WeaponPropertiesHydrodynamicTooltip",
    "ignite": "SFRPG.WeaponPropertiesIgniteTooltip",
    "indirect": "SFRPG.WeaponPropertiesIndirectTooltip",
    "injection": "SFRPG.WeaponPropertiesInjectionTooltip",
    "instrumental": "SFRPG.WeaponPropertiesInstrumentalTooltip",
    "integrated": "SFRPG.WeaponPropertiesIntegratedTooltip",
    "line": "SFRPG.WeaponPropertiesLineTooltip",
    "living": "SFRPG.WeaponPropertiesLivingTooltip",
    "lockdown": "SFRPG.WeaponPropertiesLockdownTooltip",
    "mind-affecting": "SFRPG.WeaponPropertiesMindAffectingTooltip",
    "mine": "SFRPG.WeaponPropertiesMineTooltip",
    "mire": "SFRPG.WeaponPropertiesMireTooltip",
    "modal": "SFRPG.WeaponPropertiesModalTooltip",
    "necrotic": "SFRPG.WeaponPropertiesNecroticTooltip",
    "nonlethal": "SFRPG.WeaponPropertiesNonlethalTooltip",
    "operative": "SFRPG.WeaponPropertiesOperativeTooltip",
    "penetrating": "SFRPG.WeaponPropertiesPenetratingTooltip",
    "polarize": "SFRPG.WeaponPropertiesPolarizeTooltip",
    "polymorphic": "SFRPG.WeaponPropertiesPolymorphicTooltip",
    "powered": "SFRPG.WeaponPropertiesPoweredTooltip",
    "professional": "SFRPG.WeaponPropertiesProfessionalTooltip",
    "punchGun": "SFRPG.WeaponPropertiesPunchGunTooltip",
    "propel": "SFRPG.WeaponPropertiesPropelTooltip",
    "qreload": "SFRPG.WeaponPropertiesQuickReloadTooltip",
    "radioactive": "SFRPG.WeaponPropertiesRadioactiveTooltip",
    "reach": "SFRPG.WeaponPropertiesReachTooltip",
    "recall": "SFRPG.WeaponPropertiesRecallTooltip",
    "regrowth": "SFRPG.WeaponPropertiesRegrowthTooltip",
    "relic": "SFRPG.WeaponPropertiesRelicTooltip",
    "reposition": "SFRPG.WeaponPropertiesRepositionTooltip",
    "scramble": "SFRPG.WeaponPropertiesScrambleTooltip",
    "shape": "SFRPG.WeaponPropertiesShapeTooltip",
    "shatter": "SFRPG.WeaponPropertiesShatterTooltip",
    "shells": "SFRPG.WeaponPropertiesShellsTooltip",
    "shield": "SFRPG.WeaponPropertiesShieldTooltip",
    "sniper": "SFRPG.WeaponPropertiesSniperTooltip",
    "stun": "SFRPG.WeaponPropertiesStunTooltip",
    "subtle": "SFRPG.WeaponPropertiesSubtleTooltip",
    "sunder": "SFRPG.WeaponPropertiesSunderTooltip",
    "swarm": "SFRPG.WeaponPropertiesSwarmTooltip",
    "tail": "SFRPG.WeaponPropertiesTailTooltip",
    "teleportive": "SFRPG.WeaponPropertiesTeleportiveTooltip",
    "thought": "SFRPG.WeaponPropertiesThoughtTooltip",
    "throttle": "SFRPG.WeaponPropertiesThrottleTooltip",
    "thrown": "SFRPG.WeaponPropertiesThrownTooltip",
    "thruster": "SFRPG.WeaponPropertiesThrusterTooltip",
    "trip": "SFRPG.WeaponPropertiesTripTooltip",
    "unbalancing": "SFRPG.WeaponPropertiesUnbalancingTooltip",
    "underwater": "SFRPG.WeaponPropertiesUnderwaterTooltip",
    "unwieldy": "SFRPG.WeaponPropertiesUnwieldyTooltip",
    "variantBoost": "SFRPG.WeaponPropertiesVariantBoostTooltip",
    "wideLine": "SFRPG.WeaponPropertiesWideLineTooltip"
};

SFRPG.specialMaterials = {
    "abysium": "SFRPG.SpecialMaterials.Abysium",
    "adamantine": "SFRPG.SpecialMaterials.Adamantine",
    "coldiron": "SFRPG.SpecialMaterials.ColdIron",
    "diatha": "SFRPG.SpecialMaterials.Diatha",
    "djezet": "SFRPG.SpecialMaterials.Djezet",
    "horacalcum": "SFRPG.SpecialMaterials.Horacalcum",
    "inubrix": "SFRPG.SpecialMaterials.Inubrix",
    "khefak": "SFRPG.SpecialMaterials.Khefak",
    "noqual": "SFRPG.SpecialMaterials.Noqual",
    "nyblantine": "SFRPG.SpecialMaterials.Nyblantine",
    "purplecores": "SFRPG.SpecialMaterials.PurpleCores",
    "siccatite": "SFRPG.SpecialMaterials.Siccatite",
    "silver": "SFRPG.SpecialMaterials.Silver",
    "voidglass": "SFRPG.SpecialMaterials.Voidglass"
};

// Damage Reductions
SFRPG.damageReductionTypes = {
    "": "-",
    ...SFRPG.specialMaterials,
    "custom": "SFRPG.Damage.Types.Custom"
};

// Energy Resistances
SFRPG.energyResistanceTypes = {
    "acid": "SFRPG.Damage.Types.Acid",
    "cold": "SFRPG.Damage.Types.Cold",
    "electricity": "SFRPG.Damage.Types.Electricity",
    "fire": "SFRPG.Damage.Types.Fire",
    "sonic": "SFRPG.Damage.Types.Sonic",
    "custom": "SFRPG.Damage.Types.Custom"
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
// I don't think this is actually used anywhere, but let's keep this and make featureCategories separate below.
SFRPG.featTypes = {
    "general": "SFRPG.FeatTypes.General",
    "combat" : "SFRPG.FeatTypes.Combat"
};

SFRPG.featureCategories = {
    "feat": {
        category: "SFRPG.ActorSheet.Features.Categories.Feats",
        label: "SFRPG.FeatureCategory.Feat",
        items: [],
        hasActions: false,
        dataset: { type: "feat", "category": "feat" }
    },
    "classFeature": {
        category: "SFRPG.ActorSheet.Features.Categories.ClassFeatures",
        label: "SFRPG.FeatureCategory.ClassFeature",
        items: [],
        hasActions: false,
        dataset: { type: "feat", "category": "classFeature" }
    },
    "speciesFeature": {
        category: "SFRPG.ActorSheet.Features.Categories.SpeciesFeatures",
        label: "SFRPG.FeatureCategory.SpeciesFeature",
        items: [],
        hasActions: false,
        dataset: { type: "feat", category: "speciesFeature" }
    },
    "archetypeFeature": {
        category: "SFRPG.ActorSheet.Features.Categories.ArchetypeFeatures",
        label: "SFRPG.FeatureCategory.ArchetypeFeature",
        items: [],
        hasActions: false,
        dataset: { type: "feat", category: "archetypeFeature" }
    },
    "themeFeature": {
        category: "SFRPG.ActorSheet.Features.Categories.ThemeFeatures",
        label: "SFRPG.FeatureCategory.ThemeFeature",
        items: [],
        hasActions: false,
        dataset: { type: "feat", category: "themeFeature" }
    },
    "universalCreatureRule": {
        category: "SFRPG.ActorSheet.Features.Categories.UniversalCreatureRules",
        label: "SFRPG.FeatureCategory.UniversalCreatureRule",
        items: [],
        hasActions: false,
        dataset: { type: "feat", category: "UniversalCreatureRule" }
    }
};

SFRPG.specialAbilityTypes = {
    "": "SFRPG.None",
    "ex": "SFRPG.SpecialAbilityTypes.Extraordinary",
    "su": "SFRPG.SpecialAbilityTypes.Supernatural",
    "sp": "SFRPG.SpecialAbilityTypes.SpellLike"
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

SFRPG.spellcastingClasses = {
    "myst": "SFRPG.AllowedClasses.Myst",
    "precog": "SFRPG.AllowedClasses.Precog",
    "tech": "SFRPG.AllowedClasses.Tech",
    "wysh": "SFRPG.AllowedClasses.Wysh"
};

SFRPG.itemActionTypes = {
    "mwak": "SFRPG.ActionMWAK",
    "rwak": "SFRPG.ActionRWAK",
    "msak": "SFRPG.ActionMSAK",
    "rsak": "SFRPG.ActionRSAK",
    "save": "SFRPG.ActionSave",
    "skill": "SFRPG.ActionSkill",
    "heal": "SFRPG.ActionHeal",
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
    "invisible": "SFRPG.ConditionsInvisible",
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
    "aballonian": "SFRPG.LanguagesAballonian",
    "abyssal": "SFRPG.LanguagesAbyssal",
    "aglian": "SFRPG.LanguagesAglian",
    "akan": "SFRPG.LanguagesAkan",
    "akiton": "SFRPG.LanguagesAkitonian",
    "aklo": "SFRPG.LanguagesAklo",
    "alkainish": "SFRPG.LanguagesAlkainish",
    "anassan": "SFRPG.LanguagesAnassan",
    "aquan": "SFRPG.LanguagesAquan",
    "arkanen": "SFRPG.LanguagesArkanen",
    "astriapi": "SFRPG.LanguagesAstriapi",
    "ancientDaimalkan": "SFRPG.LanguagesAncientDaimalkan",
    "auran": "SFRPG.LanguagesAuran",
    "azlanti": "SFRPG.LanguagesAzlanti",
    "bantridi": "SFRPG.LanguagesBantridi",
    "barathu": "SFRPG.LanguagesBarathu",
    "bolidan": "SFRPG.LanguagesBolidan",
    "brenneri": "SFRPG.LanguagesBrenneri",
    "brethedan": "SFRPG.LanguagesBrethedan",
    "castrovelian": "SFRPG.LanguagesCastrovelian",
    "celestial": "SFRPG.LanguagesCelestial",
    "common": "SFRPG.LanguagesCommon",
    "copaxi": "SFRPG.LanguagesCopaxi",
    "cyrunian": "SFRPG.LanguagesCyrunian",
    "daimalkan": "SFRPG.LanguagesDaimalkan",
    "dirindi": "SFRPG.LanguagesDirindi",
    "draconic": "SFRPG.LanguagesDraconic",
    "dromadan": "SFRPG.LanguagesDromadan",
    "drow": "SFRPG.LanguagesDrow",
    "dwarven": "SFRPG.LanguagesDwarven",
    "elven": "SFRPG.LanguagesElven",
    "embri": "SFRPG.LanguagesEmbri",
    "endiffian": "SFRPG.LanguagesEndiffian",
    "eoxian": "SFRPG.LanguagesEoxian",
    "espraksi": "SFRPG.LanguagesEspraksi",
    "ferran": "SFRPG.LanguagesFerran",
    "firstSpeech": "SFRPG.LanguagesFirstSpeech",
    "frujai": "SFRPG.LanguagesFrujai",
    "garaggakal": "SFRPG.LanguagesGaraggakal",
    "ghibran": "SFRPG.LanguagesGhibran",
    "ghoran": "SFRPG.LanguagesGhoran",
    "giant": "SFRPG.LanguagesGiant",
    "gnome": "SFRPG.LanguagesGnome",
    "goblin": "SFRPG.LanguagesGoblin",
    "grioth": "SFRPG.LanguagesGrioth",
    "gytchean": "SFRPG.LanguagesGytchean",
    "hadrogaan": "SFRPG.LanguagesHadrogaan",
    "halfling": "SFRPG.LanguagesHalfling",
    "hallas": "SFRPG.LanguagesHallas",
    "hortaa": "SFRPG.LanguagesHortaa",
    "ignan": "SFRPG.LanguagesIgnan",
    "ihonva": "SFRPG.LanguagesIhonva",
    "iji": "SFRPG.LanguagesIji",
    "ilthisarian": "SFRPG.LanguagesIlthisarian",
    "infernal": "SFRPG.LanguagesInfernal",
    "ixtangi": "SFRPG.LanguagesIxtangi",
    "izalguun": "SFRPG.LanguagesIzalguun",
    "jinsul": "SFRPG.LanguagesJinsul",
    "kalo": "SFRPG.LanguagesKalo",
    "kasatha": "SFRPG.LanguagesKasatha",
    "katholbi": "SFRPG.LanguagesKatholbi",
    "kiirinta": "SFRPG.LanguagesKiirinta",
    "koshorian": "SFRPG.LanguagesKoshorian",
    "kothama": "SFRPG.LanguagesKothama",
    "lexonian": "SFRPG.LanguagesLexonian",
    "lumos": "SFRPG.LanguagesLumos",
    "maraquoi": "SFRPG.LanguagesMaraquoi",
    "megalonic": "SFRPG.LanguagesMegalonic",
    "migo": "SFRPG.LanguagesMi-Go",
    "morlamaw": "SFRPG.LanguagesMorlamaw",
    "mulkaxi": "SFRPG.LanguagesMulkaxi",
    "nchaki": "SFRPG.LanguagesNchaki",
    "noma": "SFRPG.LanguagesNoma",
    "orbian": "SFRPG.LanguagesOrbian",
    "orc": "SFRPG.LanguagesOrc",
    "orrian": "SFRPG.LanguagesOrrian",
    "osharu": "SFRPG.LanguagesOsharu",
    "pahtra": "SFRPG.LanguagesPahtra",
    "paralithi": "SFRPG.LanguagesParalithi",
    "perani": "SFRPG.LanguagesPerani",
    "protean": "SFRPG.LanguagesProtean",
    "quorlu": "SFRPG.LanguagesQuorlu",
    "raxi": "SFRPG.LanguagesRaxi",
    "reptoid": "SFRPG.LanguagesReptoid",
    "requian": "SFRPG.LanguagesRequian",
    "sarcesian": "SFRPG.LanguagesSarcesian",
    "sazaron": "SFRPG.LanguagesSazaron",
    "scyphozoan": "SFRPG.LanguagesScyphozoan",
    "selamidian": "SFRPG.LanguagesSelamidian",
    "seprevoi": "SFRPG.LanguagesSeprevoi",
    "shadowtongue": "SFRPG.LanguagesShadowtongue",
    "shimreeni": "SFRPG.LanguagesShimreeni",
    "shirren": "SFRPG.LanguagesShirren",
    "shobhad": "SFRPG.LanguagesShobhad",
    "sivvian": "SFRPG.LanguagesSivvian",
    "spathinae": "SFRPG.LanguagesSpathinae",
    "starsong": "SFRPG.LanguagesStarsong",
    "stroxha": "SFRPG.LanguagesStroxha",
    "sylvan": "SFRPG.LanguagesSylvan",
    "telian": "SFRPG.LanguagesTelian",
    "terran": "SFRPG.LanguagesTerran",
    "triaxian": "SFRPG.LanguagesTriaxian",
    "trinir": "SFRPG.LanguagesTrinir",
    "urog": "SFRPG.LanguagesUrog",
    "varratana": "SFRPG.LanguagesVarratana",
    "vercite": "SFRPG.LanguagesVercite",
    "vesk": "SFRPG.LanguagesVesk",
    "vlakan": "SFRPG.LanguagesVlakan",
    "vulgarKishaleen": "SFRPG.LanguagesVulgarKishaleen",
    "woiokan": "SFRPG.LanguagesWoiokan",
    "worlansi": "SFRPG.LanguagesWorlansi",
    "wrikreechee": "SFRPG.LanguagesWrikreechee",
    "xaarb": "SFRPG.LanguagesXaarb",
    "ysoki": "SFRPG.LanguagesYsoki"
};

SFRPG.augmentationTypes = {
    "cybernetic": "SFRPG.Cybernetic",
    "biotech": "SFRPG.Biotech",
    "magitech": "SFRPG.Magitech",
    "necrograft": "SFRPG.Necrograft",
    "personal": "SFRPG.PersonalUpgrade",
    "speciesGraft": "SFRPG.SpeciesGraft"
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

SFRPG.augmentationSystems = {
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

/* --------------------------------*
 * NPC properties and values *
 *--------------------------------*/
SFRPG.npctypes = {
    "animal": "Animal",
    "aberration": "Aberration",
    "construct": "Construct",
    "dragon": "Dragon",
    "fey": "Fey",
    "humanoid": "Humanoid",
    "magical beast": "Magical Beast",
    "monstrous humanoid": "Monstrous Humanoid",
    "ooze": "Ooze",
    "outsider": "Outsider",
    "plant": "Plant",
    "undead": "Undead",
    "vermin": "Vermin"
};

/* --------------------------------*
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

/* --------------------------------*
 * Vehicle properties and values *
 *--------------------------------*/

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
    "resistance": "SFRPG.ModifierTypeResistance",
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
    "spell-save-dc": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellSaveDC",
    "ranged-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackRolls",
    "melee-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackRolls",
    "spell-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackRolls",
    "weapon-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackRolls",
    "all-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackRolls",
    "weapon-property-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyAttackRolls",
    "weapon-category-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponCategoryAttackRolls",
    "ranged-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackDamage",
    "melee-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackDamage",
    "spell-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackDamage",
    "weapon-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackDamage",
    "all-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackDamage",
    "weapon-property-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyDamage",
    "weapon-category-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponCategoryDamage",
    "bulk": "SFRPG.ActorSheet.Modifiers.EffectTypes.Encumbrance",
    "all-speeds": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllSpeeds",
    "specific-speed": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificSpeed",
    "multiply-all-speeds": "SFRPG.ActorSheet.Modifiers.EffectTypes.MultiplyAllSpeeds",
    "actor-resource": "SFRPG.ActorSheet.Modifiers.EffectTypes.ActorResource",
    "damage-reduction": "SFRPG.ActorSheet.Modifiers.EffectTypes.DamageReduction",
    "energy-resistance": "SFRPG.ActorSheet.Modifiers.EffectTypes.EnergyResistance"
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

SFRPG.globalAttackRollModifiers = [
    {bonus: { name: "SFRPG.Rolls.Character.Charge", modifier: "-2", enabled: false, notes: "SFRPG.Rolls.Character.ChargeTooltip" } },
    {bonus: { name: "SFRPG.Rolls.Character.Flanking", modifier: "+2", enabled: false, notes: "SFRPG.Rolls.Character.FlankingTooltip" } },
    {bonus: { name: "SFRPG.Rolls.Character.FightDefensively", modifier: "-4", enabled: false, notes: "SFRPG.Rolls.Character.FightDefensivelyTooltip" } },
    {bonus: { name: "SFRPG.Rolls.Character.FullAttack", modifier: "-4", enabled: false, notes: "SFRPG.Rolls.Character.FullAttackTooltip" } },
    {bonus: { name: "SFRPG.Rolls.Character.HarryingFire", modifier: "+2", enabled: false, notes: "SFRPG.Rolls.Character.HarryingFireTooltip" } },
    {bonus: { name: "SFRPG.Rolls.Character.Nonlethal", modifier: "-4", enabled: false, notes: "SFRPG.Rolls.Character.NonlethalTooltip" } }
];

SFRPG.CHARACTER_EXP_LEVELS = [
    0,
    1300,
    3300,
    6000,
    10000,
    15000,
    23000,
    34000,
    50000,
    71000,
    105000,
    145000,
    210000,
    295000,
    425000,
    600000,
    850000,
    1200000,
    1700000,
    2400000
];

SFRPG.CR_EXP_LEVELS = [
    50,
    400,
    600,
    800,
    1200,
    1600,
    2400,
    3200,
    4800,
    6400,
    9600,
    12800,
    19200,
    25600,
    38400,
    51200,
    76800,
    102400,
    153600,
    204800,
    307200,
    409600,
    614400,
    819200,
    1228800,
    1638400
];

SFRPG.statusEffects = [
    {
        id: "asleep",
        label: "SFRPG.ConditionsAsleep",
        icon: "systems/sfrpg/icons/conditions/asleep.webp"
    },
    {
        id: "bleeding",
        label: "SFRPG.ConditionsBleeding",
        icon: "systems/sfrpg/icons/conditions/bleeding.webp"
    },
    {
        id: "blinded",
        label: "SFRPG.ConditionsBlinded",
        icon: "systems/sfrpg/icons/conditions/blinded.webp"
    },
    {
        id: "broken",
        label: "SFRPG.ConditionsBroken",
        icon: "systems/sfrpg/icons/conditions/broken.webp"
    },
    {
        id: "burning",
        label: "SFRPG.ConditionsBurning",
        icon: "systems/sfrpg/icons/conditions/burning.webp"
    },
    {
        id: "confused",
        label: "SFRPG.ConditionsConfused",
        icon: "systems/sfrpg/icons/conditions/confused.webp"
    },
    {
        id: "cowering",
        label: "SFRPG.ConditionsCowering",
        icon: "systems/sfrpg/icons/conditions/cowering.webp"
    },
    {
        id: "dazed",
        label: "SFRPG.ConditionsDazed",
        icon: "systems/sfrpg/icons/conditions/dazed.webp"
    },
    {
        id: "dazzled",
        label: "SFRPG.ConditionsDazzled",
        icon: "systems/sfrpg/icons/conditions/dazzled.webp"
    },
    {
        id: "dead",
        label: "SFRPG.ConditionsDead",
        icon: "systems/sfrpg/icons/conditions/dead.webp"
    },
    {
        id: "deafened",
        label: "SFRPG.ConditionsDeafened",
        icon: "systems/sfrpg/icons/conditions/deafened.webp"
    },
    {
        id: "dying",
        label: "SFRPG.ConditionsDying",
        icon: "systems/sfrpg/icons/conditions/dying.webp"
    },
    {
        id: "encumbered",
        label: "SFRPG.ConditionsEncumbered",
        icon: "systems/sfrpg/icons/conditions/encumbered.webp"
    },
    {
        id: "entangled",
        label: "SFRPG.ConditionsEntangled",
        icon: "systems/sfrpg/icons/conditions/entangled.webp"
    },
    {
        id: "exhausted",
        label: "SFRPG.ConditionsExhausted",
        icon: "systems/sfrpg/icons/conditions/exhausted.webp"
    },
    {
        id: "fascinated",
        label: "SFRPG.ConditionsFascinated",
        icon: "systems/sfrpg/icons/conditions/fascinated.webp"
    },
    {
        id: "fatigued",
        label: "SFRPG.ConditionsFatigued",
        icon: "systems/sfrpg/icons/conditions/fatigued.webp"
    },
    {
        id: "flat-footed",
        label: "SFRPG.ConditionsFlatFooted",
        icon: "systems/sfrpg/icons/conditions/flatfooted.webp"
    },
    {
        id: "frightened",
        label: "SFRPG.ConditionsFrightened",
        icon: "systems/sfrpg/icons/conditions/frightened.webp"
    },
    {
        id: "grappled",
        label: "SFRPG.ConditionsGrappled",
        icon: "systems/sfrpg/icons/conditions/grappled.webp"
    },
    {
        id: "helpless",
        label: "SFRPG.ConditionsHelpless",
        icon: "systems/sfrpg/icons/conditions/helpless.webp"
    },
    {
        id: "invisible",
        label: "SFRPG.ConditionsInvisible",
        icon: "systems/sfrpg/icons/conditions/invisible.webp"
    },
    {
        id: "nauseated",
        label: "SFRPG.ConditionsNauseated",
        icon: "systems/sfrpg/icons/conditions/nauseated.webp"
    },
    {
        id: "off-kilter",
        label: "SFRPG.ConditionsOffKilter",
        icon: "systems/sfrpg/icons/conditions/offkilter.webp"
    },
    {
        id: "off-target",
        label: "SFRPG.ConditionsOffTarget",
        icon: "systems/sfrpg/icons/conditions/offtarget.webp"
    },
    {
        id: "overburdened",
        label: "SFRPG.ConditionsOverburdened",
        icon: "systems/sfrpg/icons/conditions/overburdened.webp"
    },
    {
        id: "panicked",
        label: "SFRPG.ConditionsPanicked",
        icon: "systems/sfrpg/icons/conditions/panicked.webp"
    },
    {
        id: "paralyzed",
        label: "SFRPG.ConditionsParalyzed",
        icon: "systems/sfrpg/icons/conditions/paralyzed.webp"
    },
    {
        id: "pinned",
        label: "SFRPG.ConditionsPinned",
        icon: "systems/sfrpg/icons/conditions/pinned.webp"
    },
    {
        id: "prone",
        label: "SFRPG.ConditionsProne",
        icon: "systems/sfrpg/icons/conditions/prone.webp"
    },
    {
        id: "shaken",
        label: "SFRPG.ConditionsShaken",
        icon: "systems/sfrpg/icons/conditions/shaken.webp"
    },
    {
        id: "sickened",
        label: "SFRPG.ConditionsSickened",
        icon: "systems/sfrpg/icons/conditions/sickened.webp"
    },
    {
        id: "stable",
        label: "SFRPG.ConditionsStable",
        icon: "systems/sfrpg/icons/conditions/stable.webp"
    },
    {
        id: "staggered",
        label: "SFRPG.ConditionsStaggered",
        icon: "systems/sfrpg/icons/conditions/staggered.webp"
    },
    {
        id: "stunned",
        label: "SFRPG.ConditionsStunned",
        icon: "systems/sfrpg/icons/conditions/stunned.webp"
    },
    {
        id: "unconscious",
        label: "SFRPG.ConditionsUnconscious",
        icon: "systems/sfrpg/icons/conditions/unconscious.webp"
    }
];

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
        tooltip: "<strong>Shaken</strong><br><br>You take a -2 penalty to ability checks, attack rolls, saving throws, and skill checks."
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

SFRPG.conditionsCausingFlatFooted = ["blinded", "cowering", "off-kilter", "pinned", "stunned"];

// TODO localize
SFRPG.characterFlags = {
    /* "solarianAttunement": {
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
SFRPG.droneResolveMethod = (droneLevel) => { return (droneLevel >= 10 ? Math.floor(droneLevel / 2) : 0); };
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
    "minute10": "SFRPG.Capacity.UsagePer.Minute10",
    "hour": "SFRPG.Capacity.UsagePer.Hour",
    "hour8": "SFRPG.Capacity.UsagePer.Hour8",
    "day": "SFRPG.Capacity.UsagePer.Day"
};

SFRPG.itemTypes = {
    "archetypes": "SFRPG.Items.Categories.Archetypes",
    "class": "SFRPG.Items.Categories.Classes",
    "race": "SFRPG.Items.Categories.Races",
    "theme": "SFRPG.Items.Categories.Themes",

    "actorResource": "ITEM.TypeActorresource",
    "feat": "SFRPG.Items.Categories.Feats",
    "spell": "SFRPG.Items.Categories.Spells",

    "asi": "SFRPG.Items.Categories.AbilityScoreIncrease",

    "chassis": "SFRPG.Items.Categories.DroneChassis",
    "mod": "SFRPG.Items.Categories.DroneMods",

    "starshipAblativeArmor": "SFRPG.Items.Categories.StarshipAblativeArmors",
    "starshipAction": "ITEM.TypeStarshipaction",
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

    "vehicleAttack": "SFRPG.Items.Categories.VehicleAttacks",
    "vehicleSystem": "SFRPG.Items.Categories.VehicleSystems",

    "ammunition": "SFRPG.Items.Categories.Ammunition",
    "augmentation": "SFRPG.Items.Categories.Augmentations",
    "consumable": "SFRPG.Items.Categories.Consumables",
    "container": "SFRPG.Items.Categories.Containers",
    "equipment": "SFRPG.Items.Categories.Armor",
    "fusion": "ITEM.TypeFusion",
    "goods": "SFRPG.Items.Categories.Goods",
    "hybrid": "SFRPG.Items.Categories.HybridItems",
    "magic": "SFRPG.Items.Categories.MagicItems",
    "shield": "SFRPG.Items.Categories.Shields",
    "technological": "SFRPG.Items.Categories.TechnologicalItems",
    "upgrade": "ITEM.TypeUpgrade",
    "weapon": "SFRPG.Items.Categories.Weapons",
    "weaponAccessory": "ITEM.TypeWeaponaccessory"
};

SFRPG.characterDefinitionItemTypes = [
    "archetypes",
    "class",
    "race",
    "theme"
];

SFRPG.sharedItemTypes = [
    "actorResource",
    "feat",
    "spell"
];

SFRPG.playerCharacterDefinitionItemTypes = [
    "asi"
];

SFRPG.droneDefinitionItemTypes = [
    "chassis",
    "mod"
];

SFRPG.starshipDefinitionItemTypes = [
    "starshipAction",
    "starshipAblativeArmor",
    "starshipArmor",
    "starshipComputer",
    "starshipCrewQuarter",
    "starshipDefensiveCountermeasure",
    "starshipDriftEngine",
    "starshipExpansionBay",
    "starshipFortifiedHull",
    "starshipFrame",
    "starshipOtherSystem",
    "starshipPowerCore",
    "starshipReinforcedBulkhead",
    "starshipSecuritySystem",
    "starshipSensor",
    "starshipShield",
    "starshipSpecialAbility",
    "starshipThruster",
    "starshipWeapon"
];

SFRPG.vehicleDefinitionItemTypes = [
    "vehicleAttack",
    "vehicleSystem"
];

SFRPG.physicalItemTypes = [
    "ammunition",
    "augmentation",
    "consumable",
    "container",
    "equipment",
    "fusion",
    "goods",
    "hybrid",
    "magic",
    "shield",
    "technological",
    "upgrade",
    "weapon",
    "weaponAccessory"
];

SFRPG.containableTypes = {
    "weapon"       : "SFRPG.Items.Categories.Weapons",
    "ammunition"   : "SFRPG.Items.Categories.Ammunition",
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
    "meleeWeaponSA": "SFRPG.Items.WeaponAccessory.SupportedType.MeleeWeaponSA",
    "projectile": "SFRPG.Items.WeaponAccessory.SupportedType.Projectile",
    "railedWeapon": "SFRPG.Items.WeaponAccessory.SupportedType.RailedWeapon",
    "railedWeaponSA": "SFRPG.Items.WeaponAccessory.SupportedType.RailedWeaponSA",
    "smallarm": "SFRPG.Items.WeaponAccessory.SupportedType.SmallArm"
};

SFRPG.speeds = {
    "land": "SFRPG.ActorSheet.Attributes.Speed.Types.Land",
    "burrowing": "SFRPG.ActorSheet.Attributes.Speed.Types.Burrowing",
    "climbing": "SFRPG.ActorSheet.Attributes.Speed.Types.Climbing",
    "flying": "SFRPG.ActorSheet.Attributes.Speed.Types.Flying",
    "swimming": "SFRPG.ActorSheet.Attributes.Speed.Types.Swimming",
    "special": "SFRPG.ActorSheet.Attributes.Speed.Types.Special"
};

SFRPG.flightManeuverability = {
    "-1": "SFRPG.ActorSheet.Attributes.Speed.Flight.Clumsy",
    "0": "SFRPG.ActorSheet.Attributes.Speed.Flight.Average",
    "1": "SFRPG.ActorSheet.Attributes.Speed.Flight.Perfect"
};

SFRPG.actionTargets = {
    "": "SFRPG.Items.Action.ActionTarget.None",
    "kac": "SFRPG.Items.Action.ActionTarget.KAC",
    "kac8": "SFRPG.Items.Action.ActionTarget.KAC8",
    "eac": "SFRPG.Items.Action.ActionTarget.EAC",
    "other": "SFRPG.Items.Action.ActionTarget.Other"
};

SFRPG.actionTargetsStarship = {
    "": "SFRPG.Items.Action.ActionTarget.None",
    "ac": "SFRPG.Items.Action.ActionTarget.StarshipAC",
    "tl": "SFRPG.Items.Action.ActionTarget.StarshipTL"
};

// Source: CRB, page 391
SFRPG.characterWealthByLevel = {
    0: 0,
    1: 1000,
    2: 2000,
    3: 4000,
    4: 6000,
    5: 9000,
    6: 15000,
    7: 23000,
    8: 33000,
    9: 45000,
    10: 66000,
    11: 100000,
    12: 150000,
    13: 255000,
    14: 333000,
    15: 500000,
    16: 750000,
    17: 1125000,
    18: 1700000,
    19: 2550000,
    20: 3775000
};

SFRPG.skillCompendium = {
    "acr": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.3QdtsfnVJsHEdrt0",
    "ath": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.iLlBAZBfHJMZQRQx",
    "blu": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.GcVVfpQ79HdcMqBt",
    "com": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.IqOCYDKd9NgBwowp",
    "cul": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.LeZmnFwnlB89ovBB",
    "dip": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.1tzIBDaDAO4hmX5C",
    "dis": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.aayAhTaRzitONs5U",
    "eng": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.76u4HnGcAlySicb4",
    "int": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.6fqgiVqlA7u9jS4i",
    "lsc": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.tVUA3IPcOfyU1g19",
    "med": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.d4fcGwOcrsuYrwGH",
    "mys": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.HXcmgteT2OegqFrB",
    "per": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.gZlg2ZKze0erNLmP",
    "pro": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.bD4kmdFU7wwsenOf",
    "phs": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.w7NNLCayniMsh3ne",
    "pil": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.2xZnjhTSiLu0uoXB",
    "sen": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.nBrYkGfNBJAHe0xJ",
    "sle": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.qVEW9HjXQN0ok879",
    "ste": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.5h3iePfJaeQMc3Qr",
    "sur": "Compendium.sfrpg.rules.GMkLZsN3a7YPvA03.JournalEntryPage.UDTsEIldhXTn0VJA"
};

SFRPG.floatingHPValues = {
    hpKeys: ['value', 'temp'],
    shieldKeys: ['aft', 'starboard', 'forward', 'port'],
    value: { // Main HP value
        label: 'HP',
        positive: { fill: 0x00FF00 },
        negative: { fill: 0xFF0000 }
    },
    temp: { // Temp HP
        label: 'temp',
        positive: { fill: 0x55FF00 },
        negative: { fill: 0xFF3300 }
    },
    stamina: {
        label: 'stamina',
        positive: { fill: 0x00fba5 },
        negative: { fill: 0xfb3500 }
    },
    'shields.aft': {
        label: 'Sh.A.',
        positive: { fill: 0x9696ff },
        negative: { fill: 0xd90069 }
    },
    'shields.port': {
        label: 'Sh.P.',
        positive: { fill: 0x9696ff },
        negative: { fill: 0xd90069 }
    },
    'shields.forward': {
        label: 'Sh.F.',
        positive: { fill: 0x9696ff },
        negative: { fill: 0xd90069 }
    },
    'shields.starboard': {
        label: 'Sh.S.',
        positive: { fill: 0x9696ff },
        negative: { fill: 0xd90069 }
    }
};

SFRPG.enricherTypes = {
    "Browser": BrowserEnricher,
    "Icon": IconEnricher,
    "Check": CheckEnricher
};
