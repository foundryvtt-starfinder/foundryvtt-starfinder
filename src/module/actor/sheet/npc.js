import { ActorSheetSFRPG } from "./base.js";
import { SFRPG } from "../../config.js";

/**
 * An Actor sheet for NPC type characters in the SFRPG system.
 * 
 * Extends the base ActorSheetSFRPG class.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGNPC extends ActorSheetSFRPG {
    constructor(...args) {
        super(...args);

        this.acceptedItemTypes.push(...SFRPG.characterDefinitionItemTypes);
        this.acceptedItemTypes.push(...SFRPG.physicalItemTypes);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['sfrpg', 'actor', 'sheet', 'npc']),
            width: 720,
            height: 765
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        if (this.actor.data.type === "npc") {
            return path + "npc-sheet.html";
        } else {
            return path + "npc2-sheet.html";
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        
        html.find('.reload').click(this._onReloadWeapon.bind(this));
        html.find('#add-skills').click(this._toggleSkills.bind(this));
        html.find('#duplicate-new-style-npc').click(this._duplicateAsNewStyleNPC.bind(this));

        if (this.actor.type === "npc2") {
            html.find('.modifier-create').on('click', this._onModifierCreate.bind(this));
            html.find('.modifier-edit').on('click', this._onModifierEdit.bind(this));
            html.find('.modifier-delete').on('click', this._onModifierDelete.bind(this));
            html.find('.modifier-toggle').on('click', this._onToggleModifierEnabled.bind(this));
        }
    }

    getData() {
        const data = super.getData();

        let cr = parseFloat(data.data.details.cr || 0);
        let crs = { 0: "0", 0.125: "1/8", [1/6]: "1/6", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["cr"] = cr >= 1 ? String(cr) : crs[cr] || 1;

        return data;
    }

    /**
     * Toggle the visibility of skills on the NPC sheet.
     * 
     * @param {Event} event The originating click event
     */
    _toggleSkills(event) {
        event.preventDefault();
        
        this.actor.toggleNpcSkills();
    }

    _prepareItems(data) {
        const actorData = data.data;
        const droneItemTypes = ["chassis", "mod"];

        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.NPCSheet.Inventory.Inventory"), items: [], dataset: { type: "augmentation,consumable,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon,weaponAccessory" }, allowAdd: true }
        };
        const features = {
            weapons: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Attacks"), items: [], hasActions: true, dataset: { type: "weapon,shield", "weapon-type": "natural" }, allowAdd: true },
            actions: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Actions"), items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" }, allowAdd: true },
            passive: { label: game.i18n.localize("SFRPG.NPCSheet.Features.Features"), items: [], dataset: { type: "feat" }, allowAdd: true },
            activeItems: { label: game.i18n.localize("SFRPG.NPCSheet.Features.ActiveItems"), items: [], dataset: { }, allowAdd: false },
            resources: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"), items: [], hasActions: false, dataset: { type: "actorResource" } }
        };

        //   0       1      2               3           4
        let [spells, other, conditionItems, droneItems, actorResources] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.system.quantity ? item.system.quantity > 1 : false;
            item.isOnCooldown = item.system.recharge && !!item.system.recharge.value && (item.system.recharge.charged === false);
            item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.system.actionType) && (!["weapon", "shield"].includes(item.type) || item.system.equipped);
            item.hasDamage = item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped);
            item.hasUses = item.document.canBeUsed();
            item.isCharged = !item.hasUses || item.document.getRemainingUses() <= 0 || !item.isOnCooldown;

            item.hasCapacity = item.document.hasCapacity();
            if (item.hasCapacity) {
                item.capacityCurrent = item.document.getCurrentCapacity();
                item.capacityMaximum = item.document.getMaxCapacity();
            }

            if (item.type === "actorResource") {
                this._prepareActorResource(item, actorData);
            }

            if (droneItemTypes.includes(item.type)) {
                arr[3].push(item); // droneItems
            } else if (item.type === "spell") {
                const container = data.items.find(x => x.sysetm.container?.contents?.find(x => x.id === item._id) || false);
                if (!container) {
                    arr[0].push(item); // spells
                } else {
                    arr[1].push(item); // other
                }
            } else if (item.type === "feat") {
                if ((item.system.requirements?.toLowerCase() || "") === "condition") {
                    arr[2].push(item); // conditionItems
                } else {
                    arr[1].push(item); // other
                }
                item.isFeat = true;
            }
            else if (item.type === "actorResource") arr[4].push(item); // actorResources
            else arr[1].push(item); // other
            return arr;
        }, [[], [], [], [], []]);

        // Apply item filters
        spells = this._filterItems(spells, this._filters.spellbook);
        other = this._filterItems(other, this._filters.features);

        // Organize Spellbook
        const spellbook = this._prepareSpellbook(data, spells);

        // Organize Features
        const itemsToProcess = [];
        for (const item of other) {
            const container = this.actor.items.contents.find(x => x.system.container?.contents?.find(y => y.id === item._id) !== undefined);

            if (["weapon", "shield"].includes(item.type)) {
                item.isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;
                if (!item.system.containerId && !container) {
                    features.weapons.items.push(item);
                }
                itemsToProcess.push(item);
            }
            else if (item.type === "feat") {
                if (item.system.activation.type) features.actions.items.push(item);
                else features.passive.items.push(item);
            }
            else if (["consumable", "technological"].includes(item.type)) {
                item.isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;
                if (!item.system.containerId) {
                    features.activeItems.items.push(item);
                }
                itemsToProcess.push(item);
            } else if (["archetypes", "class", "race", "theme"].includes(item.type)) {
                if (!(item.type in features)) {
                    let label = "SFRPG.Items.Categories.MiscellaneousItems";
                    if (item.type in SFRPG.itemTypes) {
                        label = SFRPG.itemTypes[item.type];
                    }
                    features[item.type] = { label: game.i18n.format(label), items: [], dataset: { }, allowAdd: false };
                }
                features[item.type].items.push(item);
            } else if (item.type in SFRPG.itemTypes) {
                item.isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;
                itemsToProcess.push(item);
            }
        }

        features.resources.items = actorResources;

        this.processItemContainment(itemsToProcess, function (itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });

        if (droneItems.length > 0) {
            features.drone = { label: game.i18n.localize("SFRPG.NPCSheet.Features.Drone"), items: droneItems, dataset: { type: droneItemTypes.join(',') }, allowAdd: true };
        }

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions" }, isConditions: true, items: conditionItems }
        };

        if (this.actor.type === "npc2") {
            let [permanent, temporary, itemModifiers, conditions, misc] = actorData.modifiers.reduce((arr, modifier) => {
                if (modifier.subtab === "permanent") arr[0].push(modifier);
                else if (modifier.subtab === "conditions") arr[3].push(modifier);
                else arr[1].push(modifier); // Any unspecific categories go into temporary.
    
                return arr;
            }, [[], [], [], [], []]);

            modifiers.permanent = { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: permanent, dataset: { subtab: "permanent" }};
            modifiers.temporary = { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: temporary, dataset: { subtab: "temporary" }};
        }

        // Assign and return
        data.inventory = inventory;
        data.features = Object.values(features);
        data.spellbook = spellbook;
        data.modifiers = Object.values(modifiers);
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const crs = { "1/8": 0.125, "1/6": 1/6, "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let crv = "data.details.cr";
        let cr = formData[crv];
        cr = crs[cr] || parseFloat(cr);
        if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

        // Parent ActorSheet update steps
        return super._updateObject(event, formData);
    }

    static async _selectActorData({yes, no, cancel, render, defaultYes=true, rejectClose=false, options={width: 600}}={}) {
        return new Promise((resolve, reject) => {
            const dialog = new Dialog({
                title: game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.DialogTitle"),
                content: game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.DialogMessage") + "<br/><br/>",
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-address-card"></i>',
                        label: game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.DialogOriginalActorButton"),
                        callback: html => {
                            const result = yes ? yes(html) : true;
                            resolve(result);
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-exchange-alt"></i>',
                        label: game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.DialogUnlinkedActorButton"),
                        callback: html => {
                            const result = no ? no(html) : false;
                            resolve(result);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.DialogCancelButton"),
                        callback: html => {
                            resolve(null);
                        }
                    }
                },
                default: defaultYes ? "yes" : "no",
                render: render,
                close: () => {
                    if ( rejectClose ) reject("The confirmation Dialog was closed without a choice being made");
                    else resolve(null);
                },
            }, options);
            dialog.render(true);
        });
    }

    async _duplicateAsNewStyleNPC(event) {
        let actorData = duplicate(this.actor);

        if (this.token && !this.token.actorLink) {
            // If it is an unlinked actor, ask if the user wants to duplicate the original actor, or use the unlinked actor data instead
            let useOriginalActor = null;
            await ActorSheetSFRPGNPC._selectActorData({
                yes: () => {
                    useOriginalActor = true;
                },
                no: () => {
                    useOriginalActor = false;
                }
            });

            // If no choice was made, don't duplicate
            if (useOriginalActor === null) {
                return;
            }
            
            if (useOriginalActor === true) {
                const originalActor = game.actors.get(this.token.actor.id);
                if (originalActor) {
                    actorData = duplicate(originalActor);
                }
            }
        }

        // Convert the old user input into the new architecture
        for (const [abl, ability] of Object.entries(actorData.system.abilities)) {
            ability.base = ability.mod;
        }

        for (const [skl, skill] of Object.entries(actorData.system.skills)) {
            if (skill.enabled) {
                skill.ranks = skill.mod;
            }
        }
        actorData.system.attributes.eac.base = actorData.system.attributes.eac.value;
        actorData.system.attributes.kac.base = actorData.system.attributes.kac.value;
        actorData.system.attributes.init.value = actorData.system.attributes.init.total;

        actorData.system.attributes.fort.base = actorData.system.attributes.fort.bonus;
        actorData.system.attributes.reflex.base = actorData.system.attributes.reflex.bonus;
        actorData.system.attributes.will.base = actorData.system.attributes.will.bonus;

        // Create NPC actor with name + " - New Style"
        actorData.name += " - New Style";
        actorData.type = "npc2";
        delete actorData._id;

        const actor = await Actor.create(actorData);
        if (actor == null) {
            ui.notifications.error(game.i18n.localize("SFRPG.NPCSheet.Interface.DuplicateNewStyle.ErrorCreateActor"), {permanent: true});
            return;
        }

        // Open newly created NPC sheet
        const registeredSheet = Actors.registeredSheets.find(x => x.name === "ActorSheetSFRPGNPC");
        const sheet = new registeredSheet(actor);
        sheet.render(true);
    }
}
