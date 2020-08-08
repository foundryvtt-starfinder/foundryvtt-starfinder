import { TraitSelectorSFRPG } from "../../apps/trait-selector.js";
import { ActorSheetFlags } from "../../apps/actor-flags.js";
import { spellBrowser } from "../../packs/spell-browser.js";

/**
 * Extend the basic ActorSheet class to do all the SFRPG things!
 * This sheet is an Abstract layer which is not used.
 * 
 * @type {ActorSheet}
 */
export class ActorSheetSFRPG extends ActorSheet {
    constructor(...args) {
        super(...args);

        this._filters = {
            inventory: new Set(),
            spellbook: new Set(),
            features: new Set()
        };
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            scrollY: [
                ".tab.attributes",
                ".inventory .inventory-list",
                ".features .inventory-list",
                ".spellbook .inventory-list",
                ".modifiers .inventory-list"
            ],
            tabs: [
                {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "attributes"}, 
                {navSelector: ".subtabs", contentSelector: ".modifiers-body", initial: "permanent"}
            ]
        });
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    getData() {
        let isOwner = this.entity.owner;
        const data = {
            owner: isOwner,
            limited: this.entity.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.entity.data.type === "character",
            isShip: this.entity.data.type === 'starship',
            isVehicle: this.entity.data.type === 'vehicle',
            isDrone: this.entity.data.type === 'drone',
            config: CONFIG.SFRPG
        };

        data.actor = duplicate(this.actor.data);
        data.items = this.actor.items.map(i => {
            i.data.labels = i.labels;
            return i.data;
        });
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.data = data.actor.data;
        data.labels = this.actor.labels || {};
        data.filters = this._filters;

        if (data.actor.type !== "starship" && data.actor.type !== "vehicle") {
            // Ability Scores
            for (let [a, abl] of Object.entries(data.actor.data.abilities)) {
                abl.label = CONFIG.SFRPG.abilities[a];
            }

            // Update skill labels
            for (let [s, skl] of Object.entries(data.actor.data.skills)) {                
                skl.ability = data.actor.data.abilities[skl.ability].label.substring(0, 3);
                skl.icon = this._getClassSkillIcon(skl.value);

                let skillLabel = CONFIG.SFRPG.skills[s.substring(0, 3)];
                if (skl.subname) {
                    skillLabel += ` (${skl.subname})`;
                }

                skl.label = skillLabel;
                skl.hover = CONFIG.SFRPG.skillProficiencyLevels[skl.value];
            }

            data.data.skills = Object.keys(data.data.skills).sort().reduce((skills, key) => {
                skills[key] = data.data.skills[key];

                return skills;
            }, {});

            data.data.hasSkills = Object.values(this.entity.data.data.skills).filter(x => x.enabled).length > 0;

            this._prepareTraits(data.actor.data.traits);
        }

        this._prepareItems(data);

        return data;
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

        const filterLists = html.find(".filter-list");
        filterLists.each(this._initializeFilterItemList.bind(this));
        filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));

        if (!this.options.editable) return;

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(this._onTraitSelector.bind(this));

        // Ability Checks
        html.find('.ability-name').click(this._onRollAbilityCheck.bind(this));

        // Roll Skill Checks
        html.find('.skill-name').click(this._onRollSkillCheck.bind(this));

        // Edit Skill
        html.find('h4.skill-name').contextmenu(this._onEditSkill.bind(this));

        // Add skill
        html.find('#add-profession').click(this._onAddSkill.bind(this));

        // Configure Special Flags
        html.find('.configure-flags').click(this._onConfigureFlags.bind(this));

        // Saves
        html.find('.save-name').click(this._onRollSave.bind(this));

        /* -------------------------------------------- */
        /*  Spellbook
        /* -------------------------------------------- */
        html.find('.spell-browse').click(ev => spellBrowser.render(true)); // Inventory Browser

        /* -------------------------------------------- */
        /*  Inventory
        /* -------------------------------------------- */

        // Create New Item
        html.find('.item-create').click(ev => this._onItemCreate(ev));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            const item = this.actor.getOwnedItem(itemId);
            // const item = this.actor.getEmbeddedEntity("OwnedItem", itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            let li = $(ev.currentTarget).parents(".item"),
                itemId = li.attr("data-item-id");
            // this.actor.deleteOwnedItem(itemId);
            this.actor.deleteEmbeddedEntity("OwnedItem", itemId)
            li.slideUp(200, () => this.render(false));
        });

        // Item Dragging
        let handler = ev => this._onDragItemStart(ev);
        html.find('li.item').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        // Item Rolling
        html.find('.item .item-image').click(event => this._onItemRoll(event));

        // Roll attack from item 
        html.find('.item-action .attack').click(event => this._onItemRollAttack(event));

        // Roll damage for item
        html.find('.item-action .damage').click(event => this._onItemRollDamage(event));

        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));
    }

    /** @override */
    _onChangeTab(event, tabs, active) {
        if (active === "modifiers") {
            this._tabs[1].activate("conditions");
        }

        super._onChangeTab();
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.SFRPG.energyDamageTypes,
            "di": CONFIG.SFRPG.damageTypes,
            "dv": CONFIG.SFRPG.damageTypes,
            "ci": CONFIG.SFRPG.conditionTypes,
            "languages": CONFIG.SFRPG.languages,
            "weaponProf": CONFIG.SFRPG.weaponProficiencies,
            "armorProf": CONFIG.SFRPG.armorProficiencies
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            if (!trait) continue;
            let values = [];
            if (trait.value) {
                values = trait.value instanceof Array ? trait.value : [trait.value];
            }
            trait.selected = values.reduce((obj, t) => {
                if (typeof t !== "object") obj[t] = choices[t];
                else {
                    for (const [key, value] of Object.entries(t))
                        obj[key] = `${choices[key]} ${value}`;
                }

                return obj;
            }, {});

            if (trait.custom) {
                trait.custom.split(';').forEach((c, i) => trait.selected[`custom${i + 1}`] = c.trim());
            }
            trait.cssClass = !isObjectEmpty(trait.selected) ? "" : "inactive";
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
     * Handle editing a skill
     * @param {Event} event The originating contextmenu event
     */
    _onEditSkill(event) {
        event.preventDefault();
        let skillId = event.currentTarget.parentElement.dataset.skill;

        return this.actor.editSkill(skillId, {event: event});
    }

    /**
     * Handle adding a skill
     * @param {Event} event The originating contextmenu event
     */
    _onAddSkill(event) {
        event.preventDefault();

        return this.actor.addSkill({event: event});
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event The originating click event
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: duplicate(header.dataset)
        };
        delete itemData.data['type'];
        return this.actor.createOwnedItem(itemData);
    }

    _onItemRollAttack(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.rollAttack({event: event});
    }

    _onItemRollDamage(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.rollDamage({event: event});
    }

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    _onItemRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        if (item.data.type === "spell") {
            return this.actor.useSpell(item, {configureDialog: !event.shiftKey});
        }

        else return item.roll();
    }

    /**
     * Handle attempting to recharge an item usage by rolling a recharge check
     * @param {Event} event The originating click event
     */
    _ontItemRecharge(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);
        return item.rollRecharge();
    }

    /**
     * Handle toggling the equipped state of an item.
     * @param {Event} event The originating click event
     */
    _onItemEquippedChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        item.update({
            ["data.equipped"]: !item.data.data.equipped
        });
    }

    /**
     * Handle rolling a Save
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSave(event) {
        event.preventDefault();
        const save = event.currentTarget.parentElement.dataset.save;
        this.actor.rollSave(save, {event: event});
    }

    /**
     * Handle rolling a Skill check
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.parentElement.dataset.skill;
        this.actor.rollSkill(skill, {event: event});
    }

    /**
     * Handle rolling an Ability check
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollAbilityCheck(event) {
        event.preventDefault();
        let ability = event.currentTarget.parentElement.dataset.ability;
        this.actor.rollAbility(ability, {event: event});
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
            item = this.actor.getOwnedItem(li.data('item-id')),
            chatData = item.getChatData({ secrets: this.actor.owner, rollData: this.actor.data.data });

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

    _prepareSpellbook(data, spells) {
        const owner = this.actor.owner;

        const levels = {
            "always": -30,
            "innate": -20
        };

        const useLabels = {
            "-30": "-",
            "-20": "-",
            "-10": "-",
            "0": "&infin;"
        };

        let spellbook = spells.reduce((sb, spell) => {
            const mode = spell.data.preparation.mode || "";
            const lvl = levels[mode] || spell.data.level || 0;

            if (!sb[lvl]) {
                sb[lvl] = {
                    level: lvl,
                    usesSlots: lvl > 0,
                    canCreate: owner && (lvl >= 0),
                    canPrepare: (data.actor.type === 'character') && (lvl > 0),
                    label: lvl >= 0 ? CONFIG.SFRPG.spellLevels[lvl] : CONFIG.SFRPG.spellPreparationModes[mode],
                    spells: [],
                    uses: useLabels[lvl] || data.data.spells["spell"+lvl].value || 0,
                    slots: useLabels[lvl] || data.data.spells["spell"+lvl].max || 0,
                    dataset: {"type": "spell", "level": lvl}
                };
            }

            sb[lvl].spells.push(spell);
            return sb;
        }, {});

        spellbook = Object.values(spellbook);
        spellbook.sort((a, b) => a.level - b.level);

        return spellbook;
    }

    /**
     * Creates an TraitSelectorSFRPG dialog
     * 
     * @param {Event} event HTML Event
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const label = a.parentElement.querySelector('label');
        const options = {
            name: label.getAttribute("for"),
            title: label.innerText,
            choices: CONFIG.SFRPG[a.dataset.options]
        };

        new TraitSelectorSFRPG(this.actor, options).render(true);
    }

    /**
     * Handle toggling of filters to display a different set of owned items
     * @param {Event} event     The click event which triggered the toggle
     * @private
     */
    _onToggleFilter(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const set = this._filters[li.parentElement.dataset.filter];
        const filter = li.dataset.filter;
        if (set.has(filter)) set.delete(filter);
        else set.add(filter);
        this.render();
    }

    /**
     * Iinitialize Item list filters by activating the set of filters which are currently applied
     * @private
     */
    _initializeFilterItemList(i, ul) {
        const set = this._filters[ul.dataset.filter];
        const filters = ul.querySelectorAll(".filter-item");
        for (let li of filters) {
            if (set.has(li.dataset.filter)) li.classList.add("active");
        }
    }

    /**
     * Determine whether an Owned Item will be shown based on the current set of filters
     * 
     * @return {Boolean}
     * @private
     */
    _filterItems(items, filters) {
        return items.filter(item => {
            const data = item.data;

            // Action usage
            for (let f of ["action", "move", "swift", "full", "reaction"]) {
                if (filters.has(f)) {
                    if ((data.activation && (data.activation.type !== f))) return false;
                }
            }
            if (filters.has("concentration")) {
                if (data.components.concentration !== true) return false;
            }

            // Equipment-specific filters
            if (filters.has("equipped")) {
                if (data.equipped && data.equipped !== true) return false;
            }
            return true;
        });
    }

    /**
     * Handle click events for the Traits tab button to configure special Character Flags
     */
    _onConfigureFlags(event) {
        event.preventDefault();
        new ActorSheetFlags(this.actor).render(true);
    }

    getParent(itemId, context, items) {
        if (!itemId) {
            console.log("No itemId specified");
            return null;
        }

        if (!context || !items) {
            console.log(`No context or no items`);
            return null;
        }

        for (let item of items) {
            if (item._id === itemId) {
                return context;
            }

            if (item.data.items) {
                let parent = this.getParent(itemId, item, item.data.items);
                if (parent !== null) {
                    return parent;
                }
            }
        }

        return null;
    }

    async _onDrop(event) {
        const dragData = event.dataTransfer.getData('text/plain');

        const parsedDragData = JSON.parse(dragData);
        if (!parsedDragData) {
            console.log("Unknown item data");
            return;
        }

        const actor = this.actor;
        
        if (parsedDragData.pack) {
            const pack = game.packs.get(parsedDragData.pack);
            return await this.stashOrUnstash(event, actor, async () => {
                const itemData = await pack.getEntry(parsedDragData.id);
                const item = await actor.createOwnedItem(itemData);
                return actor.getOwnedItem(item._id);
            });
        } else if (parsedDragData.data) {
            return await this.moveItemBetweenActors(event, parsedDragData.actorId, actor._id, parsedDragData.data._id);
        } else {
            let item = game.items.get(parsedDragData.id);
            if (!item) {
                console.log("Unknown item source: " + JSON.stringify(parsedDragData));
                return;
            }

            return this.stashOrUnstash(event, actor, () => {
                return actor.createEmbeddedEntity("OwnedItem", duplicate(item.data));
            });
        }
    }

    async removeItemFromActor(sourceActor, item, quantity) {
        const sourceItemQuantity = Math.min(item.data.data.quantity, quantity);
        const newItemQuantity = sourceItemQuantity - quantity;
        console.log(`Removing ${quantity}, clamped ${sourceItemQuantity}, final: ${newItemQuantity}`);

        if (newItemQuantity < 1) {
          await sourceActor.deleteEmbeddedEntity('OwnedItem', item._id);
        } else {
          const update = { '_id': item._id, 'data.quantity': newItemQuantity };
          await sourceActor.updateEmbeddedEntity('OwnedItem', update);
        }
    }

    async addItemToActor(targetActor, item, quantity) {
        let itemInTargetActor = targetActor.items.find(i => i.name === item.name);
        if (itemInTargetActor !== null)
        {
            const targetItemNewQuantity = Number(itemInTargetActor.data.data.quantity) + quantity;
            const update = { '_id': itemInTargetActor._id, 'data.quantity': targetItemNewQuantity};
            await targetActor.updateEmbeddedEntity('OwnedItem', update);
        }
        else
        {
          let newItemData = duplicate(item);
          newItemData.data.quantity = quantity;
  
          const result = await targetActor.createOwnedItem(newItemData);
          itemInTargetActor = targetActor.items.get(result._id);
        }
  
        return this.stashOrUnstash(event, targetActor, () => { return itemInTargetActor; });
    }

    async moveItemBetweenActors(event, sourceActorId, targetActorId, itemId) {
        const sourceActor = game.actors.get(sourceActorId);
        const targetActor = game.actors.get(targetActorId);
        const item = sourceActor.getOwnedItem(itemId);

        let isSameActor = sourceActorId === targetActorId;

        if (isSameActor) {
            //const oldContainerId = item.data.containerId;
            await this.stashOrUnstash(event, targetActor, () => { return item; });
            //if (oldContainerId === item.data.containerId) {
                // Nothing happened, allow for re-ordering:
                //return await super._onDrop(event);
            //}
            return this._onSortItem(event, item.data);
        } else {
            const sourceItemQuantity = item.data.data.quantity;

            // If more than one item can be moved, show a popup to ask how many to move
            /*if (sourceItemQuantity > 1)
            {
                const popup = new MoveLootPopup(sourceActor, {}, (quantity) => {
                    console.log(`Accepted moving ${quantity} items`);
                    await this.removeItemFromActor(sourceActor, item, quantity);
                    await this.addItemToActor(targetActor, item, quantity);
                });

                popup.render(true);
            }
            else
            {*/
                await this.removeItemFromActor(sourceActor, item, sourceItemQuantity);
                await this.addItemToActor(targetActor, item, sourceItemQuantity);
            //}
        }
    }

    acceptsItem(containerItem, itemToAdd, quantity) {
        if (!containerItem || !itemToAdd) {
            //console.log("Rejected because container or item is null");
            return false;
        }

        if (!["weapon", "equipment", "goods", "consumable", "container"].includes(itemToAdd.type)) {
            //console.log("Rejected because item is not an item: " + itemToAdd.type);
            return false;
        }

        const storageCapacity = containerItem.data.data.storageCapacity;
        if (!storageCapacity || storageCapacity === 0) {
            //console.log("Rejected because target storageCapacity is 0");
            return false;
        }

        const acceptedItemTypes = containerItem.data.data.acceptedItemTypes;
        if (acceptedItemTypes && !acceptedItemTypes.includes(itemToAdd.type)) {
            //console.log("Rejected because item is not accepted by container mask");
            return false;
        }

        /*let totalBulk = 0;
        let containedItems = this.actor.items.filter(x => x.data.containerId === containerItem._id);
        for (let childItem of containedItems) {
            let bulk = 0;
            if (childItem.data.bulk === "L") {
                bulk = 0.1;
            } else if (!Number.isNaN(childItem.data.bulk)) {
                bulk = childItem.data.bulk;
            }
            totalBulk += bulk * childItem.data.quantity;
        }

        let itemBulk = 0;
        if (itemToAdd.data.bulk === "L") {
            itemBulk = 0.1;
        } else if (!Number.isNaN(itemToAdd.data.bulk)) {
            itemBulk = itemToAdd.data.bulk;
        }

        if (totalBulk + itemBulk * quantity > containerItem.data.storageCapacity) {
            return false;
        }*/

        if (this.isCycle(itemToAdd._id, containerItem._id, this.actor.items)) {
            console.log("Rejected because adding this item would create a cycle");
            return false;
        }

        return true;
    }

    getTargetItemFromEvent(event) {
        const targetId = $(event.target).parents('.item').attr('data-item-id')
        const targetItem = this.actor.items.find(x => x._id === targetId);
        return targetItem;
    }
  
    async stashOrUnstash(event, actor, getItem) {
        const targetItem = this.getTargetItemFromEvent(event);

        const item = await getItem();
        if (targetItem && this.acceptsItem(targetItem, item)) {
            const targetItemId = targetItem._id;
            const result = await item.update({
                'data.containerId': targetItemId,
                'data.equipped.value': false,
            });
            
            return result;
        }

        const oldContainerId = item.data.data.containerId;
        const result = await item.update({'data.containerId': ''});

        if (oldContainerId) {
            const oldParent = this.actor.items.find(x => x._id === oldContainerId);
            await oldParent.update({});
        }

        return result;
    }

    /** Checks if assigning the containerId to the item would create a cycle */
    isCycle(itemId, containerId, items = []) {
        const idIndexedItems = new Map();
        for (const item of items) {
            idIndexedItems.set(item._id, item);
        }
        return this.detectCycle(itemId, containerId, idIndexedItems);
    }

    detectCycle(itemId, containerId, idIndexedItems) {
        if (idIndexedItems.has(containerId)) {
            const currentItem = idIndexedItems.get(containerId);
            if (itemId === currentItem._id) {
                return true;
            }
            return this.detectCycle(itemId, currentItem.data.containerId, idIndexedItems);
    
        }
        return false;
    }
}