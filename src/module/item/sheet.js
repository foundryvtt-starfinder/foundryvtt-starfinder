/**
 * Override and extend the core ItemSheet implementation to handle SFRPG specific item types
 * @type {ItemSheet}
 */
export class ItemSheetSFRPG extends ItemSheet {
    constructor(...args) {
      super(...args);
  
      /**
       * The tab being browsed
       * @type {string}
       */
      this._sheetTab = null;
  
      /**
       * The scroll position on the active tab
       * @type {number}
       */
      this._scrollTab = 100;
    }
  
    /* -------------------------------------------- */
  
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
        width: 560,
        height: 600,
        classes: ["sfrpg", "sheet", "item"],
        resizable: true,
        scrollY: [".tab.details"],
        tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
      });
    }
  
    /* -------------------------------------------- */
  
    /**
     * Return a dynamic reference to the HTML template path used to render this Item Sheet
     * @return {string}
     */
    get template() {
      const path = "systems/sfrpg/templates/items";
      return `${path}/${this.item.data.type}.html`;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Prepare item sheet data
     * Start with the base item data and extending with additional properties for rendering.
     */
    getData() {
      const data = super.getData();
      data.labels = this.item.labels;
  
      // Include CONFIG values
      data.config = CONFIG.SFRPG;
  
      // Item Type, Status, and Details
      data.itemType = data.item.type.titleCase();
      data.itemStatus = this._getItemStatus(data.item);
      data.itemProperties = this._getItemProperties(data.item);
      data.isPhysical = data.item.data.hasOwnProperty("quantity");
      data.hasLevel = data.item.data.hasOwnProperty("level") && data.item.type !== "spell";
      data.hasHands = data.item.data.hasOwnProperty("hands");
      data.hasCapacity = data.item.data.hasOwnProperty("capacity");

      // Armor specific details
      data.isPowerArmor = data.item.data.hasOwnProperty("armor") && data.item.data.armor.type === 'power';
  
      // Action Details
      data.hasAttackRoll = this.item.hasAttack;
      data.isHealing = data.item.data.actionType === "heal";
  
      // Spell-specific data
      if ( data.item.type === "spell" ) {
        let save = data.item.data.save;
        if ( this.item.isOwned && (save.type && !save.dc) ) {
          let actor = this.item.actor;
          let abl = actor.data.data.attributes.keyability || "int";
          save.dc = 10 + data.item.data.level + actor.data.data.abilities[abl].mod;
        }
      }
      
      return data;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
    _getItemStatus(item) {
      if ( ["weapon", "equipment"].includes(item.type) ) return item.data.equipped ? "Equipped" : "Unequipped";
      else if (item.type === "starshipWeapon") return item.data.mount.mounted ? "Mounted" : "Not Mounted";
      else if ( item.type === "augmentation" ) return `${item.data.type} (${item.data.system})`;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab
     * @return {Array}
     * @private
     */
    _getItemProperties(item) {
      const props = [];
      const labels = this.item.labels;
  
      if ( item.type === "weapon" ) {
        props.push(...Object.entries(item.data.properties)
          .filter(e => e[1] === true)
          .map(e => CONFIG.SFRPG.weaponProperties[e[0]]));
      }
  
      else if ( item.type === "spell" ) {
        props.push(
          labels.components,
          labels.materials,
          item.data.concentration ? "Concentration" : null,
          item.data.sr ? "Spell Resistence" : null,
          item.data.dismissible ? "Dismissible" : null
        )
      }
  
      else if ( item.type === "equipment" ) {
        props.push(CONFIG.SFRPG.armorTypes[item.data.armor.type]);
        props.push(labels.armor);
      }
  
      else if ( item.type === "feat" ) {
        props.push(labels.featType);
      }

      else if (item.type === "starshipWeapon") {
        props.push(CONFIG.SFRPG.starshipWeaponTypes[item.data.weaponType]);
        props.push(CONFIG.SFRPG.starshipWeaponClass[item.data.class]);
      }
  
      // Action type
      if ( item.data.actionType ) {
        props.push(CONFIG.SFRPG.itemActionTypes[item.data.actionType]);
      }
  
      // Action usage
      if ( (item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation) ) {
        props.push(
          labels.activation,
          labels.range,
          labels.target,
          labels.duration
        )
      }
      return props.filter(p => !!p);
    }
  
    /* -------------------------------------------- */
  
    setPosition(position={}) {
      if ( this._sheetTab === "details" ) position.height = "auto";
      return super.setPosition(position);
    }
  
    /* -------------------------------------------- */
    /*  Form Submission                             */
      /* -------------------------------------------- */
  
    /**
     * Extend the parent class _updateObject method to ensure that damage ends up in an Array
     * @private
     */
    _updateObject(event, formData) {  
      // Handle Damage Array
      let damage = Object.entries(formData).filter(e => e[0].startsWith("data.damage.parts"));
      formData["data.damage.parts"] = damage.reduce((arr, entry) => {
        let [i, j] = entry[0].split(".").slice(3);
        if ( !arr[i] ) arr[i] = [];
        arr[i][j] = entry[1];
        return arr;
      }, []);

      // Handle Ability Adjustments array
      let abilityMods = Object.entries(formData).filter(e => e[0].startsWith("data.abilityMods.parts"));
      formData["data.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
        let [i, j] = entry[0].split(".").slice(3);
        if ( !arr[i] ) arr[i] = [];
        arr[i][j] = entry[1];
        return arr;
      }, []);
  
      // Update the Item
      super._updateObject(event, formData);
    }
  
    /* -------------------------------------------- */
  
    /**
     * Activate listeners for interactive item sheet events
     */
    activateListeners(html) {
      super.activateListeners(html);
  
      // Save scroll position
      html.find(".tab.active")[0].scrollTop = this._scrollTab;
      html.find(".tab").scroll(ev => this._scrollTab = ev.currentTarget.scrollTop);
  
      // Modify damage formula
      html.find(".damage-control").click(this._onDamageControl.bind(this));
      html.find(".ability-adjustments-control").click(this._onAbilityAdjustmentsControl.bind(this));
    }
  
    /* -------------------------------------------- */

    async _onAbilityAdjustmentsControl(event) {
      event.preventDefault();
      const a = event.currentTarget;

      // Add new ability adjustment component
      if (a.classList.contains("add-ability-adjustment")) {
        await this._onSubmit(event);
        const abilityMods = this.item.data.data.abilityMods;
        return this.item.update({"data.abilityMods.parts": abilityMods.parts.concat([[0, ""]])});
      }

      // Remove an ability adjustment component
      if (a.classList.contains("delete-ability-adjustment")) {
        await this._onSubmit(event);
        const li = a.closest(".ability-adjustment-part");
        const abilityMods = duplicate(this.item.data.data.abilityMods);
        abilityMods.parts.splice(Number(li.dataset.abilityAdjustment), 1);
        return this.item.update({"data.abilityMods.parts": abilityMods.parts});
      }
    }
  
    /**
     * Add or remove a damage part from the damage formula
     * @param {Event} event     The original click event
     * @return {Promise}
     * @private
     */
    async _onDamageControl(event) {
      event.preventDefault();
      const a = event.currentTarget;
  
      // Add new damage component
      if ( a.classList.contains("add-damage") ) {
        await this._onSubmit(event);  // Submit any unsaved changes
        const damage = this.item.data.data.damage;
        return this.item.update({"data.damage.parts": damage.parts.concat([["", ""]])});
      }
  
      // Remove a damage component
      if ( a.classList.contains("delete-damage") ) {
        await this._onSubmit(event);  // Submit any unsaved changes
        const li = a.closest(".damage-part");
        const damage = duplicate(this.item.data.data.damage);
        damage.parts.splice(Number(li.dataset.damagePart), 1);
        return this.item.update({"data.damage.parts": damage.parts});
      }
    }
  }
