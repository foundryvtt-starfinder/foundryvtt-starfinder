import { SFRPG } from "../../config.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGCharacter extends ActorSheetSFRPG {
    constructor(...args) {
        super(...args);

        this.acceptedItemTypes.push(...SFRPG.characterDefinitionItemTypes);
        this.acceptedItemTypes.push(...SFRPG.playerCharacterDefinitionItemTypes);
        this.acceptedItemTypes.push(...SFRPG.physicalItemTypes);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ['sfrpg', 'sheet', 'actor', 'character'],
            width: 715
            // height: 830
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.hbs";
        return path + "character-sheet.hbs";
    }

    async getData() {
        const sheetData = await super.getData();

        let hp = sheetData.system.attributes.hp;
        if (hp.temp === 0) delete hp.temp;
        if (hp.tempmax === 0) delete hp.tempmax;

        sheetData["disableExperience"] = game.settings.get("sfrpg", "disableExperienceTracking");

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     *
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const actorData = data.system;

        const inventory = {
            weapon: { label: game.i18n.format(SFRPG.itemTypes["weapon"]), items: [], dataset: { type: "weapon" }, allowAdd: true },
            shield: { label: game.i18n.format(SFRPG.itemTypes["shield"]), items: [], dataset: { type: "shield" }, allowAdd: true },
            equipment: { label: game.i18n.format(SFRPG.itemTypes["equipment"]), items: [], dataset: { type: "equipment" }, allowAdd: true },
            ammunition: { label: game.i18n.format(SFRPG.itemTypes["ammunition"]), items: [], dataset: { type: "ammunition" }, allowAdd: true },
            consumable: { label: game.i18n.format(SFRPG.itemTypes["consumable"]), items: [], dataset: { type: "consumable" }, allowAdd: true },
            goods: { label: game.i18n.format(SFRPG.itemTypes["goods"]), items: [], dataset: { type: "goods" }, allowAdd: true },
            container: { label: game.i18n.format(SFRPG.itemTypes["container"]), items: [], dataset: { type: "container" }, allowAdd: true },
            technological: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.SpecialItems"), items: [], dataset: { type: "technological,magic,hybrid" }, allowAdd: true },
            fusion: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.EquipmentEnhancements"), items: [], dataset: { type: "fusion,upgrade,weaponAccessory" }, allowAdd: true },
            augmentation: { label: game.i18n.format(SFRPG.itemTypes["augmentation"]), items: [], dataset: { type: "augmentation" }, allowAdd: true }
        };

        let physicalInventoryItems = [];
        for (const [key, value] of Object.entries(inventory)) {
            const datasetType = value.dataset.type;
            const types = datasetType.split(',');
            physicalInventoryItems = physicalInventoryItems.concat(types);
        }

        //   0      1       2      3        4      5       6           7               8     9
        let [items,
            spells,
            feats,
            classes,
            races,
            themes,
            archetypes,
            conditionItems, // contains Conditions and other timedEffects
            asis,
            actorResources] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.config = {
                isStack: item.system.quantity ? item.system.quantity > 1 : false,
                isOpen: item.type === "container" ? item.system.container.isOpen : true,
                isOnCooldown: item.system.recharge && !!item.system.recharge.value && (item.system.recharge.charged === false),
                hasAttack: ["mwak", "rwak", "msak", "rsak"].includes(item.system.actionType) && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                hasDamage: item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                hasUses: item.canBeUsed(),
                isCharged: !item.hasUses || item.getRemainingUses() <= 0 || !item.isOnCooldown,
                hasCapacity: item.hasCapacity()
            };

            if (item.config.hasCapacity) {
                item.config.capacityCurrent = item.getCurrentCapacity();
                item.config.capacityMaximum = item.getMaxCapacity();
            }

            if (item.type === "actorResource") {
                this._prepareActorResource(item, actorData);
            }

            if (item.type === "spell") {
                const container = data.items.find(x => x.system.container?.contents?.find(x => x.id === item._id) || false);
                if (!container) {
                    arr[1].push(item); // spells
                } else {
                    arr[0].push(item); // items
                }
            } else if (item.type === "effect") {
                const timedEffect = duplicate(actorData.timedEffects.find(effect => effect.itemId === item.id) || {});
                item.timedEffect = timedEffect?.id;
                arr[7].push(item); // timedEffects & conditionItems
            } else if (item.type === "feat") {
                arr[2].push(item); // feats
                item.isFeat = true;
            } else if (item.type === "class") arr[3].push(item); // classes
            else if (item.type === "race") arr[4].push(item); // races
            else if (item.type === "theme") arr[5].push(item); // themes
            else if (item.type === "archetypes") arr[6].push(item); // archetypes
            else if (item.type === "asi") arr[8].push(item); // asis
            else if (item.type === "actorResource") arr[9].push(item); // asis
            else if (physicalInventoryItems.includes(item.type)) arr[0].push(item); // items
            else arr[0].push(item); // items
            return arr;
        }, [[], [], [], [], [], [], [], [], [], []]);

        const spellbook = this._prepareSpellbook(data, spells);

        this.processItemContainment(items, function(itemType, itemData) {
            let targetItemType = itemType;
            if (!(itemType in inventory)) {
                for (let [key, entry] of Object.entries(inventory)) {
                    if (entry.dataset.type.includes(itemType)) {
                        targetItemType = key;
                        break;
                    }
                }
            }

            if (!(targetItemType in inventory)) {
                let label = "SFRPG.Items.Categories.MiscellaneousItems";
                if (targetItemType in SFRPG.itemTypes) {
                    label = SFRPG.itemTypes[targetItemType];
                } else {
                    console.log(`Item '${itemData.item.name}' with type '${targetItemType}' is not a registered item type!`);
                }
                inventory[targetItemType] = { label: game.i18n.format(label), items: [], dataset: { }, allowAdd: false };
            }
            inventory[targetItemType].items.push(itemData);
        });

        const features = {
            classes: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Classes"),
                items: [],
                hasActions: false,
                dataset: { type: "class" },
                isClass: true
            },
            race: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Race"),
                items: [],
                hasActions: false,
                dataset: { type: "race" },
                isRace: true
            },
            theme: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Theme"),
                items: [],
                hasActions: false,
                dataset: { type: "theme" },
                isTheme: true
            },
            asi: {
                category: game.i18n.format("SFRPG.Items.Categories.AbilityScoreIncrease"),
                items: asis,
                hasActions: false,
                dataset: { type: "asi" },
                isASI: true
            },
            archetypes: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Archetypes"),
                items: [],
                dataset: { type: "archetypes" },
                isArchetype: true
            },
            active: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActiveFeats"),
                items: [],
                hasActions: true,
                dataset: { type: "feat", "activation.type": "action" }
            },
            ...duplicate(CONFIG.SFRPG.featureCategories),
            resources: {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"),
                items: [],
                hasActions: false,
                dataset: { type: "actorResource" }
            }

        };

        let otherFeatures = [];
        for (let f of feats) {
            if (f.system.activation.type) features.active.items.push(f);
            else {
                try {
                    features[f.system.details.category].items.push(f);
                } catch {
                    features.otherFeatures.items.push(f);
                }
            }
        }

        if (otherFeatures.length > 0) {
            features.otherFeatures = {
                category: game.i18n.format("SFRPG.ActorSheet.Features.Categories.OtherFeatures"),
                items: otherFeatures,
                hasActions: false,
                allowAdd: false
            };
        }

        classes.sort((a, b) => b.levels - a.levels);
        features.classes.items = classes;
        features.race.items = races;
        features.theme.items = themes;
        features.archetypes.items = archetypes;
        features.resources.items = actorResources;

        data.inventory = Object.values(inventory);
        data.spellbook = spellbook;
        data.features = Object.values(features);

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions", type: "effect" }, isConditions: true, allowAdd: true },
            permanent: { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: [], dataset: { subtab: "permanent" } },
            temporary: { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: [], dataset: { subtab: "temporary" } }
        };

        let [permanent, temporary, itemModifiers, conditions, misc] = actorData.modifiers.reduce((arr, modifier) => {
            if (modifier.subtab === "permanent") arr[0].push(modifier);
            else if (modifier.subtab === "conditions") arr[3].push(modifier);
            else arr[1].push(modifier); // Any unspecific categories go into temporary.

            return arr;
        }, [[], [], [], [], []]);

        modifiers.conditions.items = conditionItems;
        modifiers.permanent.modifiers = permanent;
        modifiers.temporary.modifiers = temporary.concat(conditions);

        data.modifiers = Object.values(modifiers);
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        // html.find('.toggle-prepared').click(this._onPrepareItem.bind(this));
        html.find('.reload').on('click', this._onReloadWeapon.bind(this));

        html.find('.short-rest').on('click', this._onShortRest.bind(this));
        html.find('.long-rest').on('click', this._onLongRest.bind(this));
        html.find('.modifier-create').on('click', this._onModifierCreate.bind(this));
        html.find('.modifier-edit').on('click', this._onModifierEdit.bind(this));
        html.find('.modifier-delete').on('click', this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').on('click', this._onToggleModifierEnabled.bind(this));
        html.find('.effect-toggle').on('click', this._onToggleEffect.bind(this));
        html.find('.player-class-level-up').on('click', this._onLevelUp.bind(this));
    }

    onBeforeCreateNewItem(itemData) {
        super.onBeforeCreateNewItem(itemData);

        if (itemData["type"] === "asi") {
            const numASI = this.actor.items.filter(x => x.type === "asi").length;
            const level = 5 + numASI * 5;
            itemData.name = game.i18n.format("SFRPG.ItemSheet.AbilityScoreIncrease.ItemName", {level: level});
        }
    }

    /**
     * Handle toggling the prepared status of an Owned Itme within the Actor
     *
     * @param {Event} event The triggering click event
     */
    _onPrepareItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.update({'system.preparation.prepared': !item.system.preparation.prepared});
    }

    /**
     * Take a short 10 minute rest, calling the relevant function on the Actor instance
     * @param {Event} event The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /**
     * Take a long rest, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }
}
