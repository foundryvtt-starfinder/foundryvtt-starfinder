import { DiceStarfinder } from "../dice.js";

export class ItemStarfinder extends Item {

  /* -------------------------------------------- */
  /*  Item Properties                             */
  /* -------------------------------------------- */

  /**
   * Does the Item implement an attack roll as part of its usage
   * @type {boolean}
   */
  get hasAttack() {
    if (this.data.type === "starshipWeapon") return true;
    return ["mwak", "rwak", "msak", "rsak"].includes(this.data.data.actionType);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a damage roll as part of its usage
   * @type {boolean}
   */
  get hasDamage() {
    return !!(this.data.data.damage && this.data.data.damage.parts.length);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a saving throw as part of its usage
   * @type {boolean}
   */
  get hasSave() {
    return !!(this.data.data.save && this.data.data.save.type);
  }

  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
    const C = CONFIG.STARFINDER;
    const labels = {};
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

    // Spell Level,  School, and Components
    if (itemData.type === "spell") {
      labels.level = C.spellLevels[data.level];
      labels.school = C.spellSchools[data.school];
    }

    // Feat Items
    else if (itemData.type === "feat") {
      const act = data.activation;
      if (act && act.type) labels.featType = data.damage.length ? "Attack" : "Action";
      else labels.featType = "Passive";
    }

    // Equipment Items
    else if (itemData.type === "equipment") {
      labels.eac = data.armor.eac ? `${data.armor.eac} EAC` : "";
      labels.kac = data.armor.kac ? `${data.armor.kac} KAC` : "";
    }

    // Activated Items
    if (data.hasOwnProperty("activation")) {

      // Ability Activation Label
      let act = data.activation || {};
      if (act) labels.activation = [
        act.cost, 
        act.type === "none" ? null : C.abilityActivationTypes[act.type]
      ].filterJoin(" ");

      let tgt = data.target || {};
      if (tgt.value && tgt.value === "") tgt.value = null;

      labels.target = [tgt.value].filterJoin(" ");

      let area = data.area || {};
      if (["none", "touch", "personal"].includes(area.units)) area.value = null;
      if (typeof area.value === 'number' && area.value === 0) area.value = null;
      if (["none"].includes(area.units)) area.units = null;

      labels.area = [area.value, C.distanceUnits[area.units] || null, C.spellAreaShapes[area.shape], C.spellAreaEffects[area.effect]].filterJoin(" ");

      // Range Label
      let rng = data.range || {};
      if (["none", "touch", "personal"].includes(rng.units) || (rng.value === 0)) {
        rng.value = null;
      }
      if (["none"].includes(rng.units)) rng.units = null;
      labels.range = [rng.value, C.distanceUnits[rng.units] || null].filterJoin(" ");

      // Duration Label
      let dur = data.duration || {};
      labels.duration = [dur.value].filterJoin(" ");
    }

    // Item Actions
    if (data.hasOwnProperty("actionType")) {

      // Save DC
      let save = data.save || {};
      if (!save.type) save.dc = null;
      labels.save = save.type ? `DC ${save.dc || ""} ${C.saves[save.type]}` : "";

      // Damage
      let dam = data.damage || {};
      if (dam.parts) labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
    }

    // Assign labels and return the Item
    this.labels = labels;
  }

  /* -------------------------------------------- */

  /**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async roll() {

    // Basic template rendering data
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token.scene._id}.${token.id}` : null,
      item: this.data,
      data: this.getChatData(),
      labels: this.labels,
      hasAttack: this.hasAttack,
      hasDamage: this.hasDamage,
      isVersatile: this.isVersatile,
      hasSave: this.hasSave
    };

    // Render the chat card template
    const templateType = ["tool", "consumable"].includes(this.data.type) ? this.data.type : "item";
    const template = `systems/starfinder/templates/chat/${templateType}-card.html`;
    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    const chatData = {
      user: game.user._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperIDs("GM");
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Create the chat message
    return ChatMessage.create(chatData, { displaySheet: false });
  }

  /* -------------------------------------------- */
  /*  Chat Cards																	*/
  /* -------------------------------------------- */

  getChatData(htmlOptions) {
    const data = duplicate(this.data.data);
    const labels = this.labels;

    // Rich text description
    data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

    // Item type specific properties
    const props = [];
    const fn = this[`_${this.data.type}ChatData`];
    if (fn) fn.bind(this)(data, labels, props);

    // General equipment properties
    if (data.hasOwnProperty("equipped") && !["goods", "augmentation", "technological", "upgrade"].includes(this.data.type)) {
      props.push(
        data.equipped ? "Equipped" : "Not Equipped",
        data.proficient ? "Proficient" : "Not Proficient",
      );
    }

    // Ability activation properties
    if (data.hasOwnProperty("activation")) {
      props.push(
        labels.target,
        labels.area,
        labels.activation,
        labels.range,
        labels.duration
      );
    }

    if (data.hasOwnProperty("capacity")) {
      props.push(
        labels.capacity
      );
    }

    // Filter properties and return
    data.properties = props.filter(p => !!p);
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for equipment type items
   * @private
   */
  _equipmentChatData(data, labels, props) {
    props.push(
      CONFIG.STARFINDER.armorTypes[data.armor.type],
      labels.eac || null,
      labels.kac || null
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for weapon type items
   * @private
   */
  _weaponChatData(data, labels, props) {
    props.push(
      CONFIG.STARFINDER.weaponTypes[data.weaponType],
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for consumable type items
   * @private
   */
  _consumableChatData(data, labels, props) {
    props.push(
      CONFIG.STARFINDER.consumableTypes[data.consumableType],
      data.uses.value + "/" + data.uses.max + " Charges"
    );
    data.hasCharges = data.uses.value >= 0;
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for tool type items
   * @private
   */
  _toolChatData(data, labels, props) {
    props.push(
      CONFIG.STARFINDER.abilities[data.ability] || null,
      CONFIG.STARFINDER.proficiencyLevels[data.proficient || 0]
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for goods type items
   * @private
   */
  _goodsChatData(data, labels, props) {
    props.push(
      "Goods",
      data.bulk ? `Bulk ${data.bulk}` : null
    );
  }

  /**
   * Prepare chat card data for technological type items
   * @param {Object} data The items data
   * @param {Object} labels Any labels for the item
   * @param {Object} props The items properties
   */
  _technologicalChatData(data, labels, props) {
    props.push(
      "Technological",
      data.bulk ? `Bulk ${data.bulk}` : null,
      data.hands ? `Hands ${data.hands}` : null
    );
  }

  /**
   * Prepare chat card data for armor upgrades
   * @param {Object} data The items data
   * @param {Object} labels Any labels for the item
   * @param {Object} props The items properties
   */
  _upgradeChatData(data, labels, props) {
    let armorType = "";

    if (data.armorType === 'any') {
      armorType = "Any"
    } else {
      armorType = CONFIG.STARFINDER.armorTypes[data.armorType];
    }

    props.push(
      "Armor Upgrade",
      data.slots ? `Slots ${data.slots}` : null,
      `Allowed armor ${armorType}`
    );
  }

  _augmentationChatData(data, labels, props) {
    props.push(
      "Augmentation",
      data.type ? CONFIG.STARFINDER.augmentationTypes[data.type] : null,
      data.system ? CONFIG.STARFINDER.augmentationSytems[data.system] : null
    );
  }

  /**
   * Prepare chat card data for weapon fusions
   * @param {Object} data The items data
   * @param {Object} labels Any labels for the item
   * @param {Object} props The items properties
   */
  _fusionChatData(data, labels, props) {
    props.push(
      "Weapon Fusion",
      data.level ? `Level ${data.level}` : null
    );
  }

  _starshipWeaponChatData(data, labels, props) {
    props.push(
      "Starship Weapon",
      data.weaponType ? CONFIG.STARFINDER.starshipWeaponTypes[data.weaponType] : null,
      data.class ? CONFIG.STARFINDER.starshipWeaponClass[data.class] : null,
      data.range ? CONFIG.STARFINDER.starshipWeaponRanges[data.range] : null,
      data.mount.mounted ? "Mounted" : "Not Mounted",
      data.mount.activated ? "Activated" : "Not Activated"
    );
  }

  /* -------------------------------------------- */

  /**
   * Render a chat card for Spell type data
   * @return {Object}
   * @private
   */
  _spellChatData(data, labels, props) {
    const ad = this.actor.data.data;

    // Spell saving throw text
    const abl = ad.attributes.keyability || "int";
    if (this.hasSave && !data.save.dc) data.save.dc = 10 + data.level + ad.abilities[abl].mod;
    labels.save = `DC ${data.save.dc} ${CONFIG.STARFINDER.saves[data.save.type]}`;

    // Spell properties
    props.push(
      labels.level
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for items of the "Feat" type
   */
  _featChatData(data, labels, props) {
    const ad = this.actor.data.data;

    // Spell saving throw text
    const abl = data.ability || ad.attributes.spellcasting || "str";
    if (this.hasSave && !data.save.dc) data.save.dc = 8 + ad.abilities[abl].mod + ad.attributes.prof;
    labels.save = `DC ${data.save.dc} ${CONFIG.STARFINDER.abilities[data.save.ability]}`;

    // Feat properties
    props.push(
      data.requirements
    );
  }

  _themeChatData(data, labels, props) {
    props.push(
      "Theme",
      data.abilityMod.ability ? `Ability ${CONFIG.STARFINDER.abilities[data.abilityMod.ability]}` : null,
      data.skill ? `Skill ${CONFIG.STARFINDER.skills[data.skill]}` : null
    );
  }

  _raceChatData(data, labels, props) {
    props.push(
      "Race",
      data.type ? data.type : null,
      data.subtype ? data.subtype : null
    );
  }

  /* -------------------------------------------- */
  /*  Item Rolls - Attack, Damage, Saves, Checks  */
  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, spell, or equipment)
   * Rely upon the DiceStarfinder.d20Roll logic for the core implementation
   */
  rollAttack(options = {}) {
    const itemData = this.data.data;
    const actorData = this.actor.data.data;
    if (!this.hasAttack) {
      throw new Error("You may not place an Attack Roll with this Item.");
    }

    if (this.data.type === "starshipWeapon") return this._rollStarshipAttack(options);

    // Determine ability score modifier
    let abl = itemData.ability;
    if (!abl && (this.data.type === "spell")) abl = actorData.attributes.spellcasting || "int";
    else if (!abl) abl = "str";

    // Define Roll parts
    const parts = ["@item.attackBonus", `@abilities.${abl}.mod`, "@attributes.bab"];
    if ((this.data.type === "weapon") && !itemData.proficient) parts.push("-4");

    // Define Critical threshold
    let crit = 20;
    //if ( this.data.type === "weapon" ) crit = this.actor.getFlag("starfinder", "weaponCriticalThreshold") || 20;

    // Define Roll Data
    const rollData = duplicate(actorData);
    rollData.item = itemData;
    const title = `${this.name} - Attack Roll`;

    // Call the roll helper utility
    DiceStarfinder.d20Roll({
      event: options.event,
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      critical: crit,
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      onClose: this._onAttackRollClose.bind(this)
    });
  }

  /**
   * Handle updating item capacity when the attack dialog closes.
   * 
   * @param {Html} html The html from the dailog
   * @param {Array} parts The parts of the roll
   * @param {Object} data The data
   */
  _onAttackRollClose(html, parts, data) {
    const itemData = this.data.data;

    if (itemData.hasOwnProperty("capacity")) {
      const capacity = itemData.capacity;
      const usage = itemData.usage;
      
      if (!capacity || capacity.max && capacity.max === 0) return;
      if (usage.per && ["round", "shot"].includes(usage.per)) {
        capacity.value = Math.max(capacity.value - usage.value, 0);
      } else if (usage.per && ['minute'].includes(usage.per)) {
        if (game.combat) {
          const round = game.combat.current.round || 0;
          if (round % 10 === 1) {
            capacity.value = Math.max(capacity.value - usage.value, 0);
          }
        } else {
          ui.notifications.info("Currently cannot deduct usage from powered melee weapons outside of combat.");
        }
      }
      
      this.actor.updateOwnedItem({
        id: this.data.id,
        'data.capacity.value': capacity.value
      });
    }
  }

  /**
   * Place an attack roll for a starship using an item.
   * @param {Object} options Options to pass to the attack roll
   */
  _rollStarshipAttack(options = {}) {
    const itemData = this.data.data;
    const actorData = this.actor.data.data;

    const parts = ["@item.attackBonus"];

    const rollData = duplicate(actorData);
    rollData.item = itemData;
    const title = `${this.name} - Attack Roll`;

    DiceStarfinder.d20Roll({
      event: options.event,
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      critical: 20,
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * Place a damage roll using an item (weapon, feat, spell, or equipment)
   * Rely upon the DiceStarfinder.damageRoll logic for the core implementation
   */
  rollDamage({ event, versatile = false } = {}) {
    const itemData = this.data.data;
    const actorData = this.actor.data.data;
    if (!this.hasDamage) {
      throw new Error("You may not make a Damage Roll with this Item.");
    }

    if (this.data.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });

    // Determine ability score modifier
    let abl = itemData.ability;
    if (!abl && (this.data.type === "spell")) abl = actorData.attributes.spellcasting || "int";
    else if (!abl) abl = "str";

    // Define Roll parts
    const parts = itemData.damage.parts.map(d => d[0]);
    //if ( versatile && itemData.damage.versatile ) parts[0] = itemData.damage.versatile;

    // Cantrips in Starfinder don't scale :(
    // if ( (this.data.type === "spell") && (itemData.scaling.mode === "cantrip") ) {
    //   const lvl = this.actor.data.type === "character" ? actorData.details.level.value : actorData.details.cr;
    //   this._scaleCantripDamage(parts, lvl, itemData.scaling.formula );
    // }

    // Define Roll Data
    const rollData = mergeObject(duplicate(actorData), {
      item: itemData,
      mod: actorData.abilities[abl].mod
    });
    const title = `${this.name} - Damage Roll`;

    // Call the roll helper utility
    DiceStarfinder.damageRoll({
      event: event,
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      dialogOptions: {
        width: 400,
        top: event ? event.clientY - 80 : null,
        left: window.innerWidth - 710
      }
    });
  }

  _rollStarshipDamage({ event } = {}) {
    const itemData = this.data.data;
    const actorData = this.actor.data.data;

    if (!this.hasDamage) {
      throw new Error("you may not make a Damage Roll with this item");
    }

    const parts = itemData.damage.parts.map(d => d[0]);

    const rollData = mergeObject(duplicate(actorData), {
      item: itemData
    });

    const title = `${this.name} - Damage Roll`;

    DiceStarfinder.damageRoll({
      event: event,
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      dialogOptions: {
        width: 400,
        top: event ? event.clientY - 80 : null,
        left: window.innerWidth - 710
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * Adjust a cantrip damage formula to scale it for higher level characters and monsters
   * @private
   */
  _scaleCantripDamage(parts, level, scale) {
    const add = Math.floor((level + 1) / 6);
    if (add === 0) return;
    if (scale && (scale !== parts[0])) {
      parts[0] = parts[0] + " + " + scale.replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${add}d${d}`);
    } else {
      parts[0] = parts[0].replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${parseInt(nd) + add}d${d}`);
    }
  }

  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, spell, or equipment)
   * Rely upon the DiceStarfinder.d20Roll logic for the core implementation
   */
  async rollFormula(options = {}) {
    const itemData = this.data.data;
    const actorData = this.actor.data.data;
    if (!itemData.formula) {
      throw new Error("This Item does not have a formula to roll!");
    }

    // Define Roll Data
    const rollData = duplicate(actorData);
    rollData.item = itemData;
    const title = `${this.name} - Other Formula`;

    const roll = new Roll(itemData.formula, rollData).roll();
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: itemData.chatFlavor || title,
      rollMode: game.settings.get("core", "rollMode")
    });
  }

  /* -------------------------------------------- */

  /**
   * Use a consumable item
   */
  rollConsumable(options = {}) {
    let itemData = this.data.data;
    const labels = this.labels;
    const formula = itemData.damage ? labels.damage : itemData.formula;

    // Submit the roll to chat
    if (formula) {
      new Roll(formula).toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Consumes ${this.name}`
      });
    } else {
      ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `Consumes ${this.name}`
      })
    }

    // Deduct consumed charges from the item
    if (itemData.uses.autoUse) {
      let q = itemData.quantity;
      let c = itemData.uses.value;

      // Deduct an item quantity
      if (c <= 1 && q > 1) {
        this.actor.updateOwnedItem({
          id: this.data.id,
          'data.quantity': Math.max(q - 1, 0),
          'data.uses.value': itemData.uses.max
        }, true);
      }

      // Optionally destroy the item
      else if (c <= 1 && q <= 1 && itemData.uses.autoDestroy) {
        this.actor.deleteOwnedItem(this.data.id);
      }

      // Deduct the remaining charges
      else {
        this.actor.updateOwnedItem({ id: this.data.id, 'data.uses.value': Math.max(c - 1, 0) });
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Perform an ability recharge test for an item which uses the d6 recharge mechanic
   * @prarm {Object} options
   */
  async rollRecharge(options = {}) {
    const data = this.data.data;
    if (!data.recharge.value) return;

    // Roll the check
    const roll = new Roll("1d6").roll();
    const success = roll.total >= parseInt(data.recharge.value);

    // Display a Chat Message
    const rollMode = game.settings.get("core", "rollMode");
    const chatData = {
      user: game.user._id,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
      whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessage.getWhisperIDs("GM") : null,
      blind: rollMode === "blindroll",
      roll: roll,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };

    // Update the Item data
    const promises = [ChatMessage.create(chatData)];
    if (success) promises.push(this.update({ "data.recharge.charged": true }));
    return Promise.all(promises);
  }

  /* -------------------------------------------- */

  /**
   * Roll a Tool Check
   * Rely upon the DiceStarfinder.d20Roll logic for the core implementation
   */
  rollToolCheck(options = {}) {
    if (this.type !== "tool") throw "Wrong item type!";
    const itemData = this.data.data;

    // Prepare roll data
    let rollData = duplicate(this.actor.data.data),
      abl = itemData.ability || "int",
      parts = [`@abilities.${abl}.mod`, "@proficiency"],
      title = `${this.name} - Tool Check`;
    rollData["ability"] = abl;
    rollData["proficiency"] = Math.floor((itemData.proficient || 0) * rollData.attributes.prof);

    // Call the roll helper utility
    DiceStarfinder.d20Roll({
      event: options.event,
      parts: parts,
      data: rollData,
      template: "systems/starfinder/templates/chat/tool-roll-dialog.html",
      title: title,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: (parts, data) => `${this.name} - ${CONFIG.STARFINDER.abilities[abl]} Check`,
      dialogOptions: {
        width: 400,
        top: options.event ? event.clientY - 80 : null,
        left: window.innerWidth - 710,
      },
      onClose: (html, parts, data) => {
        abl = html.find('[name="ability"]').val();
        data.ability = abl;
        parts[1] = `@abilities.${abl}.mod`;
      }
    });
  }

  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
  }

  /* -------------------------------------------- */

  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;

    // Validate permission to proceed with the roll
    const isTargetted = action === "save";
    if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

    // Get the Actor from a synthetic Token
    const actor = this._getChatCardActor(card);
    if (!actor) return;

    // Get the Item
    const item = actor.getOwnedItem(card.dataset.itemId);

    // Get the target
    const target = isTargetted ? this._getChatCardTarget(card) : null;

    // Attack and Damage Rolls
    if (action === "attack") await item.rollAttack({ event });
    else if (action === "damage") await item.rollDamage({ event });
    else if (action === "versatile") await item.rollDamage({ event, versatile: true });
    else if (action === "formula") await item.rollFormula({ event });

    // Saving Throw
    else if (action === "save") await target.rollSave(button.dataset.type, { event });

    // Consumable usage
    else if (action === "consume") await item.rollConsumable({ event });

    // Tool usage
    else if (action === "toolCheck") await item.rollToolCheck({ event });

    // Re-enable the button
    button.disabled = false;
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardActor(card) {

    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId;
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split(".");
      const scene = game.scenes.get(sceneId);
      if (!scene) return null;
      const tokenData = scene.getEmbeddedEntity("tokens", tokenId);
      if (!tokenData) return null;
      const token = new Token(tokenData);
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardTarget(card) {
    const character = game.user.character;
    const controlled = canvas.tokens.controlled;
    if (controlled.length === 0) return character || null;
    if (controlled.length === 1) return controlled[0].actor;
    else throw new Error(`You must designate a specific Token as the roll target`);
  }
}
