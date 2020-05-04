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
    "negate": "negates",
    "partial": "partial",
    "half": "half",
    "disbelieve": "disbelieve",
    "harmless": "harmless",
    "object": "object"
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
    "lgt": "Light Armor",
    "hvy": "Heavy Armor",
    "pwr": "Power Armor",
    "shl": "Shields"
};

/**
 * The set of weapons proficiencies which a character may have
 * @type {Object}
 */
STARFINDER.weaponProficiencies = {
    "bmelee": "Basic Melee",
    "amelee": "Advanced Melee",
    "sarms": "Small Arms",
    "larms": "Long Arms",
    "hweap": "Heavy Weapons",
    "snipe": "Sniper Weapons",
    "gren": "Grenades",
    "spec": "Special Weapons"
};

/**
 * This describes the ways that an ability can be cativated
 * @type {Object}
 */
STARFINDER.abilityActivationTypes = {
    "none": "None",
    "action": "S. Action",
    "move": "M. Action",
    "swift": "Swift Action",
    "full": "Full Action",
    "reaction": "Reaction",
    "other": "Other Actions",
    "day": "Day",
    "hour": "Hour",
    "min": "Minute",
    "special": "Special"
};

STARFINDER.skillProficiencyLevels = {
    0: "",
    3: "Class Skill"
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
STARFINDER.damageTypes = {
    "acid": "Acid",
    "cold": "Cold",
    "electricity": "Electricity",
    "fire": "Fire",
    "sonic": "Sonic",
    "bludgeoning": "Bludgeoning",
    "piercing": "Piercing",
    "slashing": "Slashing"
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
    "healing": "Healing"
};

STARFINDER.spellPreparationModes = {
    "always": "Always Available",
    "innate": "Innate Spellcasting"
};

STARFINDER.limitedUsePeriods = {
    "sr": "Short Rest",
    "lr": "Long Rest",
    "day": "Day",
    "charges": "Charges"
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
    "basicM": "Basic Melee",
    "advancedM": "Advanced Melee",
    "smallA": "Small Arms",
    "longA": "Long Arms",
    "heavy": "Heavy Weapons",
    "sniper": "Sniper Weapons",
    "grenade": "Grenades",
    "special": "Special Weapons",
    "solarian": "Solarian Weapon Crystals"
};

// Weapons sub categories
STARFINDER.weaponCategories = {
    "cryo": "Cryo weapons",
    "flame": "Flame weapons",
    "laser": "Laser weapons",
    "plasma": "Plasma weapons",
    "projectile": "Projectile Weapons",
    "shock": "Shock weapons",
    "sonic": "Sonic weapons",
    "uncategorized": "Uncategorized weapons"
};

// Weapon Properties
STARFINDER.weaponProperties = {
    "one": "One-handed",
    "two": "Two-Handed",
    "amm": "Ammunition",
    "analog": "Analog",
    "archaic": "Archaic",
    "automatic": "Automatic",
    "blast": "Blast",
    "block": "Block",
    "boost": "Boost",
    "bright": "Bright",
    "disarm": "Disarm",
    "entangle": "Entangle",
    "explode": "Explode",
    "injection": "Injection",
    "line": "Line",
    "living": "Living",
    "mind-affecting": "Mind-Affecting",
    "nonlethal": "Nonlethal",
    "operative": "Operative",
    "penetrating": "Penetrating",
    "powered": "Powered",
    "qreload": "Quick Reload",
    "radioactive": "Radioactive",
    "reach": "Reach",
    "sniper": "Sniper",
    "stun": "Stun",
    "subtle": "Subtle",
    "thrown": "Thrown",
    "trip": "Trip",
    "unwieldy": "Unwieldy"
};

STARFINDER.spellAreaShapes = {
    "": "",
    "cone": "Cone",
    "cylinder": "Cylinder",
    "line": "Line",
    "sphere": "Sphere",
    "shapable": "Shapable",
    "other": "Other"
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
    "asleep": "Asleep",
    "bleeding": "Bleeding",
    "blinded": "Blinded",
    "broken": "Broken (item only)",
    "confused": "Confused",
    "cowering": "Cowering",
    "dazed": "Dazed",
    "dazzled": "Dazzled",
    "dead": "Dead",
    "deafened": "Deafened",
    "dyning": "Dying",
    "encumbered": "Encumbered",
    "entangled": "Entangled",
    "exhausted": "Exhausted",
    "fascinated": "Fascinated",
    "fatigued": "Fatigued",
    "flatfooted": "Flat-footed",
    "frightened": "Frightened",
    "grappled": "Grappled",
    "helpless": "Helpless",
    "nauseated": "Nauseated",
    "offkilter": "Off-kilter",
    "offtarget": "Off-Target",
    "panicked": "Panicked",
    "paralyzed": "Paralyzed",
    "pinned": "Pinned",
    "prone": "Prone",
    "shaken": "Shaken",
    "sickened": "Sickened",
    "stable": "Stable",
    "staggered": "Staggered",
    "stunned": "Stunned",
    "unconscious": "Unconscious"
};

STARFINDER.languages = {
    "common": "Common",
    "akiton": "Akitonian",
    "aklo": "Aklo",
    "brethedan": "Brethedan",
    "castrovelian": "Castrovelian",
    "eoxian": "Eoxian",
    "kasatha": "Kasatha",
    "shirren": "Shirren",
    "triaxian": "Triaxian",
    "vercite": "Vercite",
    "vesk": "Vesk",
    "ysoki": "Yosoki",
    "abyssal": "Abyssal",
    "aquan": "Aquan",
    "arkanen": "Arkanen",
    "auran": "Auran",
    "azlanti": "Azlanti",
    "celestial": "Celestial",
    "draconic": "Draconic",
    "drow": "Drow",
    "dwarven": "Dwarven",
    "elven": "Elven",
    "gnome": "Gnome",
    "goblin": "Goblin",
    "halfling": "Halfling",
    "ignan": "Ignan",
    "infernal": "Infernal",
    "kalo": "Kalo",
    "Nchaki": "Nchaki",
    "orc": "Orc",
    "sarcesian": "Sarcesian",
    "shobhad": "Shobhad",
    "terran": "Terran"
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
    }
};
