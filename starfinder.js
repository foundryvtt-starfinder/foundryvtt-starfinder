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
        "public/systems/starfinder/templates/actors/actor-sheet.html",
        "public/systems/starfinder/templates/actors/actor-attributes.html",
        "public/systems/starfinder/templates/actors/actor-abilities.html",
        "public/systems/starfinder/templates/actors/actor-biography.html",
        "public/systems/starfinder/templates/actors/actor-skills.html",
        "public/systems/starfinder/templates/actors/actor-traits.html",
        "public/systems/starfinder/templates/actors/actor-classes.html",

        "public/systems/starfinder/templates/items/class-sidebar.html",
        "public/systems/starfinder/templates/items/consumable-details.html",
        "public/systems/starfinder/templates/items/consumable-sidebar.html",
        "public/systems/starfinder/templates/items/equipment-details.html",
        "public/systems/starfinder/templates/items/equipment-sidebar.html",
        "public/systems/starfinder/templates/items/feat-details.html",
        "public/systems/starfinder/templates/items/feat-sidebar.html",
        "public/systems/starfinder/templates/items/spell-details.html",
        "public/systems/starfinder/templates/items/spell-sidebar.html",
        "public/systems/starfinder/templates/items/tool-sidebar.html",
        "public/systems/starfinder/templates/items/weapon-details.html",
        "public/systems/starfinder/templates/items/weapon-sidebar.html"
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
class ItemStarfinder extends Item {

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * 
     * @return {Promise}
     */
    async roll() {
        const template = `public/systems/starfinder/templates/chat/${this.data.type}-card.html`;
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.scene._id}.${token.id}` : null,
            item: this.data,
            data: this.getChatData()
        };

        const chatData = {
            user: game.user._id,
            type: CHAT_MESSAGE_TYPES.OTHER,
            speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
            }
        };

        let rollMode = game.settings.get('core', 'rollMode');
        if (['gmroll', 'blindroll'].includes(rollMode)) chatData['whisper'] = ChatMessage.getWhisperIDs('GM');
        if (rollMode === 'blindroll') chatData['blind'] = true;

        chatData['content'] = await renderTemplate(template, templateData);

        return ChatMessage.create(chatData, { dispalySheet: false });
    }

    /**
     * Get the data object used by the chat dialog.
     * 
     * @param {Object} htmlOptions Optional html options
     * @returns {Object}
     */
    getChatData(htmlOptions) {
        console.log(this);
        const data = this[`_${this.data.type}ChatData`]();
        data.description.value = enrichHTML(data.description.value, htmlOptions);

        return data;
    }

    static chatListeners(html) {
        html.on('click', '.card-buttons button', ev => {
            ev.preventDefault();

            const button = $(ev.currentTarget),
                  messageId = button.parents('.message').data('messageId'),
                  senderId = game.messages.get(messageId).user._id,
                  card = button.parents('.chat-card');

            if (!game.user.isGM && game.user._id !== senderId) return;

            let actor;
            const tokenKey = card.data('tokenId');
            if (tokenKey) {
                const [sceneId, tokenId] = tokenKey.split('.');
                let token;
                if (sceneId === CanvasGradient.scene._id) token = canvas.tokens.get(tokenId);
                else {
                    const scene = game.scenes.get(sceneId);
                    if (!scene) return;
                    let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
                    if (tokenData) token = new Token(tokenData);
                }
                if (!token) return;
                actor = Actor.fromToken(token);
            } else actor = game.actors.get(card.data('actorId'));

            if (!actor) return;
            const itemId = Number(card.data('itemId'));
            const item = actor.getOwnedItem(itemId);

            //const action = button.data('action');
        })
    }

    _weaponChatData() {
        const data = duplicate(this.data.data);
        const properties = [
            data.range.value,
            CONFIG.weaponTypes[data.weaponType.value],
            data.proficient.value ? "" : "Not Proficient"
        ];
        data.properties = properties.filter(p => !!p);

        return data;
    }
}

CONFIG.Item.entityClass = ItemStarfinder;

// Hooks.on("getChatLogEntryContext", (html, options) => {
//     let canApply = li => canvas.tokens.controlledTokens.length && li.find('.dice-roll').length;
//     options.push(
//         {
//             name: "Apply Damage",
//             icon: '<i class="fas fa-user-minus"></i>',
//             condition: canApply,
//             callback: li => ActorStarfinder.apply()
//         }
//     );

//     return options;
// });

class ItemSheetStarfinder extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.width = 620;
        options.height = 460;
        options.classes = options.classes.concat(['starfinder', 'item']);
        options.template = `public/systems/starfinder/templates/items/item-sheet.html`;
        options.resizable = true;

        return options;
    }

    getData() {
        const data = super.getData();
        data['abilities'] = game.system.template.actor.data.abilities;

        const type = this.item.type;
        mergeObject(data, {
            type: type,
            hasSidebar: true,
            sidebarTemplate: () => `public/systems/starfinder/templates/items/${type}-sidebar.html`,
            hasDetails: ["consumable", "equipment", "feat", "spell", "weapon"].includes(type),
            detailsTemplate: () => `public/systems/starfinder/templates/items/${type}-details.html`
        });

        let dt = duplicate(CONFIG.damageTypes);
        if (["spell", "feat"].includes(type)) mergeObject(dt, CONFIG.healingTypes);
        data['damageTypes'] = dt;

        if (type === 'consumable') {
            data.consumableTypes = CONFIG.consumableTypes;
        }
        else if (type === 'spell') {
            mergeObject(data, {
                spellTypes: CONFIG.spellTypes,
                spellSchools: CONFIG.spellSchools,
                spellLevels: CONFIG.spellLevels
            });
        }
        else if (this.item.type === 'weapon') {
            data.weaponTypes = CONFIG.weaponTypes;
            data.weaponProperties = this._formatWeaponProperties(data.data);
        }
        else if (type === 'feat') {
            data.featTypes = CONFIG.featTypes;
            data.featTags = [
                data.data.target.value,
                data.data.time.value
            ].filter(t => !!t);
        }
        else if (type === "equipment") {
            data.armorTypes = CONFIG.armorTypes;
        }

        return data;
    }

    _formatWeaponProperties(data) {
        if (!data.properties.value) return [];
        return data.properties.value.split(',').map(p => p.trim());
    }

    activateListeners(html) {
        super.activateListeners(html);

        new Tabs(html.find('.tabs'), {
            initial: this.item.data.flags["_sheetTab"],
            callback: clicked => this.item.data.flags["_sheetTab"] = clicked.attr('data-tab')
        });

        html.find('input[type="checkbox"]').change(event => this._onSubmit(event));
    }
}

Hooks.on('renderChatLog', (log, html, data) => ItemStarfinder.chatListeners(html));

Items.unregisterSheet('core', ItemSheet);
Items.registerSheet("starfinder", ItemSheetStarfinder, { makeDefault: true });

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

        for (let skl of Object.values(data.skills)) {
            skl.value = parseFloat(skl.value || 0);
            let classSkill = skl.value;
            let hasRanks = skl.ranks > 0;
            skl.mod = data.abilities[skl.ability].mod + skl.ranks + (hasRanks ? classSkill : 0);
        }

        const init = data.attributes.init;
        init.mod = data.abilities.dex.mod;
        init.bonus = init.value + (getProperty(flags, "starfinder.improvedInititive") ? 4 : 0);
        init.total = init.mod + init.bonus;

        data.attributes.eac.min = 10 + data.abilities.dex.mod;
        data.attributes.kac.min = 10 + data.abilities.dex.mod;

        const map = {
            "dr": CONFIG.damageTypes,
            "di": CONFIG.damageTypes,
            "dv": CONFIG.damageTypes,
            "ci": CONFIG.damageTypes,
            "languages": CONFIG.languages,
            "weaponProf": CONFIG.weaponTypes,
            "armorProf": CONFIG.armorTypes
        };

        for (let [t, choices] of Object.entries(map)) {
            let trait = data.traits[t];

            if (!(trait.value instanceof Array)) {
                trait.value = TraitSelectorStarfinder._backCompat(trait.value, choices);
            }
        }
        
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

/**
 * A specialized form used to select damage or condition types which appl to an Actor
 * 
 * @type {FormApplication}
 */
class TraitSelectorStarfinder extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;

        options.id = "trait-selector";
        options.classes = ["starfinder"];
        options.title = "Actor Trait Selection";
        options.template = "public/systems/starfinder/templates/actors/trait-selector.html";
        options.width = 200;

        return options;
    }

    /**
     * Return a reference to the target attribute
     * 
     * @type {String}
     */
    get attribute() {
        return this.options.name;
    }

    /**
     * Provide data to the HTML template for rendering
     * 
     * @returns {Object}
     */
    getData() {
        let attr = getProperty(this.object.data, this.attribute);
        if (typeof attr.value === "string") attr.value = this.constructor._backCompat(attr.value, this.options.choices);

        const choices = duplicate(this.options.choices);
        for (let [k, v] of Object.entries(choices)) {
            choices[k] = {
                label: v,
                chosen: attr.value.includes(k)
            };
        }

        return {
            choices: choices,
            custom: attr.custom
        };
    }

    /**
     * Support backwards compatability for old-style string separated traits
     * 
     * @param {String} current The current value
     * @param {Array} choices The choices
     * @returns {Array}
     * @private
     */
    static _backCompat(current, choices) {
        if (!current || current.length === 0) return [];
        current = current.split(/[\s,]/).filter(t => !!t);
        return current.map(val => {
            for (let [k,v] of Object.entries(choices)) {
                if (val === v) return k;
            }
            return null;
        }).filter(val => !!val);
    }

    /**
     * Update the Actor object with new trait data processed from the form
     * 
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     * @private
     */
    _updateObject(event, formData) {
        const choices = [];

        for (let [k, v] of Object.entries(formData)) {
            if (v) choices.push(k);
        }

        this.object.update({
            [`${this.attribute}.value`]: choices,
            [`${this.attribute}.custom`]: formData.custom
        });
    }
}
class ActorSheetStarfinder extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }

    getData() {
        const sheetData = super.getData();

        for (let skl of Object.values(sheetData.data.skills)) {
            skl.ability = sheetData.data.abilities[skl.ability].label.substring(0, 3);
            skl.icon = this._getClassSkillIcon(skl.value);

        }

        sheetData["actorSizes"] = CONFIG.actorSizes;
        this._prepareTraits(sheetData.data["traits"]);

        this._prepareItems(sheetData);

        return sheetData;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('[data-wpad]').each((i, e) => {
            let text = e.tagName === "INPUT" ? e.value : e.innerText,
                w = text.length * parseInt(e.getAttribute("data-wpad")) / 2;
            e.setAttribute("style", "flex: 0 0 " + w + "px;");
        });

        html.find('.tabs').each((_, el) => {
            let tabs = $(el),
                group = el.getAttribute("data-group"),
                initial = this.actor.data.flags[`_sheetTab-${group}`];
            new Tabs(tabs, {
                initial: initial,
                callback: clicked => this.actor.data.flags[`_sheetTab-${group}`] = clicked.attr("data-tab")
            });
        });

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));

        if (!this.options.editable) return;

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(ev => this._onTraitSelector(ev));
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.damageTypes,
            "di": CONFIG.damageTypes,
            "dv": CONFIG.damageTypes,
            "ci": CONFIG.damageTypes,
            "languages": CONFIG.languages,
            "weaponProf": CONFIG.weaponTypes,
            "armorProf": CONFIG.armorTypes
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            trait.selected = trait.value.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            if (trait.custom) trait.selected["custom"] = trait.custom;
        }
    }

    /**
     * handle cycling whether a skill is a class skill or not
     * 
     * @param {Event} event A click or contextmenu event which triggered the handler
     * @private
     */
    _onCycleClassSkill(event) {
        event.preventDefault();

        const field = $(event.currentTarget).siblings('input[type="hidden"]');

        const level = parseFloat(field.val());
        const levels = [0, 3];

        let idx = levels.indexOf(level);

        if (event.type === "click") {
            field.val(levels[(idx === levels.length - 1) ? 0 : idx + 1]);
        } else if (event.type === "contextmenu") {
            field.val(levels[(idx === 0) ? levels.length - 1 : idx - 1]);
        }

        this._onSubmit(event);
    }

    /**
     * Get The font-awesome icon used to display if a skill is a class skill or not
     * 
     * @param {Number} level Flag that determines if a skill is a class skill or not
     * @returns {String}
     * @private
     */
    _getClassSkillIcon(level) {
        const icons = {
            0: '<i class="far fa-circle"></i>',
            3: '<i class="fas fa-check"></i>'
        };

        return icons[level];
    }

    /**
     * Handle rolling of an item form the Actor sheet, obtaining the item instance an dispatching to it's roll method.
     * 
     * @param {Event} event The html event
     */
    _onItemSummary(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents('.item'),
            item = this.actor.getOwnedItem(Number(li.attr('data-item-id'))),
            chatData = item.getChatData({ secrets: this.actor.owner });

        if (li.hasClass('expanded')) {
            let summary = li.children('.item-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            let div = $(`<div class="item-summary">${chatData.description.value}</div>`);
            let props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
            div.append(props);
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass('expanded');
    }

    /**
     * Creates an TraitSelectorStarfinder dialog
     * 
     * @param {Event} event HTML Event
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        let a = $(event.currentTarget);
        const options = {
            name: a.parents('label').attr('for'),
            title: a.parent().text().trim(),
            choices: CONFIG[a.attr('data-options')]
        };

        new TraitSelectorStarfinder(this.actor, options).render(true);
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

        let res = sheetData.data.resources;
        if (res.primary && res.primary.value === 0) delete res.primary.value;
        if (res.primary && res.primary.max === 0) delete res.primary.max;
        if (res.secondary && res.secondary.value === 0) delete res.secondary.value;
        if (res.secondary && res.secondary.max === 0) delete res.secondary.max;

        sheetData["disableExperience"] = game.settings.get("starfinder", "disableExperienceTracking");

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     * 
     * @param {Object} sheetData Data for the sheet
     * @private
     */
    _prepareItems(sheetData) {
        const actorData = sheetData.actor;

        const inventory = {
            weapon: { label: "Weapons", items: [] },
            equipment: { label: "Equipment", items: [] },
            consumable: { label: "Consumables", items: [] },
            goods: { label: "Goods", items: [] }
        };

        const spellbook = [];
        const feats = [];
        const classes = [];

        let totalWeight = 0;
        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (Object.keys(inventory).includes(i.type)) {
                i.data.quantity.value = i.data.quantity.value || 0;
                i.data.weight.value = i.data.weight.value || 0;
                i.totalWeight = Math.round(i.data.quantity.value * i.data.weight.value * 10) / 10;
                i.hasCharges = i.type === "consumable" && i.data.charges.max > 0;
                inventory[i.type].items.push(i);
                totalWeight += i.totalWeight;
            }
        }

        actorData.inventory = inventory;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;
    }
}

Actors.registerSheet("starfinder", ActorSheetStarfinderCharacter, {
    types: ["character"],
    makeDefault: true
});
