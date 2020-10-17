import { TraitSelectorSFRPG } from "../../apps/trait-selector.js";
import { ActorSheetFlags } from "../../apps/actor-flags.js";
import { getSpellBrowser } from "../../packs/spell-browser.js";

import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "../actor-inventory.js";
import { RPC } from "../../rpc.js"

import { ItemDeletionDialog } from "../../apps/item-deletion-dialog.js"
import { InputDialog } from "../../apps/input-dialog.js"
import { SFRPG } from "../../config.js";

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
            isNPC: this.entity.data.type === 'npc',
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
        html.find('.item .item-name h4').contextmenu(event => this._onItemSplit(event));

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
        html.find('.spell-browse').click(ev => getSpellBrowser().render(true)); // Inventory Browser

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
        html.find('.item-delete').click(ev => this._onItemDelete(ev));

        // Item Dragging
        let handler = ev => this._onDragStart(ev);
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
        html.find('.item-action .healing').click(event => this._onItemRollDamage(event));

        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));

        // Condition toggling
        html.find('.conditions input[type="checkbox"]').change(this._onToggleConditions.bind(this));
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
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        let type = header.dataset.type;
        if (!type || type.includes(",")) {
            let types = duplicate(SFRPG.itemTypes);
            if (type) {
                let supportedTypes = type.split(',');
                for (let key of Object.keys(types)) {
                    if (!supportedTypes.includes(key)) {
                        delete types[key];
                    }
                }
            }

            let createData = {
                name: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name"),
                type: type
            };

            let templateData = {upper: "Item", lower: "item", types: types},
            dlg = await renderTemplate(`systems/sfrpg/templates/apps/localized-entity-create.html`, templateData);

            new Dialog({
                title: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Title"),
                content: dlg,
                buttons: {
                    create: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Button"),
                        callback: html => {
                            const form = html[0].querySelector("form");
                            let formDataExtended = new FormDataExtended(form);
                            mergeObject(createData, formDataExtended.toObject());
                            if (!createData.name) {
                                createData.name = game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name");
                            }

                            this.onBeforeCreateNewItem(createData);

                            this.actor.createOwnedItem(createData);
                        }
                    }
                },
                default: "create"
            }).render(true);
            return null;
        }

        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: duplicate(header.dataset)
        };
        delete itemData.data['type'];

        this.onBeforeCreateNewItem(itemData);

        return this.actor.createOwnedItem(itemData);
    }

    onBeforeCreateNewItem(itemData) {

    }

    /**
     * Handle deleting an Owned Item for the actor
     * @param {Event} event The originating click event
     */
    async _onItemDelete(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents(".item"), 
            itemId = li.attr("data-item-id");

        let actorHelper = new ActorItemHelper(this.actor._id, this.token ? this.token.id : null, this.token ? this.token.scene.id : null);
        let item = actorHelper.getOwnedItem(itemId);

        let containsItems = (item.data.data.container?.contents && item.data.data.container.contents.length > 0);
        ItemDeletionDialog.show(item.name, containsItems, (recursive) => {
            actorHelper.deleteOwnedItem(itemId, recursive);
            li.slideUp(200, () => this.render(false));
        });
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
     * Toggles condition modifiers on or off.
     * 
     * @param {Event} event The triggering event.
     */
    async _onToggleConditions(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const condition = target.data('condition');
        const active = target[0].checked;

        if (active) {
            // Try find existing condition, add from compendium if not found
            let conditionItem = this.actor.items.find(x => x.type === "feat" && x.data.data.requirements?.toLowerCase() === "condition" && x.name.toLowerCase() === condition.toLowerCase());
            if (!conditionItem) {
                let compendium = game.packs.find(element => element.title.includes("Conditions"));
                if (compendium) {
                    // Let the compendium load
                    await compendium.getIndex();

                    let entry = compendium.index.find(e => e.name.toLowerCase() === condition.toLowerCase());
                    if (entry) {
                        let entity = await compendium.getEntity(entry._id);
                        await this.actor.createOwnedItem(entity);
                    }
                }
            }
        } else {
            // Try find existing condition, remove if possible
            let conditionItem = this.actor.items.find(x => x.type === "feat" && x.data.data.requirements?.toLowerCase() === "condition" && x.name.toLowerCase() === condition.toLowerCase());
            if (conditionItem) {
                await this.actor.deleteOwnedItem(conditionItem._id);
            }
        }

        if (["blinded", "cowering", "offkilter", "pinned", "stunned"].includes(condition)) {
            const flatfooted = $('.condition.flatfooted');
            const ffIsChecked = flatfooted.is(':checked');
            flatfooted.prop("checked", !ffIsChecked).change();
        }
        
        const tokens = this.actor.getActiveTokens(true);
        for (const token of tokens) {
            await token.toggleEffect(CONFIG.SFRPG.statusEffectIconMapping[condition]);
        }
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
     * Handles reloading / replacing ammo or batteries in a weapon.
     * 
     * @param {Event} event The originating click event
     */
    _onReloadWeapon(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.update({'data.capacity.value': item.data.data.capacity.max});
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

    async _onItemSplit(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents('.item'),
            item = this.actor.getOwnedItem(li.data('item-id'));

        let itemQuantity = item.data.data.quantity;
        if (!itemQuantity || itemQuantity <= 1) {
            return;
        }

        if (containsItems(item)) {
            return;
        }

        let bigStack = Math.ceil(itemQuantity / 2.0);
        let smallStack = Math.floor(itemQuantity / 2.0);

        let actorHelper = new ActorItemHelper(this.actor._id, this.token ? this.token.id : null, this.token ? this.token.scene.id : null);

        let update = { _id: item._id, "data.quantity": bigStack };
        await actorHelper.updateOwnedItem(update);

        let itemData = duplicate(item.data);
        itemData._id = null;
        itemData.data.quantity = smallStack;
        await actorHelper.createOwnedItem(itemData);
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

    async _onDrop(event) {
        event.preventDefault();

        const dragData = event.dataTransfer.getData('text/plain');
        const parsedDragData = JSON.parse(dragData);
        if (!parsedDragData) {
            console.log("Unknown item data");
            return;
        }

        const targetActor = new ActorItemHelper(this.actor._id, this.token ? this.token.id : null, this.token ? this.token.scene.id : null);
        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.info(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }

        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item').attr('data-item-id')
            targetContainer = await targetActor.getOwnedItem(targetId);
        }
        
        if (parsedDragData.type === "ItemCollection") {
            const msg = {
                target: targetActor.toObject(),
                source: {
                    actorId: null,
                    tokenId: parsedDragData.tokenId,
                    sceneId: parsedDragData.sceneId
                },
                draggedItems: parsedDragData.items,
                containerId: targetContainer ? targetContainer._id : null
            }

            RPC.sendMessageTo("gm", "dragItemFromCollectionToPlayer", msg);
            return;
        } else if (parsedDragData.pack) {
            const pack = game.packs.get(parsedDragData.pack);
            const itemData = await pack.getEntry(parsedDragData.id);

            const addedItem = await targetActor.createOwnedItem(itemData);

            if (!(addedItem.type in SFRPG.containableTypes)) {
                targetContainer = null;
            }
            
            const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
            if (itemInTargetActor === addedItem) {
                return await this._onSortItem(event, itemInTargetActor.data);
            }

            return itemInTargetActor;
        } else if (parsedDragData.data) {
            let sourceActor = new ActorItemHelper(parsedDragData.actorId, parsedDragData.tokenId, null);
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.info(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = await sourceActor.getOwnedItem(parsedDragData.data._id);

            if (event.shiftKey) {
                InputDialog.show(
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferTitle"),
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferMessage"), {
                    amount: {
                        name: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferLabel"),
                        label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferInfo", { max: itemToMove.data.data.quantity }),
                        placeholder: itemToMove.data.data.quantity,
                        validator: (v) => {
                            let number = Number(v);
                            if (Number.isNaN(number)) {
                                return false;
                            }

                            if (number < 1) {
                                return false;
                            }

                            if (number > itemToMove.data.data.quantity) {
                                return false;
                            }
                            return true;
                        }
                    }
                }, (values) => {
                    const itemInTargetActor = moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer, values.amount);
                    if (itemInTargetActor === itemToMove) {
                        this._onSortItem(event, itemInTargetActor.data);
                    }
                });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor.data);
                }
            }
        } else {
            let sidebarItem = game.items.get(parsedDragData.id);
            if (sidebarItem) {
                const addedItem = await targetActor.createOwnedItem(duplicate(sidebarItem.data));
                
                if (targetContainer) {
                    let newContents = [];
                    if (targetContainer.data.data.container?.contents) {
                        newContents = duplicate(targetContainer.data.data.container?.contents || []);
                    }
                    let preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                    newContents.push({id: addedItem._id, index: preferredStorageIndex});
                    let update = { _id: targetContainer._id, "data.container.contents": newContents };
                    await targetActor.updateOwnedItem(update);
                }

                return addedItem;
            }
            
            console.log("Unknown item source: " + JSON.stringify(parsedDragData));
        }
    }

    processItemContainment(items, pushItemFn) {
        let preprocessedItems = [];
        let containedItems = [];
        for (let item of items) {
            let itemData = {
                item: item,
                parent: items.find(x => x.data.container?.contents && x.data.container.contents.find(y => y.id === item._id)),
                contents: []
            };
            preprocessedItems.push(itemData);

            if (!itemData.parent) {
                pushItemFn(item.type, itemData);
            } else {
                containedItems.push(itemData);
            }
        }

        for (let item of containedItems) {
            let parent = preprocessedItems.find(x => x.item._id === item.parent._id);
            if (parent) {
                parent.contents.push(item);
            }
        }
    }
}