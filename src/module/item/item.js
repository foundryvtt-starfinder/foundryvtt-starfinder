import { getItemContainer } from "../actor/actor-inventory-utils.js";
import { ChatMessageSFRPG } from "../chat/message.js";
import { SFRPG } from "../config.js";
import { DiceSFRPG } from "../dice.js";
import SFRPGModifier from "../modifiers/modifier.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../modifiers/types.js";
import SFRPGRoll from "../rolls/roll.js";
import RollContext from "../rolls/rollcontext.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";
import { Mix } from "../utils/custom-mixer.js";
import { ItemActivationMixin } from "./mixins/item-activation.js";
import { ItemCapacityMixin } from "./mixins/item-capacity.js";
import { ItemChatMixin } from "./mixins/item-chat.js";

/**
 * @import { RollResult } from '../dice.js'
 */

/**
 * The relevant roll modifiers for this item or actor for each type of roll that it can make
 *
 * @typedef     {Object}            ItemRollModifiers
 * @property    {SFRPGModifier[]}   ammo        Modifiers for ammunition usage
 * @property    {SFRPGModifier[]}   attack      Modifiers for attack rolls made with this item
 * @property    {SFRPGModifier[]}   damage      Modifiers for damage rolls made with this item
 * @property    {SFRPGModifier[]}   healing     Modifiers for healing rolls made with this item
 */

/** @extends {foundry.documents.Item} */
export class ItemSFRPG extends Mix(foundry.documents.Item).with(ItemActivationMixin, ItemCapacityMixin, ItemChatMixin) {

    constructor(data, context = {}) {
        // Set module art if available. This applies art to items viewed or created from compendiums.
        if (context.pack && data._id) {
            const art = game.sfrpg.compendiumArt.map.get(`Compendium.${context.pack}.${data._id}`);
            if (art) {
                data.img = art.item;
            }
        }
        super(data, context);
    }

    /* -------------------------------------------- */
    /*  Item Properties                             */
    /* -------------------------------------------- */

    get attackAbility() {
        let abl = this.system.ability;
        const actorAbilities = this.actor.system.abilities;
        const actionType = this.system.actionType;

        if (!abl && (this.actor.type === "npc" || this.actor.type === "npc2")) {
            abl = "";
        } else if (!abl && (this.type === "spell")) {
            if (actionType === "rsak")      abl = "dex";
            else if (actionType === "msak") abl = "str";
            else                            abl = this.actor.attributes.spellcasting || "int";
        } else if (this.system.properties?.operative?.value && actorAbilities.dex.value > actorAbilities.str.value) {
            abl = "dex";
        } else if (!abl) {
            if (actionType === "rwak" || actionType === "rsak")         abl = "dex";
            else if (actionType === "mwak" || actionType === "msak")    abl = "str";
            else                                                        abl = "str";
        }
        return abl;
    }

    /**
     * Does the Item implement an attack roll as part of its usage
     * @type {boolean}
     */
    get hasAttack() {
        if (this.type === "starshipWeapon") return true;
        return SFRPG.attackActions.includes(this.system.actionType);
    }

    /**
     * Does the item have an other formula implemented?
     * @type {boolean}
     */
    get hasOtherFormula() {
        return ("formula" in this.system) && this.system.formula?.trim().length > 0;
    }

    /**
     * Does the Item implement a damage roll as part of its usage
     * @type {boolean}
     */
    get hasDamage() {
        return !!(this.system.damage && this.system.damage.parts.length);
    }

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSave() {
        const saveData = this.system?.save;
        if (!saveData) {
            return false;
        }

        const hasType = !!saveData.type;
        return hasType;
    }

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSkill() {
        const skillData = this.system?.skillCheck;
        if (!skillData) return false;

        return !!skillData.type;
    }

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasArea() {
        const areaData = this.system?.area;
        if (!areaData) return false;
        const hasAreaValue = areaData.total > 0
            ? true
            : (Number(areaData.value) > 0 ? true : false);
        return hasAreaValue;
    }

    /**
     * Does the Item's damage qualify as magic?
     * @type {boolean}
     */
    get hasMagicDamage() {
        if (!this.hasDamage) return false;
        if (['magic', 'hybrid', 'spell'].includes(this.type)) return true;
        if (['msak', 'rsak'].includes(this.system.actionType ?? null)) return true;
        if (this.system.properties?.hybrid?.value) return true;
        const containedItems = this.contents ?? [];
        for (const item of containedItems) {
            if (item.type === 'fusion') return true;
        }
        return false;
    }

    /**
     * Is the item a weapon (or shield)?
     * @type {boolean}
     */
    get isWeapon() {
        return ["weapon", "shield"].includes(this.type);
    }

    /**
     * Gets the types of modifiers that are relevant to this item, split into the types of rolls that can be made with it
     * @type {ItemRollModifiers}
     */
    get relevantModifiers() {
        const ammo = [];
        const attack = [];
        const damage = [];
        // const healing = [];
        const allModifiers = this.actor.getAllModifiers();

        // Applies to all rolls
        ammo.push(SFRPGEffectType.ALL_AMMO_USAGE_MULTIPLIER);
        attack.push(SFRPGEffectType.ALL_ATTACKS);
        damage.push(SFRPGEffectType.ALL_DAMAGE);

        // Applies based on action type
        if (SFRPG.spellAttackActions.includes(this.system.actionType)) {
            attack.push(SFRPGEffectType.SPELL_ATTACKS);
            damage.push(SFRPGEffectType.SPELL_DAMAGE);
        } else if (this.type === "spell" && this.system.actionType === "save") {
            damage.push(SFRPGEffectType.SPELL_DAMAGE);
        } else if (this.system.actionType === "rwak") {
            attack.push(SFRPGEffectType.RANGED_ATTACKS);
            damage.push(SFRPGEffectType.RANGED_DAMAGE);
        } else if (this.system.actionType === "mwak") {
            attack.push(SFRPGEffectType.MELEE_ATTACKS);
            damage.push(SFRPGEffectType.MELEE_DAMAGE);
        }

        // Applies based on whether its a weapon and if it has matching properties or categories
        if (this.isWeapon) {
            ammo.push(SFRPGEffectType.WEAPON_AMMO_USAGE_MULTIPLIER, SFRPGEffectType.WEAPON_PROPERTY_AMMO_USAGE_MULTIPLIER, SFRPGEffectType.WEAPON_CATEGORY_AMMO_USAGE_MULTIPLIER);
            attack.push(SFRPGEffectType.WEAPON_ATTACKS, SFRPGEffectType.WEAPON_PROPERTY_ATTACKS, SFRPGEffectType.WEAPON_CATEGORY_ATTACKS);
            damage.push(SFRPGEffectType.WEAPON_DAMAGE, SFRPGEffectType.WEAPON_PROPERTY_DAMAGE, SFRPGEffectType.WEAPON_CATEGORY_DAMAGE);
        }

        // Collect all the modifiers for ammo usage
        const ammoModifiers = allModifiers.filter(mod => {
            // Remove inactive mods and mods that aren't constant (this is only supporting constant mods right now)
            if (!mod.enabled || mod.modifierType !== SFRPGModifierType.CONSTANT) return false;

            if (mod.limitTo === "parent" && mod.item !== this) return false;
            if (mod.limitTo === "container") {
                const parentItem = getItemContainer(this.actor.items, mod.item);
                if (parentItem?.id !== this.id) return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_AMMO_USAGE_MULTIPLIER) {
                if (mod.valueAffected !== this.system?.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_AMMO_USAGE_MULTIPLIER) {
                if (!this.system?.properties?.[mod.valueAffected]?.value) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_AMMO_USAGE_MULTIPLIER) {
                if (this.system?.weaponCategory !== mod.valueAffected) {
                    return false;
                }
            }

            return ammo.includes(mod.effectType);
        });

        // Collect all the modifiers for attack rolls
        const attackModifiers = allModifiers.filter(mod => {
            // Remove inactive constant and damage section mods. Keep all situational mods, regardless of status.
            if (!mod.enabled && mod.modifierType !== SFRPGModifierType.FORMULA) return false;

            if (mod.limitTo === "parent" && mod.item !== this) return false;
            if (mod.limitTo === "container") {
                const parentItem = getItemContainer(this.actor.items, mod.item);
                if (parentItem?.id !== this.id) return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_ATTACKS) {
                if (mod.valueAffected !== this.system?.weaponType) return false;
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_ATTACKS) {
                if (!this.system?.properties?.[mod.valueAffected]?.value) return false;
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_ATTACKS) {
                if (this.system?.weaponCategory !== mod.valueAffected) return false;
            }

            return attack.includes(mod.effectType);
        });

        // Collect all the modifiers for damage rolls
        const damageModifiers = allModifiers.filter(mod => {
            // If it's disabled or not one of the modifiers we've identified as relevant, ditch it
            if (!damage.includes(mod.effectType) || !mod.enabled) {
                return false;
            }

            // If a mod is limited to affecting its parent item or parent item's container
            if (mod.limitTo === "parent" && mod.item !== this) return false;
            if (mod.limitTo === "container") {
                const parentItem = getItemContainer(this.actor.items, mod.item);
                if (parentItem?.id !== this.id) return false;
            }

            // Downselect for weapons, weapon properties, and weapon categories
            if (mod.effectType === SFRPGEffectType.WEAPON_DAMAGE) {
                if (mod.valueAffected !== this.system.weaponType) return false;
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_DAMAGE) {
                if (!this.system.properties[mod.valueAffected]?.value) return false;
            } else if (mod.effectType === SFRPGEffectType.WEAPON_CATEGORY_DAMAGE) {
                if (this.system.weaponCategory !== mod.valueAffected) return false;
            }

            // Return any remaining modifiers if they are enabled or situational (formula) or damage sections
            return (mod.enabled || ["formula", "damageSection"].includes(mod.modifierType));
        });

        return {ammo: ammoModifiers, attack: attackModifiers, damage: damageModifiers, healing: []};
    }

    get origin() {
        return fromUuidSync(this.system?.context?.origin?.actorUuid) || null;
    }

    get originItem() {
        return fromUuidSync(this.system?.context?.origin?.itemUuid) || null;
    }

    /**
     * The timedEffect object of this item, if any.
     * @returns {SFRPGTimedEffect|undefined}
     */
    get timedEffect() {
        return game.sfrpg.timedEffects.get(this.uuid);
    }

    /* -------------------------------------------- */
    /*	Data Preparation                             */
    /* -------------------------------------------- */

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();
        const labels = {};

        // Spell Level,  School, and Components
        if (this.type === "spell") {
            labels.level = CONFIG.SFRPG.spellLevels[this.system.level];
            labels.school = CONFIG.SFRPG.spellSchools[this.system.school];
        }

        // Feat Items
        else if (this.type === "feat") {
            const act = this.system.activation;
            labels.featType = this.system?.damage?.parts?.length && SFRPG.attackActions.includes(this.system.actionType)
                ? game.i18n.localize("SFRPG.Attack")
                : act.type ? game.i18n.localize("SFRPG.Items.Action.TitleAction") : game.i18n.localize("SFRPG.Passive");
        }

        // Equipment Items
        else if (this.type === "equipment") {
            labels.eac = this.system.armor.eac ? `${this.system.armor.eac} ${game.i18n.localize("SFRPG.EnergyArmorClassShort")}` : "";
            labels.kac = this.system.armor.kac ? `${this.system.armor.kac} ${game.i18n.localize("SFRPG.KineticArmorClassShort")}` : "";
        }

        // Apply a tag if the item is a weapon that's not equipment (unarmed strike, natural attack, etc.)
        if (this.type === "weapon") this.system.transferrable = this.system.isEquipment;
        else this.system.transferrable = true;

        // Activated Items
        if (this.system.hasOwnProperty("activation")) {

            // Ability Activation Label
            const activation = this.system.activation || {};
            if (activation) {
                if (activation.type === "none") {
                    labels.activation = (this.system.duration?.units === "instantaneous")
                        ? game.i18n.localize("SFRPG.AbilityActivationButton.Use")
                        : game.i18n.localize("SFRPG.AbilityActivationButton.Activate");
                } else if (SFRPG.uncountableActivations.includes(activation.type)) {
                    labels.activation = CONFIG.SFRPG.abilityActivationTypes[activation.type];
                } else {
                    labels.activation = [
                        activation.cost,
                        CONFIG.SFRPG.abilityActivationTypes[activation.type]
                    ].filterJoin(" ");
                }
            }

            const target = this.system.target || {};
            if (target.value && target.value === "") target.value = null;
            labels.target = [target.value].filterJoin(" ");
        }

        // Item Actions
        // TODO-Ian: Why do all actions when we just seem to prepare damage?
        if (this.system.hasOwnProperty("actionType")) {
            // Damage
            const damage = this.system.damage || {};
            const damageParts = damage.parts;
            if (damageParts.length > 0) {
                labels.damage = damage.parts
                    .map(d => d[0])
                    .join(" + ")
                    .replace(/\+ -/g, "- ");

                // There must always be one primary damage group or section.
                // If the primary damage group is set, mark all of the members of that group as primary.
                const allGroups = damageParts.reduce((arr, part) => {
                    if (!!part.group || part.group === 0) arr.push(part.group);
                    return arr;
                }, []);
                if (Number.isInteger(this.system.damage.primaryGroup) && allGroups.length > 0) {
                    // Set primary group to first group if no parts on the item are in the group
                    if (!(allGroups.includes(this.system.damage.primaryGroup)))
                        this.system.damage.primaryGroup = allGroups.sort()[0];

                    for (const part of damageParts) {
                        if (part.group === this.system.damage.primaryGroup) part.isPrimarySection = true;
                        else part.isPrimarySection = false;
                    }

                // If the primary group is blank, set the 1st damage section, and any parts in the same group, as primary.
                } else if (!(damageParts.some(part => part.isPrimarySection))) {
                    damageParts[0].isPrimarySection = true;
                    const primaryGroup = damageParts[0].group ?? null;

                    if (primaryGroup !== null) {
                        for (const part of damageParts) {
                            if (part.group === primaryGroup) part.isPrimarySection = true;
                            else part.isPrimarySection = false;
                        }
                    }
                }

            }
        }

        // Assign labels and return the Item
        this.labels = labels;
    }

    async processData() {
        return game.sfrpg.engine.process("process-items", {
            item: this,
            itemData: this.system,
            owner: {
                actor: this.actor,
                actorData: this.actor?.system,
                token: this.actor?.token,
                scene: this.actor?.token?.parent
            }
        });
    }

    /**
     * Extend preCreate to create class name slugs.
     * See the base Actor class for API documentation of this method
     *
     * @param {object} data           The initial data object provided to the document creation request
     * @param {object} options        Additional options which modify the creation request
     * @param {string} userId         The ID of the requesting user, always game.user.id
     * @returns {boolean|void}        Explicitly return false to prevent creation of this Document
     */
    async _preCreate(data, options, user) {
        const updates = {};

        if (this.type === "class" && !this.system?.slug) {
            updates["system.slug"] = this.name.slugify({replacement: "_", strict: true});
        }

        // Events for when an item is created on an actor since pre/_onCreateDescendantDocuments lie >:(
        if (this.actor) {
            if (["npc", "npc2"].includes(this.actor.type)) {
                if (["weapon", "shield"].includes(this.type)) updates['system.proficient'] = true;
                if (["weapon", "equipment"].includes(this.type)) updates['system.equipped'] = true;
                if (this.type === "spell") updates['system.prepared'] = true;
            }
            else {
                if (this.type === "weapon") {
                    const proficiencyKey = SFRPG.weaponTypeProficiency[this.system.weaponType];
                    const proficient = this.system.proficient || this.actor?.system?.traits?.weaponProf?.value?.includes(proficiencyKey);
                    if (proficient) updates["system.proficient"] = true;
                } else if (this.type === "shield") {
                    const proficiencyKey = "shl";
                    const proficient = this.system.proficient || this.actor?.system?.traits?.armorProf?.value?.includes(proficiencyKey);
                    if (proficient) updates["system.proficient"] = true;
                }
            }

            if (this.effects instanceof Array) this.effects = null;
            else if (this.effects instanceof Map) this.effects.clear();

            // Record current world time and initiative on effects
            if (this.type === "effect" && this.system.enabled) {
                updates['system.activeDuration.activationTime'] = game.time.worldTime;
                if (game.combat) {
                    updates['system.activeDuration.activationTurn'] = game.combat.combatant?.actor?.uuid || "parent";
                    updates['system.activeDuration.expiryInit'] = game.combat.initiative;
                } else {
                    updates['system.activeDuration.activationTurn'] = "parent";
                }
            }

            if (this.type === "asi") {
                const numASI = this.actor.items.filter(x => x.type === "asi").length;
                const level = 5 + numASI * 5;
                updates["name"] = game.i18n.format("SFRPG.ItemSheet.AbilityScoreIncrease.ItemName", {level: level});
            }

        } else {
            // Clear origin data if an effect is dragged from an actor to the sidebar.
            if (this.type === "effect") {
                updates["system.context.origin.actorUuid"] = "";
                updates["system.context.origin.itemUuid"] = "";
            }
        }

        // Apply a default icon to the item based on its type if it doesn't already have an icon selected
        if (Object.values(SFRPG.foundryDefaultIcons).includes(this.img)) {
            if (Object.keys(SFRPG.defaultItemIcons).includes(this.type)) {
                updates.img = ["systems/sfrpg/icons/default/", SFRPG.defaultItemIcons[this.type]].join("");
            }
        }

        this.updateSource(updates);

        return super._preCreate(data, options, user);
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
            tokenId: token ? `${token.parent.id}.${token.id}` : null,
            item: this,
            system: await this.getChatData(),
            labels: this.labels,
            hasAttack: this.hasAttack,
            hasDamage: this.hasDamage,
            hasSave: this.hasSave,
            hasSkill: this.hasSkill,
            hasArea: this.hasArea && ["ft", "meter"].includes(this.system.area.units) && !["", "other"].includes(this.system.area.shape),
            hasOtherFormula: this.hasOtherFormula
        };

        if (this.type === "spell") {
            let descriptionText = foundry.utils.deepClone(templateData.system.description.short || templateData.system.description.value);
            if (descriptionText?.length > 0) {
                // Alter description by removing non-eligble level tags.
                const levelTags = [
                    {level: 0, tag: "level_0"},
                    {level: 1, tag: "level_1"},
                    {level: 2, tag: "level_2"},
                    {level: 3, tag: "level_3"},
                    {level: 4, tag: "level_4"},
                    {level: 5, tag: "level_5"},
                    {level: 6, tag: "level_6"}
                ];

                for (const {level, tag} of levelTags) {
                    const shouldShowEx = level === this.system.level;
                    const startTagEx = `[${tag}_only]`;
                    const endTagEx = `[/${tag}_only]`;

                    const shouldShowInc = level <= this.system.level;
                    const startTagInc = `[${tag}]`;
                    const endTagInc = `[/${tag}]`;

                    if (shouldShowEx) {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        while (tagStartIndex !== -1) {
                            descriptionText = descriptionText.replace(startTagEx, "");
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagEndIndex !== -1) {
                            descriptionText = descriptionText.replace(endTagEx, "");
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagStartIndex !== -1 && tagEndIndex !== -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagEx.length);
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    }

                    if (shouldShowInc) {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        while (tagStartIndex !== -1) {
                            descriptionText = descriptionText.replace(startTagInc, "");
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagEndIndex !== -1) {
                            descriptionText = descriptionText.replace(endTagInc, "");
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagStartIndex !== -1 && tagEndIndex !== -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagInc.length);
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    }
                }

                if (templateData.system.description.short) {
                    templateData.system.description.short = descriptionText;
                } else {
                    templateData.system.description.value = descriptionText;
                }
            }
        }

        // Render the chat card template
        const templateType = ["tool", "consumable"].includes(this.type) ? this.type : "item";
        const template = `systems/sfrpg/templates/chat/${templateType}-card.hbs`;
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

        // Basic chat message data
        const chatData = {
            author: game.user.id,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            content: html,
            flags: {
                core: {
                    canPopout: true
                },
                sfrpg: {
                    item: this.uuid,
                    actor: this.actor.uuid,
                    level: this.system.level
                }
            },
            speaker: token ? ChatMessageSFRPG.getSpeaker({token: token}) : ChatMessageSFRPG.getSpeaker({actor: this.actor})
        };

        const rollMode = game.settings.get("core", "rollMode");
        ChatMessageSFRPG.applyRollMode(chatData, rollMode);

        // Create the chat message
        return ChatMessageSFRPG.create(chatData, { displaySheet: false });
    }

    /* -------------------------------------------- */
    /*  Item Rolls - Attack, Damage, Saves, Checks  */
    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.d20Roll logic for the core implementation
     *
     * @param   {Object}    [options]                           Options to be passed to the roll
     * @param   {Event}     [options.event]                     The triggering event
     * @param   {boolean}   [options.disableDamageAfterAttack]  If the "Roll damage with attack" system setting is enabled, this being true disables it
     * @param   {boolean}   [options.disableDeductAmmo]         Prevent ammo being deducted
     * @returns {Promise<RollResult?>}
     */
    async rollAttack(options = {}) {
        if (!this.hasAttack) {
            ui.notifications.error("You may not make an Attack Roll with this Item.");
            return;
        }

        // If Ctrl key held, don't deduct ammo
        options.disableDeductAmmo = options.disableDeductAmmo || options.event?.ctrlKey;

        // Divert to specific starship or vehicle attack methods if appropriate
        if (this.type === "starshipWeapon") return this._rollStarshipAttack(options);
        if (this.type === "vehicleAttack") return this._rollVehicleAttack(options);

        // Check if the item's usage per attack is greater than the ammo remaining and warn the user if there is none left
        if (this.getCurrentCapacity() < (this.system.usage?.value || 0)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ItemNoAmmo", {name: this.name}));
        }

        // Define Roll parts
        const parts = [];
        if (Number.isNumeric(this.system.attackBonus) && this.system.attackBonus !== 0) parts.push("@item.attackBonus");
        if (this.attackAbility) parts.push(`@abilities.${this.attackAbility}.mod`);
        if (["character", "drone"].includes(this.actor.type)) parts.push("@attributes.baseAttackBonus.value");
        if (this.isWeapon) {
            const proficiencyKey = SFRPG.weaponTypeProficiency[this.system.weaponType];
            const proficient = this.system.proficient || this.actor?.system?.traits?.weaponProf?.value?.includes(proficiencyKey);
            if (!proficient) {
                parts.push(`-4[${game.i18n.localize("SFRPG.Items.NotProficient")}]`);
            }
        }

        // Create global attack modifiers, add them to the situational list to show in the roll dialog
        const additionalModifiers = foundry.utils.deepClone(SFRPG.globalAttackRollModifiers).map(mod => {
            const modInstance = {bonus: new SFRPGModifier(mod.bonus, {parent: this, globalModifier: true})};
            return modInstance;
        });

        // Get applicable modifiers and parse these into situational (FORMULA, additionalModifiers),
        // and constant (set directly as roll parts)
        const modifiers = await new StackModifiers().processAsync(this.relevantModifiers.attack, null, {actor: this.actor});
        for (const modType of Object.values(modifiers)) {
            for (const mod of modType) {
                if (mod.modifierType === SFRPGModifierType.FORMULA) additionalModifiers.push({bonus: mod});
                else parts.push({score: mod.modifier, explanation: mod.name});
            }
        }

        // Include bonus from additional modifiers at the end of the formula
        parts.push("@additional.modifiers.bonus");

        // If the item has an action target, get some target info for adding in to the roll criteria later
        const rollTargetInfo = {};
        if (this.system.actionTarget) {
            rollTargetInfo.actionTarget = this.system.actionTarget;
            rollTargetInfo.actionTargetSource = SFRPG.actionTargets;
        }

        // Create roll context for this item and add additional contexts (for modifier evaluation)
        const rollContext = RollContext.createItemRollContext(this, this.actor, {itemData: this.system});
        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });

        // Call the roll helper utility
        return DiceSFRPG.d20Roll({
            skipUI: game.settings.get('sfrpg', 'useQuickRollAsDefault') ? !options.event?.shiftKey : options.event?.shiftKey,
            parts: parts,
            actorContextKey: "owner",
            rollContext: rollContext,
            title: game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name}),
            flavor: await foundry.applications.ux.TextEditor.enrichHTML(this.system?.chatFlavor, {
                async: true,
                rollData: this.actor.getRollData() ?? {},
                secrets: this.isOwner
            }),
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            rollCriteria: SFRPGRoll.createRollCriteria("attack", rollTargetInfo),
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            onClose: this._onAttackRollClose.bind(this, options)
        });
    }

    _calculateAmmoUsageWithModifiers(value) {
        const modifiers = new StackModifiers().process(this.relevantModifiers.ammo, null, {actor: this.actor, item: this});
        let multiplier = 1.0;
        const modsToProcess = [];
        for (const modValue of Object.values(modifiers)) {
            for (const bonus of modValue) {
                modsToProcess.push(bonus);
            }
        }
        const rollContext = RollContext.createItemRollContext(this, this.actor);
        for (const mod of modsToProcess) {
            const rollResult = DiceSFRPG.resolveFormulaWithoutDice(mod.modifier?.toString(), rollContext);
            const computedBonus = !rollResult.hadError ? rollResult.total : 1;
            multiplier *= computedBonus;
        }
        const computedValue = Math.round(value * multiplier);
        return computedValue < 0 ? 0 : computedValue;
    }

    /**
     * Handle updating item capacity when the attack dialog closes.
     *
     * @param {Html} html The html from the dailog
     * @param {Array} parts The parts of the roll
     * @param {Object} data The data
     *
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    _onAttackRollClose(options, roll, formula, finalFormula) {
        if (!roll) {
            return;
        }

        if (this.system.hasOwnProperty("usage") && !options.disableDeductAmmo) {
            const usage = this.system.usage;

            if (usage.per && ["action", "shot"].includes(usage.per)) {
                this.consumeCapacity(this._calculateAmmoUsageWithModifiers(usage.value));
            }
        }

        Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});

        const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
        if (rollDamageWithAttack && !roll.isFumble() && !options.disableDamageAfterAttack) {
            this.rollDamage(options.event, {linkedAttackRoll: roll});
        }
    }

    /**
     * Handle updating item capacity when an item is used
     */
    _deductItemCharge() {
        const usage = this.system.usage;
        this.consumeCapacity(this._calculateAmmoUsageWithModifiers(usage.value));
    }

    /**
     * Place an attack roll for a starship using an item.
     * @param {Object} options Options to pass to the attack roll
     *
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     *
     * @returns {Promise<RollResult?>}
     */
    async _rollStarshipAttack(options = {}) {
        let parts = [];
        if (this.actor.system.crew.useNPCCrew) { // If NPC, use the gunnery skill bonus
            parts = ["@gunner.skills.gun.mod"];
        } else if (this.system.weaponType === "ecm") { // If the weapon is an ECM weapon and not an NPC, use Computers ranks + Int (NPC ECM weapons still use gunnery)
            parts = ["@scienceOfficer.skills.com.ranks", "@scienceOfficer.abilities.int.mod"];
        } else { // If not an ECM weapon and not an NPC, use BAB/Piloting + Dex
            parts = ["max(@gunner.attributes.baseAttackBonus.value, @gunner.skills.pil.ranks)", "@gunner.abilities.dex.mod"];
        }
        const title = game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        // If max capacity is 0, assume the item doesn't have limited fire property
        if (this.hasCapacity && this.getCurrentCapacity() <= 0 && this.getMaxCapacity() > 0) {
            ui.notifications.warn(game.i18n.format("SFRPG.StarshipSheet.Weapons.NoCapacity"));
            return false;
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.system);
        rollContext.addContext("weapon", this, this.system);
        rollContext.addTargetContext();
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner", "scienceOfficer"]);

        /** Create additional modifiers. */
        const additionalModifiers = [
            {bonus: {_id: "ComputerBonus", name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: `${this.actor.system?.attributes?.computer?.value ?? 0}`, enabled: false} },
            {bonus: {_id: "CaptainDemand", name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "4", enabled: false} },
            {bonus: {_id: "CaptainEncouragement", name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "2", enabled: false} },
            {bonus: {_id: "ScienceOfficerLockOn", name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "2", enabled: false} },
            {bonus: {_id: "SnapShot", name: game.i18n.format("SFRPG.Rolls.Starship.SnapShot"), modifier: "-2", enabled: false} },
            {bonus: {_id: "FireAtWill", name: game.i18n.format("SFRPG.Rolls.Starship.FireAtWill"), modifier: "-4", enabled: false} },
            {bonus: {_id: "Broadside", name: game.i18n.format("SFRPG.Rolls.Starship.Broadside"), modifier: "-2", enabled: false} }
        ];

        const attackBonus = parseInt(this.system.attackBonus);
        if (attackBonus) parts.push("@item.attackBonus");

        rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");

        const rollOptions = {};

        if (this.system.actionTarget) {
            rollOptions.actionTarget = this.system.actionTarget;
            rollOptions.actionTargetSource = SFRPG.actionTargetsStarship;
        }

        const quadrant = this.system.mount.arc.charAt(0).toUpperCase() + this.system.mount.arc.slice(1);
        if (this.actor.system?.attributes?.systems[`weaponsArray${quadrant}`]?.mod < 0) {
            parts.push(`@ship.attributes.systems.weaponsArray${quadrant}.mod`);
        }
        if (this.actor.system?.attributes?.systems?.powerCore?.modOther < 0) {
            parts.push(`@ship.attributes.systems.powerCore.modOther`);
        }

        return DiceSFRPG.d20Roll({
            skipUI: game.settings.get('sfrpg', 'useQuickRollAsDefault') ? !options.event?.shiftKey : options.event?.shiftKey,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            rollCriteria: SFRPGRoll.createRollCriteria("gunnery", rollOptions),
            actorContextKey: "gunner",
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage(options.event);
                    }

                    if (this.hasCapacity && !options.disableDeductAmmo && this.getMaxCapacity() > 0) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    /**
     * Place an attack roll for a vehicle using an item.
     * @param {Object} options Options to pass to the attack roll
     * @returns {Promise<RollResult?>}
     */
    async _rollVehicleAttack(options = {}) {

        // TODO: Take vehicle's negative attack modifiers
        const parts = [];

        const title = game.i18n.format("SFRPG.Rolls.AttackRollFull", {name: this.name});

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.addTargetContext();
        rollContext.setMainContext("");

        return DiceSFRPG.d20Roll({
            skipUI: game.settings.get('sfrpg', 'useQuickRollAsDefault') ? !options.event?.shiftKey : options.event?.shiftKey,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            rollCriteria: SFRPGRoll.createRollCriteria("attack"),
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage(options.event);
                    }

                    if (this.hasCapacity && !options.disableDeductAmmo) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", {actor: this.actor, item: this, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * Place a damage roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.damageRoll logic for the core implementation
     *
     * @param   {Event}         [event]     The triggering event
     * @param   {Object}        [options]   Options for the damage roll
     * @returns {Promise<bool>}             `true` if roll was performed, `false` if it was canceled
     */
    async rollDamage(event = new Event(""), options = {}) {

        // Verify we can make a damage roll
        if (!this.hasDamage) {
            ui.notifications.error("You may not make a Damage Roll with this Item.");
            return;
        }

        if (this.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });
        if (this.type === "vehicleAttack") return this._rollVehicleDamage({ event: event});

        const isHealing = this.system.actionType === "heal";

        // Determine ability score modifier
        let abl = this.system.ability;
        if (!abl && (this.type === "spell")) abl = this.actor?.attributes.spellcasting || "int";
        else if (!abl) abl = "str";

        // Create an array for additional modifiers (available for enabling/disabling in the roll dialog)
        const additionalModifiers = [];

        // Damage penalty for archaic weapons
        if (this.system.properties?.archaic?.value && this.isWeapon) {
            additionalModifiers.push({bonus: { name: game.i18n.format("SFRPG.WeaponPropertiesArchaic"), modifier: "-5", enabled: true, notes: game.i18n.format("SFRPG.WeaponPropertiesArchaicTooltip") } });
        }

        const stackedModifiers = await new StackModifiers().processAsync(
            this.relevantModifiers.damage,
            null,
            {actor: this.actor}
        );

        // Get damage parts and indicate that they're formatted as damage sections
        const damageParts = foundry.utils.deepClone(this.system.damage.parts);
        for (const part of damageParts) part.isDamageSection = true;

        // Parse the relevant modifiers into damage parts or additionalModifiers
        for (const modifierType of Object.values(stackedModifiers)) {
            for (const modifier of modifierType) {
                if (modifier.modifierType === "damageSection") {
                    damageParts.push({
                        isDamageSection: true,
                        enabled: modifier.enabled,
                        name: modifier.name,
                        explanation: modifier.name,
                        formula: modifier.modifier,
                        types: modifier?.damage?.damageTypes,
                        group: modifier?.damage?.damageGroup
                    });
                } else if (modifier.modifierType === "formula") {
                    additionalModifiers.push({bonus: modifier});
                } else {
                    damageParts.push({ formula: modifier.modifier, explanation: modifier.name });
                }
            }
        }

        // Set up rollContexts
        const rollContext = RollContext.createItemRollContext(this, this.actor, {itemData: this.system});
        if (additionalModifiers.length > 0) {
            rollContext.addContext("additional", {name: "additional"}, {modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
            damageParts.push({ formula: "@additional.modifiers.bonus" });
        }

        // Call the roll helper utility
        return DiceSFRPG.damageRoll({
            damageParts,
            rollContext: rollContext,
            rollCriteria: SFRPGRoll.createRollCriteria(isHealing ? "healing" : "damage"),
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            criticalDamageData: this.system.critical,
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            flavor: await foundry.applications.ux.TextEditor.enrichHTML(options?.flavorOverride || this.system.chatFlavor, {
                async: true,
                rollData: this.actor.getRollData() ?? {},
                secrets: this.isOwner
            }) || null,
            linkedAttackRoll: options.linkedAttackRoll ?? null,
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            },
            skipUI: options.skipUI || game.settings.get('sfrpg', 'useQuickRollAsDefault') ? !event?.shiftKey : event?.shiftKey,
            title: isHealing ? game.i18n.format("SFRPG.Rolls.HealingRollFull", {name: this.name}) : game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name})
        });
    }

    async _rollVehicleDamage({ event } = {}, options = {}) {

        if (!this.hasDamage) {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleAttackSheet.Errors.NoDamage"));
        }

        const parts = foundry.utils.deepClone(this.system.damage.parts);
        for (const part of parts) {
            part.isDamageSection = true;
        }

        const title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("vehicle", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.setMainContext("");

        return DiceSFRPG.damageRoll({
            damageParts: parts,
            rollContext,
            rollCriteria: SFRPGRoll.createRollCriteria("damage"),
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            },
            skipUI: true,
            title
        });
    }

    async _rollStarshipDamage({ event } = {}, options = {}) {

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = foundry.utils.deepClone(this.system.damage.parts);
        for (const part of parts) {
            part.isDamageSection = true;
        }

        const title = game.i18n.format("SFRPG.Rolls.DamageRollFull", {name: this.name});

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this);
        rollContext.addContext("weapon", this, this);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        return DiceSFRPG.damageRoll({
            damageParts: parts,
            rollContext: rollContext,
            rollCriteria: SFRPGRoll.createRollCriteria("damage"),
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            criticalDamageData: {preventDoubling: true},
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", {actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: options?.rollMetadata});
                }
            },
            skipUI: options.skipUI || game.settings.get('sfrpg', 'useQuickRollAsDefault') ? !event?.shiftKey : event?.shiftKey,
            title: title
        });
    }

    /* -------------------------------------------- */

    /**
     * A helper method to call the useSpell method on the item's actor
     */
    async useSpell({ configureDialog = true } = {}) {
        if (this.type !== "spell") throw new Error("Item#UseSpell must be used on a spell item!");
        if (!this.actor) throw new Error("The item must be on an actor to cast it!");
        return this.actor.useSpell(this, { configureDialog });
    }

    /* -------------------------------------------- */

    /**
     * Place an roll using an item based on an "Other Formula"
     * Rely upon the DiceSFRPG.createRoll logic for the core implementation
     */
    async rollFormula(options = {}) {
        if (!this.system.formula) {
            throw new Error("This Item does not have a formula to roll!");
        }

        // Define Roll Data
        const title = game.i18n.localize(`SFRPG.Items.Action.OtherFormula`);
        const {roll, formula} = await DiceSFRPG.createRoll({
            chatMessage: false,
            rollContext: RollContext.createItemRollContext(this, this.actor, {itemData: this.system}),
            rollCriteria: SFRPGRoll.createRollCriteria("roll", { mainDie: "1d20" }),
            rollFormula: this.system.formula,
            title: title
        });

        if (!roll) return;

        const preparedRollExplanation = DiceSFRPG.formatExplanation(formula.formula);
        const content = await roll.render({ breakdown: preparedRollExplanation });

        ChatMessageSFRPG.create({
            flavor: `${title}${(this.system.chatFlavor ? " - " + this.system.chatFlavor : "")}`,
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            chatMessage: options.chatMessage,
            content: content,
            rolls: [roll],
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            sound: CONFIG.sounds.dice
        });
    }

    /* -------------------------------------------- */

    /**
     * Use an item that has charges per use/hour/day etc. or a consumable item.
     */
    async useItem(options = {}) {
        const addCapacity = options?.event?.altKey;
        const overrideUsage = !!options?.event?.ctrlKey;
        const overrideChatCard = !!options?.event?.shiftKey;

        let sufficientCapacity = overrideUsage;
        if (this.hasCapacity) {
            sufficientCapacity = this.getCurrentCapacity() >= (this.system.usage?.value ?? this.system.uses?.value);
        }

        if (!sufficientCapacity && !addCapacity) {
            ui.notifications.error(game.i18n.format("SFRPG.Items.Consumable.ErrorNoUses", {name: this.name}));
            return;
        }

        if (!addCapacity && this.type === "consumable" && this.system.actionType) {
            options.flavorOverride = game.i18n.format("SFRPG.Items.Consumable.UseChatMessage", {consumableName: this.name});

            // Roll damage/attack or place template if needed. Do this here for the case where the item is consumed on use.
            if (this.hasAttack) {
                options.skipUI = overrideChatCard;
                const rolled = await this.rollAttack(options);
                if (!rolled) return; // Roll was cancelled, don't consume.
            }
            if (this.hasDamage) {
                options.skipUI = overrideChatCard;
                const rolled = await this.rollDamage(options.event, options);
                if (!rolled) return; // Roll was cancelled, don't consume.
            }
            if (this.hasArea && ["ft", "meter"].includes(this.system.area.units) && !["", "other"].includes(this.system.area.shape)) {
                const placed = await this.placeAbilityTemplate();
                if (!placed) return; // Roll was cancelled, don't consume.
            }
        } else if (!overrideChatCard) {
            const htmlOptions = { secrets: this.actor?.isOwner || true, rollData: this };
            htmlOptions.rollData.owner = this.actor?.system;

            // Basic template rendering data
            const token = this.actor.token;
            const templateData = {
                actor: this.actor,
                tokenId: token ? `${token.parent.id}.${token.id}` : null,
                item: this,
                labels: this.labels,
                hasSave: !addCapacity && this.hasSave,
                hasArea: !addCapacity && this.hasArea,
                hasOtherFormula: !addCapacity && this.hasOtherFormula,
                action: addCapacity ? "SFRPG.ChatCard.ItemActivation.AddCapacity" : "SFRPG.ChatCard.ItemActivation.UseCapacity",
                cost: overrideUsage ? "None" : this.system.usage?.value ?? this.system.uses?.value
            };

            const template = `systems/sfrpg/templates/chat/item-action-card.hbs`;
            const renderPromise = foundry.applications.handlebars.renderTemplate(template, templateData);
            renderPromise.then((html) => {
                // Create the chat message
                const chatData = {
                    type: CONST.CHAT_MESSAGE_STYLES.OTHER,
                    speaker: token ? ChatMessageSFRPG.getSpeaker({token: token}) : ChatMessageSFRPG.getSpeaker({actor: this.actor}),
                    content: html
                };

                const rollMode = game.settings.get("core", "rollMode");
                ChatMessageSFRPG.applyRollMode(chatData, rollMode);
                ChatMessageSFRPG.create(chatData, { displaySheet: false });
            });
        }

        if (addCapacity) {
            // Instead of activating the item, add charges to it
            this.increaseCapacity(this.type === "consumable" ? 1 : this.system.usage.value);
        } else if (!overrideUsage) {
            // Deduct consumed charges from the item
            this.consumeCapacity(this.type === "consumable" ? 1 : this.system.usage.value);
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform an ability recharge test for an item which uses the d6 recharge mechanic
     */
    async rollRecharge() {
        const data = this.system;
        if (!data.recharge.value) return;

        // Roll the check
        const rollObject = Roll.create("1d6");
        const roll = await rollObject.evaluate();
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const rollMode = game.settings.get("core", "rollMode");
        const chatData = {
            author: game.user.id,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
            whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessageSFRPG.getWhisperRecipients("GM") : null,
            blind: rollMode === "blindroll",
            rolls: [roll],
            speaker: ChatMessageSFRPG.getSpeaker({
                actor: this.actor,
                alias: this.actor.name
            })
        };

        // Update the Item data
        const promises = [ChatMessageSFRPG.create(chatData)];
        if (success) promises.push(this.update({ "system.recharge.charged": true }));
        return Promise.all(promises);
    }

    /**
     * Add a modifier to this actor.
     *
     * @param {Object}        data               The data needed to create the modifier
     * @param {String}        data.name          The name of this modifier. Used to identify the modfier.
     * @param {Number|String} data.modifier      The modifier value.
     * @param {String}        data.type          The modifiers type. Used to determine stacking.
     * @param {String}        data.modifierType  Used to determine if this modifier is a constant value (+2) or a Roll formula (1d4).
     * @param {String}        data.effectType    The category of things that might be effected by this modifier.
     * @param {String}        data.subtab        What subtab should this modifier show under on the character sheet.
     * @param {String}        data.valueAffected The specific value being modified.
     * @param {Boolean}       data.enabled       Is this modifier activated or not.
     * @param {String}        data.source        Where did this modifier come from? An item, ability or something else?
     * @param {String}        data.notes         Any notes or comments about the modifier.
     * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
     * @param {?String}   data.id            Override the randomly generated id with this.
     */
    async addModifier({
        name = "",
        modifier = 0,
        type = SFRPGModifierTypes.UNTYPED,
        modifierType = SFRPGModifierType.CONSTANT,
        effectType = SFRPGEffectType.SKILL,
        subtab = "misc",
        valueAffected = "",
        enabled = this.system?.enabled ?? true, // New modifiers on effects should match enabled state.
        source = "",
        notes = "",
        condition = "",
        id = null,
        limitTo = "",
        damage = null
    } = {}) {

        const modifiers = this.system.modifiers;
        modifiers.push({
            name,
            modifier,
            type,
            modifierType,
            effectType,
            valueAffected,
            enabled,
            source,
            notes,
            subtab,
            condition,
            id,
            limitTo,
            damage
        });
        console.log("Adding a modifier to the item");
        await this.update({["system.modifiers"]: modifiers});
    }

    static async _onScalingCantripsSettingChanges(setting) {
        const d3scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
        const d6scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0))";
        const npcd3scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d((ternary(gte(@details.cr,7),4,3)))+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";
        const npcd6scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

        let count = 0;
        let actorCount = 0;

        const promises = [];

        for (const actor of game.actors.contents) {
            const isNPC = ['npc', 'npc2'].includes(actor.type);

            let updates = [];
            const params = actor.items.filter(i => i.system.scaling?.d3 || i.system.scaling?.d6);
            if (params.length > 0) {
                updates = params.map( (currentValue) => {
                    return {
                        _id: currentValue.id,
                        "system.damage.parts": currentValue.system.damage.parts,
                        scaling: currentValue.system.scaling
                    };
                });

                for (const currentValue of updates) {
                    if (currentValue.scaling.d3) {
                        const parts = currentValue['system.damage.parts'];
                        for (const i of parts) {
                            if (setting) {
                                if (isNPC) {
                                    i.formula = npcd3scaling;
                                } else {
                                    i.formula = d3scaling;
                                }
                            } else {
                                i.formula = "1d3";
                            }
                        }
                    } else if (currentValue.scaling.d6) {
                        const parts = currentValue['system.damage.parts'];
                        for (const i of parts) {
                            if (setting) {
                                if (isNPC) {
                                    i.formula = npcd6scaling;
                                } else {
                                    i.formula = d6scaling;
                                }
                            } else {
                                i.formula = "1d6";
                            }
                        }
                    }

                    delete currentValue.scaling;
                }

                promises.push(actor.updateEmbeddedDocuments("Item", updates));
                count += params.length;
                actorCount++;
            }
        }

        await Promise.allSettled(promises);
        const message = `Starfinder | Updated ${count} spells to use ${(setting) ? "scaling" : "default"} formulas on ${actorCount} actors.`;
        ui.notifications.info(message);
    }

    static _onScalingCantripDrop(item, targetActor) {
        const isNPC = ['npc', 'npc2'].includes(targetActor.actor.type);
        const { parts } = item.system.damage;

        if (item.system.scaling?.d3) {
            const d3scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d(ternary(gte(@details.cl.value,7),4,3))+ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0)";
            const npcd3scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d((ternary(gte(@details.cr,7),4,3)))+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

            parts.forEach(i => i.formula = (isNPC) ? npcd3scaling : d3scaling);

            console.log(`Starfinder | Updated ${item.name} to use the ${ (isNPC) ? 'NPC ' : ""}d3 scaling formula.`);

        } else if (item.system.scaling?.d6) {
            const d6scaling = "(lookupRange(@details.cl.value,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cl.value,3),floor(@details.level.value/2),0))";
            const npcd6scaling = "(lookupRange(@details.cr,1,7,2,10,3,13,4,15,5,17,7,19,9))d6+(ternary(gte(@details.cr,3),floor(@details.cr/2),0))";

            parts.forEach(i => i.formula = (isNPC) ? npcd6scaling : d6scaling);

            console.log(`Starfinder | Updated ${item.name} to use the ${ (isNPC) ? "NPC " : ""}d6 scaling formula.`);
        }
    }

    /**
     * Turn Events
     * The following functions are run when appropriate by the GM.
     */

    _onTurnStart() {
        if (this.type !== "effect" || !this.system.enabled) return;

        for (const turnEvent of this.system.turnEvents) {
            if (turnEvent.trigger !== "onTurnStart") continue;

            this._handleTurnEvent(turnEvent);

        }

    }

    _onTurnEnd() {
        if (this.type !== "effect" || !this.system.enabled) return;

        for (const turnEvent of this.system.turnEvents) {
            if (turnEvent.trigger !== "onTurnEnd") continue;

            this._handleTurnEvent(turnEvent);
        }

    }

    _handleTurnEvent(turnEvent) {
        switch (turnEvent.type) {
            case "note":
                this._handleEffectNoteEvent(turnEvent);
                break;
            case "roll":
                this._handleEffectRollEvent(turnEvent);
                break;
        }
    }

    _handleEffectNoteEvent(turnEvent) {
        ChatMessageSFRPG.create({
            content: turnEvent.content,
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor })
        });
    }

    async _handleEffectRollEvent(turnEvent) {
        if (!turnEvent.formula) return;

        const damageParts = [{
            isDamageSection: true,
            enabled: true,
            formula: turnEvent.formula,
            types: turnEvent.damageTypes,
            group: null
        }];

        return DiceSFRPG.damageRoll({
            damageParts,
            rollContext: RollContext.createItemRollContext(this, this.actor),
            rollCriteria: SFRPGRoll.createRollCriteria("damage"),
            speaker: ChatMessageSFRPG.getSpeaker({ actor: this.actor }),
            skipUI: true,
            title: turnEvent.name || this.name
        });
    }

    /**
     * Execute a macro with the context of this item
     * @param {foundry.documents.Macro} macro The macro to execute
     * @param {Record<string, *>} scope Any additional arguments to pass to macro execution
     * @returns {Promise<unknown>} The return value of the macro
     */
    async executeMacroWithContext(macro, scope = {}) {
        if (!(macro instanceof foundry.documents.Macro)) {
            ui.notifications.error("A macro was not provided!");
            return;
        }

        return macro.execute({
            speaker: foundry.documents.ChatMessage.implementation.getSpeaker({ actor: this.actor, token: this.actor.token }),
            token: this.actor.token || null,
            actor: this.actor || null,
            item: this,
            ...scope
        });
    }
}
