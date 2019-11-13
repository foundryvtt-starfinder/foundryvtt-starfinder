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

Hooks.once("init", () => {
    game.settings.register("starfinder", "diagonalMovement", {
        name: "Diagonal Movement Rule",
        hint: "Configures which diagonal movement rule should be used for games within this system.",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "555": "Optional (5/5/5)",
            "5105": "Core Rulebook (5/10/5)"
        },
        onChange: rule => canvas.grid.diagonalRule = rule
    });

    game.settings.register("starfinder", "disableExperienceTracking", {
        name: "Disable Experience Tracking",
        hint: "Remove experience bars from character sheets.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    // Preload templates
    loadTemplates([
        "public/systems/starfinder/templates/actors/actor-sheet.html"
    ]);
});

Hooks.on("canvasInit", () => {
    canvas.grid.diagonalRule = game.settings.get("starfinder", "diagonalMovement");

    SquareGrid.prototype.measureDistance = function (p0, p1) {
        let qs = canvas.dimensions.size,
            ray = new Ray(p0, p1),
            nx = Math.abs(Math.ceil(ray.dx / qs)),
            ny = Math.abs(Math.ceil(ray.dy / qs));

        let nDiagonal = Math.min(nx, ny),
            nStraight = Math.abs(ny - nx);
        
        if (this.parent.diagonalRule === "555") {
            return (nStraight + nDiagonal) * canvas.scene.data.gridDistance;
        } else {
            let nd10 = Math.floor(nDiagonal / 2);
            let spaces = (nd10 * 2) + (nDiagonal - nd10) + nStraight;

            return spaces * canvas.dimensions.distance;
        }
    };
});
/**
 * Extend the base :class:`Actor` to implement additional logic specialized for Starfinder
 */
class ActorStarfinder extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data.
     * 
     * @param {Object} actorData The data for the actor
     * @returns {Object} The actors data
     */
    prepareData(actorData) {
        actorData = super.prepareData(actorData);
        const data = actorData.data;
        const flags = actorData.flags;

        if (actorData.type === "character") this._prepareCharacterData(data);
        else if (actorData.type === "npc") this._prepareNPCData(data);

        // Ability modifiers and saves
        for (let abl of Object.values(data.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
        }

        const init = data.attributes.init;
        init.mod = data.abilities.dex.mod;
        init.bonus = init.value + (getProperty(flags, "starfinder.improvedInititive") ? 4 : 0);
        init.total = init.mod + init.bonus;

        data.attributes.eac.min = 10 + data.abilities.dex.mod;
        data.attributes.kac.min = 10 + data.abilities.dex.mod;
        
        return actorData;
    }

    /**
     * Prepare the character's data.
     * 
     * @param {Object} data The data to prepare
     * @private
     */
    _prepareCharacterData(data) {
        data.details.level.value = parseInt(data.details.level.value);
        data.details.xp.max = this.getLevelExp(data.details.level.value || 1);
        let prior = this.getLevelExp(data.details.level.value - 1 || 0),
            req = data.details.xp.max - prior;
        data.details.xp.pct = Math.min(Math.round((data.details.xp.value - prior) * 100 / req), 99.5);
    }

    /**
     * Prepare the NPC's data.
     * 
     * @param {Object} data The NPC's data to prepare
     * @private
     */
    _prepareNPCData(data) {
        data.details.cr.value = parseFloat(data.details.cr.value || 0);
        data.details.xp.value = this.getCRExp(data.details.cr.value);
    }

    /**
     * Return the amount of experience required to gain a certain character level.
     * 
     * @param {Number} level The desired level
     * @returns {Number} The XP required for the next level
     */
    getLevelExp(level) {
        const levels = CONFIG.STARFINDER.CHARACTER_EXP_LEVELS;
        return levels[Math.min(level, levels.length - 1)];
    }

    /**
     * Return the amount of experience granted by killing a creature of a certain CR.
     * 
     * @param {Number} cr The creature's challenge rating
     * @returns {Number} The amount of experience granted per kill
     */
    getCRExp(cr) {
        if (cr < 1.0) return Math.max(400 * cr, 50);
        return CONFIG.STARFINDER.CR_EXP_LEVELS[cr];
    }
}

CONFIG.Actor.entityClass = ActorStarfinder;

class ActorSheetStarfinder extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }

    getData() {
        const sheetData = super.getData();

        return sheetData;
    }
}
class ActorSheetStarfinderCharacter extends ActorSheetStarfinder {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['starfinder', 'actor', 'character-sheet']),
            width: 650,
            height: 720
        });

        return options;
    }

    get template() {
        const path = "public/systems/starfinder/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "actor-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        return sheetData;
    }
}

Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, {
    types: ["character"],
    makeDefault: true
});
