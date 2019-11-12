// Namespace Starfinder Configuration Values
CONFIG.STARFINDER = {};

// Damage Types
CONFIG.damageTypes = {
    "acid": "Acid",
    "cold": "Cold",
    "electricity": "Electricity",
    "fire": "Fire",
    "sonic": "Sonic",
    "bludgeoning": "Bludgeoning",
    "piercing": "Piercing",
    "slashing": "Slashing"
};

// Healing types
CONFIG.healingTypes = {
    "healing": "Healing"
};

// Weapon Types
CONFIG.weaponTypes = {
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
CONFIG.weaponCategories = {
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
CONFIG.weaponProperties = {
    "two": "Two-Handed",
    "amm": "Ammunition"
};

// Weapon special abilities
CONFIG.weaponSpecial = {
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
CONFIG.weaponCriticalHitEffects = {
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
CONFIG.armorTypes = {
    "light": "Light Armor",
    "heavy": "Heavy Armor"
};

// Spell Schools
CONFIG.spellSchools = {
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
CONFIG.spellLevels = {
    0: "0 Level",
    1: "1st Level",
    2: "2nd Level",
    3: "3rd Level",
    4: "4th Level",
    5: "5th Level",
    6: "6th Level"
  };

  // Feat types
  CONFIG.featTypes = {
      "general": "General Feats",
      "combat": "Combat Feats"
  };

  CONFIG.actorSizes = {
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

  CONFIG.conditionTypes = {
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

  CONFIG.languages = {
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

  CONFIG.STARFINDER.CHARACTER_EXP_LEVELS = [
      0,1300, 3300,6000,10000,15000,23000,34000,50000,71000,
      105000,145000,210000,295000,425000,600000,850000,1200000,
      1700000,2400000
  ];

  CONFIG.STARFINDER.CR_EXP_LEVELS = [
      50,400,600,800,1200,1600,2400,3200,4800,
      6400,9600,12800,19200,25600,38400,51200,76800,102400,
      153600,204800,307200,409600,614400,819200,1228800,1638400
  ];
