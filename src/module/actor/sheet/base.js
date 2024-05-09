import { ActorSheetFlags } from "../../apps/actor-flags.js";
import { ActorMovementConfig } from "../../apps/movement-config.js";
import { TraitSelectorSFRPG } from "../../apps/trait-selector.js";
import { SFRPGModifierType } from "../../modifiers/types.js";
import StackModifiers from "../../rules/closures/stack-modifiers.js";

import { RPC } from "../../rpc.js";
import { ActorItemHelper, containsItems, getFirstAcceptableStorageIndex, moveItemBetweenActorsAsync } from "../actor-inventory-utils.js";

import { InputDialog } from "../../apps/input-dialog.js";
import { ItemDeletionDialog } from "../../apps/item-deletion-dialog.js";
import { SFRPG } from "../../config.js";
import { ItemSFRPG } from "../../item/item.js";

import { getEquipmentBrowser } from "../../packs/equipment-browser.js";
import { getSpellBrowser } from "../../packs/spell-browser.js";
import { getStarshipBrowser } from "../../packs/starship-browser.js";
import RollContext from "../../rolls/rollcontext.js";
/**
 * Extend the basic ActorSheet class to do all the SFRPG things!
 * This sheet is an Abstract layer which is not used.
 *
 * @type {ActorSheet}
 */
export class ActorSheetSFRPG extends ActorSheet {
    constructor(...args) {
        super(...args);

        this.acceptedItemTypes = [
            ...SFRPG.sharedItemTypes
        ];

        this._filters = {
            inventory: new Set(),
            spellbook: new Set(),
            features: new Set()
        };

        this._tooltips = null;
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
                {navSelector: ".subtabs", contentSelector: ".modifiers-body", initial: "permanent"},
                {navSelector: ".biotabs", contentSelector: ".bio-body", initial: "biography"}
            ]
        });
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    async getData() {
        const isOwner = this.document.isOwner;
        const data = {
            actor: this.actor,
            system: deepClone(this.actor.system),
            isOwner: isOwner,
            isGM: game.user.isGM,
            limited: this.document.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.document.type === "character",
            isShip: this.document.type === 'starship',
            isVehicle: this.document.type === 'vehicle',
            isDrone: this.document.type === 'drone',
            isNPC: this.document.type === 'npc' || this.document.type === 'npc2',
            isHazard: this.document.type === 'hazard',
            config: CONFIG.SFRPG
        };

        data.items = [...this.actor.items.values()];
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.labels = this.actor.labels || {};
        data.filters = this._filters;

        if (!data.system?.details?.biography?.fullBodyImage) {
            this.actor.system = mergeObject(this.actor.system, {
                details: {
                    biography: {
                        fullBodyImage: "systems/sfrpg/images/mystery-body.webp"
                    }
                }
            }, {overwrite: false});
            this.actor.system.details.biography.fullBodyImage = "systems/sfrpg/images/mystery-body.webp";
        }

        if (data.system.abilities) {
            // Ability Scores
            for (const [a, abl] of Object.entries(data.system.abilities)) {
                abl.label = CONFIG.SFRPG.abilities[a];
            }
        }

        // Calculate the expanded speed box height, only used for npc2 actors.
        if (this.actor.type === "npc2") {
            let numberOfMovementTypes = 0;
            if (data.system.attributes.speed.land.value > 0) {
                numberOfMovementTypes += 1;
            }
            if (data.system.attributes.speed.burrowing.value > 0) {
                numberOfMovementTypes += 1;
            }
            if (data.system.attributes.speed.climbing.value > 0) {
                numberOfMovementTypes += 1;
            }
            if (data.system.attributes.speed.flying.value > 0) {
                numberOfMovementTypes += 1;
            }
            if (data.system.attributes.speed.swimming.value > 0) {
                numberOfMovementTypes += 1;
            }
            if (data.system.attributes.speed.special) {
                numberOfMovementTypes += 1;
            }
            data.expandedSpeedBoxHeight = Math.max(36 + numberOfMovementTypes * 14, 70);
        }

        if (data.system.skills) {
            // Update skill labels
            for (const [s, skl] of Object.entries(data.system.skills)) {
                skl.ability = data.system.abilities[skl.ability].label.substring(0, 3);
                skl.icon = this._getClassSkillIcon(skl.value);

                let skillLabel = CONFIG.SFRPG.skills[s.substring(0, 3)];
                if (skl.subname) {
                    skillLabel += ` (${skl.subname})`;
                }

                skl.label = skillLabel;
                skl.hover = CONFIG.SFRPG.skillProficiencyLevels[skl.value];
            }

            data.system.skills = Object.keys(data.system.skills).sort()
                .reduce((skills, key) => {
                    skills[key] = data.system.skills[key];

                    return skills;
                }, {});

            data.system.hasSkills = Object.values(data.system.skills).filter(x => x.enabled).length > 0;
        }

        if (data.system.traits) {
            this._prepareTraits(data.system.traits);
        }

        if (data.system.details?.xp?.pct !== null && data.system.details?.xp?.pct !== undefined) {
            data.system.details.xp.color = Math.round(Math.max((data.system.details.xp.pct / 100), 0) * 255)
                .toString(16)
                .padStart(2, "0");
        }

        this._prepareItems(data);

        // Enrich text editors. The below are used for character, drone and npc(2). Other types use editors defined in their class.
        const secrets = this.actor.isOwner;
        data.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.details.biography.value, {
            async: true,
            rollData: this.actor.getRollData() ?? {},
            secrets
        });
        data.enrichedGMNotes = await TextEditor.enrichHTML(this.actor.system.details.biography.gmNotes, {
            async: true,
            rollData: this.actor.getRollData() ?? {},
            secrets
        });

        return data;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    async activateListeners(html) {
        super.activateListeners(html);

        html.find('[data-wpad]').each((i, e) => {
            const text = e.tagName === "INPUT" ? e.value : e.innerText,
                w = text.length * parseInt(e.getAttribute("data-wpad")) / 2;
            e.setAttribute("style", "flex: 0 0 " + w + "px;");
        });

        const filterLists = html.find(".filter-list");
        filterLists.each(this._initializeFilterItemList.bind(this));
        filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

        html.find('.item .item-name h4').click(async event => this._onItemSummary(event));
        html.find('.item .item-name h4').contextmenu(event => this._onItemSplit(event));

        // Open character art in image viewer
        html.find('a.hover-icon[data-action="show-image"]').click(this._onShowImage.bind(this));

        if (!this.options.editable) return;

        html.find('.config-button').click(this._onConfigMenu.bind(this));

        html.find('.toggle-container').click(this._onToggleContainer.bind(this));

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(this._onTraitSelector.bind(this));

        // Skill Compendium
        html.find('.compendium-link').click(this._onOpenSkillCompendium.bind(this));

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

        // Get New Item from Browser
        html.find('.item-browser').click(event => this._onOpenBrowser(event));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const itemId = $(ev.currentTarget).parents(".item")
                .attr("data-item-id");
            const item = this.actor.items.get(itemId);
            // const item = this.actor.getEmbeddedEntity("Item", itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => this._onItemDelete(ev));

        html.find("li.inventory-header").click(ev => this._onItemHeaderClick(ev));

        // Item Dragging
        const handler = ev => this._onDragStart(ev);
        html.find('li.item').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        // Item button dragging
        const itemUsageHandler = ev => this._onItemUsageDragStart(ev);
        html.find(':is(.featActivate, .featDeactivate, .damage, .healing, .attack, .use, .reload)').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", itemUsageHandler, false);
        });

        // Item Rolling
        html.find('.item .item-image').click(event => this._onItemRoll(event));

        // Roll attack from item
        html.find('.item-action .use').click(event => this._onItemRollUse(event));

        // Roll attack from item
        html.find('.item-action .attack').click(event => this._onItemRollAttack(event));

        // Roll damage for item
        html.find('.item-action .damage').click(event => this._onItemRollDamage(event));
        html.find('.item-action .healing').click(event => this._onItemRollDamage(event));

        // (De-)activate an item
        html.find('.item-detail .featActivate').click(event => this._onActivateFeat(event));
        html.find('.item-detail .featDeactivate').click(event => this._onDeactivateFeat(event));

        html.find('.limited-uses-value').change(event => this._onItemUsesUpdate(event));

        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));

        // Condition toggling
        html.find('.conditions input[type="checkbox"]').change(await this._onToggleConditions.bind(this));

        // Actor resource update
        html.find('.actor-resource-base-input').change(this._onActorResourceChanged.bind(this));

        // Effect Toggling
        html.find('.effect-toggle').on('click', this._onToggleEffect.bind(this));
    }

    /** @override */
    render(force, options) {
        if (this.stopRendering) {
            return this;
        }

        return super.render(force, options);
    }

    /** @override */
    _onChangeTab(event, tabs, active) {
        if (active === "modifiers") {
            this._tabs[1].activate("conditions");
        }

        super._onChangeTab();
    }

    _onConfigMenu(event) {
        event.preventDefault();
        const button = event.currentTarget;
        let app;
        switch ( button.dataset.action ) {
            case "movement":
                app = new ActorMovementConfig(this.object);
                break;
        }
        app?.render(true);
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

        for (const [t, choices] of Object.entries(map)) {
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
            trait.cssClass = !foundry.utils.isEmpty(trait.selected) ? "" : "inactive";
        }
    }

    _prepareActorResource(actorResourceItem, actorData) {
        if (actorResourceItem?.type !== "actorResource") {
            return;
        }

        actorResourceItem.attributes = [];
        actorResourceItem.actorResourceData = null;
        if (actorResourceItem.system.enabled && actorResourceItem.system.type && actorResourceItem.system.subType) {
            actorResourceItem.attributes.push(`@resources.${actorResourceItem.system.type}.${actorResourceItem.system.subType}.base`);
            actorResourceItem.attributes.push(`@resources.${actorResourceItem.system.type}.${actorResourceItem.system.subType}.value`);

            if (actorResourceItem.system.base || actorResourceItem.system.base === 0) {
                actorResourceItem.actorResourceData = actorData.resources[actorResourceItem.system.type][actorResourceItem.system.subType];
            }
        }
    }

    _prepareAttackString(item)  {
        try {
            const itemData = item.system;
            const actor = item.actor;
            const isWeapon = ["weapon", "shield"].includes(item.type);

            let abl = itemData.ability;
            if (!abl && (actor.type === "npc" || actor.type === "npc2")) abl = "";
            else if (!abl && (item.type === "spell")) abl = actor.system.attributes.spellcasting || "int";
            else if (itemData.properties?.operative && actor.system.abilities.dex.value > actor.system.abilities.str.value) abl = "dex";
            else if (!abl) abl = "str";

            // Define Roll parts
            const parts = [];

            if (Number.isNumeric(itemData.attackBonus) && itemData.attackBonus !== 0) parts.push("@item.attackBonus");
            if (abl) parts.push(`@abilities.${abl}.mod`);
            if (["character", "drone"].includes(actor.type)) parts.push("@attributes.baseAttackBonus.value");
            if (isWeapon) {
                const procifiencyKey = SFRPG.weaponTypeProficiency[item.system.weaponType];
                const proficient = itemData.proficient || actor?.system?.traits?.weaponProf?.value?.includes(procifiencyKey);
                if (!proficient) {
                    parts.push(`-4[${game.i18n.localize("SFRPG.Items.NotProficient")}]`);
                }
            }

            const formula = parts.join("+");

            let appropriateMods = item.getAppropriateAttackModifiers(isWeapon);
            // Remove situational modifiers
            appropriateMods = appropriateMods.filter(mod => mod.modifierType !== SFRPGModifierType.FORMULA);
            const stackModifiers = new StackModifiers();
            let modifiers = stackModifiers.process(appropriateMods, null, {actor: actor});

            modifiers = Object.values(modifiers)
                .flat()
                .filter(i => !!i);
            const modifiersTotal = modifiers.reduce((total, i) => total + i.max, 0);

            const preparedFormula = `${formula} + ${modifiersTotal}`;

            const rollData = RollContext.createItemRollContext(item, item.actor).getRollData();

            const roll = Roll.create(preparedFormula, rollData).simplifiedFormula;
            item.config.attackString = Number(roll) >= 0 ? `+${roll}` : roll;

        } catch {
            item.config.attackString = game.i18n.localize("SFRPG.Attack");
        }
    }

    /**
     * Take the items's first damage part,  add all applicable damage modifiers, and create a pretty formula, for display on the damage button
     * @param {ItemSFRPG} item
     */
    _prepareDamageString(item) {
        try {
            const isWeapon = ["weapon", "shield"].includes(item.type);
            const formula = item.system.damage.parts[0].formula;
            if (!formula) throw ("No damage formula, deferring to default string");

            let appropriateMods = item.getAppropriateDamageModifiers(isWeapon);
            // Remove situational modifiers
            appropriateMods = appropriateMods.filter(mod => mod.modifierType !== SFRPGModifierType.FORMULA);
            const stackModifiers = new StackModifiers();
            let modifiers = stackModifiers.process(appropriateMods, null, {actor: item.actor});

            modifiers = Object.values(modifiers)
                .flat()
                .filter(i => !!i);
            const modifiersTotal = modifiers.reduce((total, i) => total + i.max, 0);

            const preparedFormula = `${formula} + ${modifiersTotal}`;

            const rollData = RollContext.createItemRollContext(item, item.actor).getRollData();

            const roll = Roll.create(preparedFormula, rollData).simplifiedFormula;
            if (!roll) throw ("Invalid roll, deferring to default string.");

            const damageTypes = Object.entries(item.system.damage.parts[0].types)
                .map(([type, enabled]) => {
                    if (enabled) return SFRPG.damageTypeToAcronym[type];
                })
                .filterJoin(" & ");

            item.config.damageString = `${roll} ${damageTypes}`;
        } catch {
            item.config.damageString = item.system.actionType === "heal"
                ? game.i18n.localize("SFRPG.ActionHeal")
                : game.i18n.localize("SFRPG.Damage.Title");
        }
    }

    /**
    * Add a modifer to this actor.
    *
    * @param {Event} event The originating click event
    */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        this.actor.addModifier({
            name: "New Modifier",
            subtab: target.data('subtab')
        });
    }

    /**
    * Delete a modifier from the actor.
    *
    * @param {Event} event The originating click event
    */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        await this.actor.deleteModifier(modifierId);
    }

    /**
    * Edit a modifier for an actor.
    *
    * @param {Event} event The orginating click event
    */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.actor.editModifier(modifierId);
    }

    /**
    * Toggle a modifier to be enabled or disabled.
    *
    * @param {Event} event The originating click event
    */
    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        const modifiers = duplicate(this.actor.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);

        const formula = modifier.modifier;
        if (formula) {
            const roll = Roll.create(formula, this.actor.system);
            modifier.max = await roll.evaluate({maximize: true}).total;
        } else {
            modifier.max = 0;
        }

        modifier.enabled = !modifier.enabled;

        await this.actor.update({'system.modifiers': modifiers});
    }

    /**
     * Toggle an effect and their modifiers to be enabled or disabled.
     *
     * @param {Event} event The originating click event
     */
    async _onToggleEffect(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const effectUuid = target.closest('.item.effect').data('effectUuid');

        this.actor.system.timedEffects.get(effectUuid)?.toggle();
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

        const idx = levels.indexOf(level);

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
        const skillId = event.currentTarget.parentElement.dataset.skill;

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
        event.stopPropagation();
        const header = event.currentTarget;
        const type = header.dataset.type;
        if (!type || type.includes(",")) {
            const types = duplicate(SFRPG.itemTypes);
            if (type) {
                const supportedTypes = type.split(',');
                for (const key of Object.keys(types)) {
                    if (!supportedTypes.includes(key)) {
                        delete types[key];
                    }
                }
            }

            const createData = {
                name: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name"),
                type: type
            };

            const templateData = {upper: "Item", lower: "item", types: types},
                dlg = await renderTemplate(`systems/sfrpg/templates/apps/localized-entity-create.hbs`, templateData);

            new Dialog({
                title: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Title"),
                content: dlg,
                buttons: {
                    create: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Button"),
                        callback: html => {
                            const form = html[0].querySelector("form");
                            const formDataExtended = new FormDataExtended(form);
                            mergeObject(createData, formDataExtended.toObject());
                            if (!createData.name) {
                                createData.name = game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name");
                            }

                            this.onBeforeCreateNewItem(createData);

                            this.actor.createEmbeddedDocuments("Item", [createData]);
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
            system: duplicate(header.dataset)
        };
        delete itemData.system['type'];

        this.onBeforeCreateNewItem(itemData);

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    onBeforeCreateNewItem(itemData) {

    }

    async _onShowImage(event) {
        const actor = this.actor;
        const title = actor.token?.name ?? actor.prototypeToken?.name ?? actor.name;
        new ImagePopout(actor.img, { title, uuid: actor.uuid }).render(true);
    }

    /**
     * open and prefilter a compendium browser depending on it's environment.
     * @param {Event} event The originating click event
     */
    async _onOpenBrowser(event) {
        event.preventDefault();
        const data = event.currentTarget.dataset;
        let browser;

        switch (data.type) {
            case 'weapon':
            case 'shield':
            case 'equipment':
            case 'ammunition':
            case 'consumable':
            case 'goods':
            case 'container':
            case 'technological,magic,hybrid':
            case 'fusion,upgrade,weaponAccessory':
            case 'augmentation':
                browser = getEquipmentBrowser();
                browser.renderWithFilters({equipmentTypes: data.type.split(',')});
                break;
            case 'spell':
                browser = getSpellBrowser();
                browser.renderWithFilters({
                    levels: [data.level],
                    classes: data.classes.split(',').filter(i => !!i)
                });
                break;
            case 'class':
            case 'race':
            case 'theme':
            case 'asi':
            case 'archetypes':
            case 'feat':
            case 'actorResource':
            // TODO: wait for Features Browser then implement this.
                break;
            case 'starshipWeapon':
                browser = getStarshipBrowser();
                browser.renderWithFilters({
                    starshipComponentTypes: data.type
                });
                break;
            default:
                browser = getEquipmentBrowser();
                break;
        }
    }

    /**
     * Handle deleting an Owned Item for the actor
     * @param {Event} event The originating click event
     */
    async _onItemDelete(event) {
        event.preventDefault();

        const li = $(event.currentTarget).parents(".item"),
            itemId = li.attr("data-item-id");

        const actorHelper = new ActorItemHelper(this.actor.id, this.token ? this.token.id : null, this.token ? this.token.parent.id : null, { actor: this.actor });
        const item = actorHelper.getItem(itemId);

        if (event.shiftKey) {
            actorHelper.deleteItem(itemId, true).then(() => {
                li.slideUp(200, () => this.render(false));
            });
        } else {
            const containsItems = (item.system.container?.contents && item.system.container.contents.length > 0);
            ItemDeletionDialog.show(item.name, containsItems, (recursive) => {
                actorHelper.deleteItem(itemId, recursive).then(() => {
                    li.slideUp(200, () => this.render(false));
                });
            });
        }
    }

    _onItemRollUse(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollConsumable({event: event});
    }

    _onItemRollAttack(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollAttack({event: event});
    }

    _onItemRollDamage(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollDamage({event: event});
    }

    async _onActivateFeat(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.setActive(true);
    }

    async _onDeactivateFeat(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.setActive(false);
    }

    async _onItemUsesUpdate(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.update({"system.uses.value": Number(event.currentTarget.value)});
    }

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    _onItemRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.type === "spell") {
            return this.actor.useSpell(item, {configureDialog: !event.shiftKey});
        } else {
            return item.roll();
        }
    }

    /**
     * Handle attempting to recharge an item usage by rolling a recharge check
     * @param {Event} event The originating click event
     */
    _ontItemRecharge(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        return item.rollRecharge();
    }

    /**
     * Handle toggling the equipped state of an item.
     * @param {Event} event The originating click event
     */
    _onItemEquippedChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.update({
            ["system.equipped"]: !item.system.equipped
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
        const conditionName = target.data('condition');
        const enabled = target[0].checked;

        await this.actor.setCondition(conditionName, enabled);

        return enabled;
    }

    _onActorResourceChanged(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const resourceId = target.data('resourceId');
        const resourceItem = this.actor.items.get(resourceId);
        const newBaseValue = parseInt(target[0].value);

        if (!Number.isNaN(newBaseValue)) {
            resourceItem.update({"system.base": newBaseValue});
        } else {
            resourceItem.update({"system.base": 0});
        }
    }

    /**
     * Handle Compendium Link Click
     * @param {Event} event   The originating click event
     */
    async _onOpenSkillCompendium(event) {
        event.preventDefault();
        const uuid = CONFIG.SFRPG.skillCompendium[event.currentTarget.dataset.skillId];
        const document = await fromUuid(uuid);

        // Open document
        if (document instanceof JournalEntryPage) {
            document.parent.sheet.render(true, { pageId: document.id });
        } else {
            document.sheet.render(true);
        }
    }

    /**
     * Handle clicking inventory/features headers, allowing them to minimize
     * @param {Event} event
     */
    async _onItemHeaderClick(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        const items = target.next("ol.item-list");

        if (!target.hasClass("collapsed")) {
            items.slideUp(200, () => items.css("display", "none"));
        } else {
            items.slideDown(200, () => items.css("display", ""));
        }
        target.toggleClass('collapsed');
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
        const ability = event.currentTarget.parentElement.dataset.ability;
        this.actor.rollAbility(ability, {event: event});
    }

    /**
     * Handles reloading / replacing ammo or batteries in a weapon.
     *
     * @param {Event} event The originating click event
     */
    async _onReloadWeapon(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.reload();
    }

    /**
     * Handles toggling the open/close state of a container.
     *
     * @param {Event} event The originating click event
     */
    _onToggleContainer(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        const isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;

        return item.update({'system.container.isOpen': !isOpen});
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
    async _onItemSummary(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents('.item');
        const item = this.actor.items.get(li.data('item-id'));
        const chatData = await item.getChatData();

        if (li.hasClass('expanded')) {
            const summary = li.children('.item-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            const desiredDescription = chatData.description.short || chatData.description.value;
            const div = $(`<div class="item-summary">${desiredDescription}</div>`);
            Hooks.callAll("renderItemSummary", this, div, {}); // Event listeners need to be added to this HTML.

            const props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => {
                let tooltipValue = p.tooltip || p.title || "";
                if (tooltipValue) tooltipValue = `data-tooltip="${tooltipValue}"`;
                props.append(
                    `<span class="tag" ${tooltipValue}><strong>${p.title ? p.title + ":" : ""} </strong>${p.name}</span>`
                );
            }
            );

            div.append(props);
            li.append(div.hide());

            div.slideDown(200, function() { /* noop */ });
        }
        li.toggleClass('expanded');

    }

    async _onItemSplit(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents('.item'),
            item = this.actor.items.get(li.data('item-id'));

        const itemQuantity = item.system.quantity;
        if (!itemQuantity || itemQuantity <= 1) {
            return;
        }

        if (containsItems(item)) {
            return;
        }

        const bigStack = Math.ceil(itemQuantity / 2.0);
        const smallStack = Math.floor(itemQuantity / 2.0);

        const actorHelper = new ActorItemHelper(this.actor.id, this.token ? this.token.id : null, this.token ? this.token.parent.id : null, { actor: this.actor });

        const update = { "quantity": bigStack };
        await actorHelper.updateItem(item.id, update);

        const itemData = duplicate(item);
        itemData.id = null;
        itemData.system.quantity = smallStack;
        itemData.effects = [];
        await actorHelper.createItem(itemData);
    }

    _prepareSpellbook(data, spells) {
        const actorData = this.actor.system;

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

        const spellbookReduced = spells.reduce((spellBook, spell) => {
            const spellData = spell.system;

            const mode = spellData.preparation.mode || "";
            const lvl = levels[mode] || spellData.level || 0;
            const spellsPerDay = actorData.spells["spell" + lvl];

            if (!spellBook[lvl]) {
                spellBook[lvl] = {
                    level: lvl,
                    usesSlots: lvl > 0,
                    canCreate: this.actor.isOwner,
                    canPrepare: (this.actor.type === 'character') && (lvl > 0),
                    label: lvl >= 0 ? CONFIG.SFRPG.spellLevels[lvl] : CONFIG.SFRPG.spellPreparationModes[mode],
                    spells: [],
                    uses: useLabels[lvl] || spellsPerDay.value || 0,
                    slots: useLabels[lvl] || spellsPerDay.max || 0,
                    dataset: {"type": "spell", "level": lvl}
                };

                if (actorData.spells.classes && actorData.spells.classes.length > 0) {
                    spellBook[lvl].classes = [];
                    if (spellsPerDay?.perClass) {
                        for (const [classKey, storedData] of Object.entries(spellsPerDay.perClass)) {
                            const classInfo = actorData.spells.classes.find(x => x.key === classKey);
                            if (storedData.max > 0) {
                                spellBook[lvl].classes.push({key: classKey, name: classInfo?.name || classKey, value: storedData.value || 0, max: storedData.max});
                            }
                        }
                    }
                }
            }

            spellBook[lvl].spells.push(spell);
            return spellBook;
        }, {});

        const spellbookValues = Object.values(spellbookReduced);
        spellbookValues.sort((a, b) => a.level - b.level);

        return spellbookValues;
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
        for (const li of filters) {
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
            const data = item.system;

            // Action usage
            for (const f of ["action", "move", "swift", "full", "reaction"]) {
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

    _onLevelUp(event) {
        event.preventDefault();
        this.actor.levelUp(event.currentTarget.dataset.actorClassId);
    }

    async _onDrop(event) {
        event.preventDefault();

        const parsedDragData = TextEditor.getDragEventData(event);
        if (!parsedDragData) {
            console.log("Unknown item data");
            return;
        }

        return this.processDroppedData(event, parsedDragData);
    }

    async processDroppedData(event, parsedDragData) {
        const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id, { actor: this.actor });
        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }

        let item = null;
        if (parsedDragData.type !== 'ItemCollection') item = (await Item.fromDropData(parsedDragData)).toObject();
        else item = parsedDragData.items[0].toObject?.();

        // Level up existing class item if dragging on an existing one.
        if (item.type === "class") {
            const existingClass = targetActor.findItem(x => x.type === "class" && x.name === item.name);
            if (existingClass) {
                const levelUpdate = {};
                levelUpdate["system.levels"] = existingClass.system.levels + 1;
                existingClass.update(levelUpdate);
                return existingClass;
            }
        }

        if (!this.acceptedItemTypes.includes(item.type)) {
            // Reject item
            ui.notifications.error(game.i18n.format("SFRPG.InvalidItem", { name: SFRPG.itemTypes[item.type], target: SFRPG.actorTypes[this.actor.type] }));
            return;
        }

        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item')
                .attr('data-item-id');
            targetContainer = targetActor.getItem(targetId);
        }

        // Handle ItemCollections
        if (parsedDragData.type === "ItemCollection") {
            const msg = {
                target: targetActor.toObject(),
                source: {
                    actorId: null,
                    tokenId: parsedDragData.tokenId,
                    sceneId: parsedDragData.sceneId
                },
                draggedItems: parsedDragData.items,
                containerId: targetContainer ? targetContainer.id : null
            };

            const messageResult = RPC.sendMessageTo("gm", "dragItemFromCollectionToPlayer", msg);
            if (messageResult === "errorRecipientNotAvailable") {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.ItemCollectionPickupNoGMError"));
            }
            return;

        // Handle trading between actors
        } else if (parsedDragData.uuid.includes("Actor")) {
            const actor = fromUuidSync(parsedDragData.uuid)?.actor || await fromUuid(parsedDragData.uuid)?.actor;

            const tokenId = actor.isToken ? actor.token.id : null;
            const sceneId = actor.isToken ? actor.token.parent.id : null;
            const sourceActor = new ActorItemHelper(actor.id, tokenId, sceneId);
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = sourceActor.getItem(item._id);

            if (event.shiftKey) {
                InputDialog.show(
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferTitle"),
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferMessage"), {
                        amount: {
                            name: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferLabel"),
                            label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferInfo", { max: itemToMove.system.quantity }),
                            placeholder: itemToMove.system.quantity,
                            validator: (v) => {
                                const number = Number(v);
                                if (Number.isNaN(number)) {
                                    return false;
                                }

                                if (number < 1) {
                                    return false;
                                }

                                if (number > itemToMove.system.quantity) {
                                    return false;
                                }
                                return true;
                            }
                        }
                    }, (values) => {
                        const itemInTargetActor = moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer, values.amount);
                        if (itemInTargetActor === itemToMove) {
                            this._onSortItem(event, itemInTargetActor);
                        }
                    });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor);
                }
            }

        // Continue regular workflow
        } else {

            if (item.system.modifiers) {
                const modifiers = item.system.modifiers;

                for (const modifier of modifiers) {

                    const formula = modifier.modifier;
                    if (formula) {
                        try {
                            const roll = Roll.create(formula, targetActor.actor.system);
                            modifier.max = await roll.evaluate({maximize: true}).total;
                        } catch {
                            modifier.max = 0;
                        }
                    } else {
                        modifier.max = 0;
                    }
                }
            }

            if (item.type === "spell" && game.settings.get('sfrpg', 'scalingCantrips')) {
                ItemSFRPG._onScalingCantripDrop(item, targetActor);
            }

            if (item.type === "effect") {
                // Initialise origin data for effects
                const { context } = parsedDragData;
                if (context) {
                    item.system.context = context;
                }
            }

            const addedItemResult = await targetActor.createItem(item);
            if (addedItemResult.length > 0) {
                const addedItem = targetActor.getItem(addedItemResult[0].id);

                if (targetContainer) {
                    let newContents = [];
                    if (targetContainer.system.container?.contents) {
                        newContents = duplicate(targetContainer.system.container?.contents || []);
                    }

                    const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                    newContents.push({ id: addedItem.id, index: preferredStorageIndex });

                    const update = { id: targetContainer.id, "system.container.contents": newContents };
                    await targetActor.updateItem(targetContainer.id, update);
                }

                return addedItem;
            } else {
                return null;
            }

        }

    }

    /**
     * Allow item action buttons to be draggable, for the use of creating item macros
     * @param {Event} ev
     */
    _onItemUsageDragStart(ev) {
        ev.stopPropagation();
        const el = ev.currentTarget;
        const item = this.actor.items.get(el.closest("li.item").dataset.itemId);
        const dragData = item.toDragData();
        dragData.macroType = Array.from(el.classList)[1];

        // Set data transfer
        ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    processItemContainment(items, pushItemFn) {
        const preprocessedItems = [];
        const containedItems = [];
        for (const item of items) {
            const itemData = {
                item: item,
                parent: items.find(x => x.system.container?.contents && x.system.container.contents.find(y => y.id === item._id)),
                contents: []
            };
            preprocessedItems.push(itemData);

            if (!itemData.parent) {
                pushItemFn(item.type, itemData);
            } else {
                containedItems.push(itemData);
            }
        }

        for (const item of containedItems) {
            const parent = preprocessedItems.find(x => x.item._id === item.parent._id);
            if (parent) {
                parent.contents.push(item);
            }
        }
    }
}
