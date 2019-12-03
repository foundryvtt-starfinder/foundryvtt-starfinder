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
    "action": "Standard Action",
    "move": "Move Action",
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
    "psc": "STARFINDER.SkillPsc",
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
    "two": "Two-Handed",
    "amm": "Ammunition"
};

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
      "fine": "Fine",
      "diminutive": "Diminutive",
      "tiny": "Tiny",
      "small": "Small",
      "medium": "Medium",
      "large": "Large",
      "huge": "Huge",
      "gargantuan": "Gargantuan",
      "colossal": "Colossal"
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

  STARFINDER.CHARACTER_EXP_LEVELS = [
      0,1300, 3300,6000,10000,15000,23000,34000,50000,71000,
      105000,145000,210000,295000,425000,600000,850000,1200000,
      1700000,2400000
  ];

  STARFINDER.CR_EXP_LEVELS = [
      50,400,600,800,1200,1600,2400,3200,4800,
      6400,9600,12800,19200,25600,38400,51200,76800,102400,
      153600,204800,307200,409600,614400,819200,1228800,1638400
  ];

  STARFINDER.characterFlags = {
      "improvedInititive": {
          name: "Improved Inititive",
          hint: "Character feat that adds 4 to thier initiive roll",
          section: "Feats",
          type: Boolean
      }
  };
