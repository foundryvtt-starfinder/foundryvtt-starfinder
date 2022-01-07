import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../modifiers/types.js";
import SFRPGModifier from "../../modifiers/modifier.js";
import SFRPGModifierApplication from "../../apps/modifier-app.js";
import { getItemContainer } from "../actor-inventory-utils.js"

export const ActorModifiersMixin = (superclass) => class extends superclass {

    /**
     * Check to ensure that this actor has a modifiers data object set, if not then set it. 
     * These will always be needed from hence forth, so we'll just make sure that they always exist.
     * 
     * @param {Object}      data The actor data to check against.
     * @param {String|Null} prop A specific property name to check.
     * 
     * @returns {Object}         The modified data object with the modifiers data object added.
     */
    _ensureHasModifiers(data, prop = null) {
        if (!hasProperty(data, "modifiers")) {
            //console.log(`Starfinder | ${this.name} does not have the modifiers data object, attempting to create them...`);
            data.modifiers = [];
        }

        return data;
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
     * @param {String|null}   data.id            Override the randomly generated id with this.
     */
     async addModifier({
        name = "", 
        modifier = 0, 
        type = SFRPGModifierTypes.UNTYPED, 
        modifierType = SFRPGModifierType.CONSTANT, 
        effectType = SFRPGEffectType.SKILL,
        subtab = "misc",
        valueAffected = "", 
        enabled = true, 
        source = "", 
        notes = "",
        condition = "",
        id = null
    } = {}) {
        const data = this._ensureHasModifiers(duplicate(this.data.data));
        const modifiers = data.modifiers;

        modifiers.push(new SFRPGModifier({
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
            id
        }));

        await this.update({["data.modifiers"]: modifiers});
    }

    /**
     * Delete a modifier for this Actor.
     * 
     * @param {String} id The id for the modifier to delete
     */
    async deleteModifier(id) {
        const modifiers = this.data.data.modifiers.filter(mod => mod._id !== id);
        
        await this.update({"data.modifiers": modifiers});
    }

    /**
     * Edit a modifier for an Actor.
     * 
     * @param {String} id The id for the modifier to edit
     */
    editModifier(id) {
        const modifiers = duplicate(this.data.data.modifiers);
        const modifier = modifiers.find(mod => mod._id === id);

        new SFRPGModifierApplication(modifier, this).render(true);
    }

    /**
     * Returns an array of all modifiers on this actor. This will include items such as equipment, feat, classes, race, theme, etc.
     * 
     * @param {Boolean} ignoreTemporary Should we ignore temporary modifiers? Defaults to false.
     * @param {Boolean} ignoreEquipment Should we ignore equipment modifiers? Defaults to false.
     */
    getAllModifiers(ignoreTemporary = false, ignoreEquipment = false) {
        let allModifiers = this.data.data.modifiers.filter(mod => {
            return (!ignoreTemporary || mod.subtab === "permanent");
        });

        for (const actorModifier of allModifiers) {
            actorModifier.container = {actorId: this.id, itemId: null};
        }

        for (const item of this.data.items) {
            const itemData = item.data.data;
            const itemModifiers = itemData.modifiers;

            let modifiersToConcat = [];
            switch (item.type) {
                // Armor upgrades are only valid if they are slotted into an equipped armor
                case "upgrade":
                    {
                        if (!ignoreEquipment) {
                            const container = getItemContainer(this.data.items, item);
                            if (container && container.type === "equipment" && container.data.data.equipped) {
                                modifiersToConcat = itemModifiers;
                            }
                        }
                        break;
                    }

                // Weapon upgrades (Fusions and accessories) are only valid if they are slotted into an equipped weapon
                case "fusion":
                case "weaponAccessory":
                    {
                        if (!ignoreEquipment) {
                            const container = getItemContainer(this.data.items, item);
                            if (container && container.type === "weapon" && container.data.data.equipped) {
                                modifiersToConcat = itemModifiers;
                            }
                        }
                        break;
                    }

                // Feats are only active when they are passive, or activated
                case "feat":
                    if (itemData.activation?.type === "" || itemData.isActive) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;

                // Special handling for equipment, shield, and weapon
                case "equipment":
                case "shield":
                case "weapon":
                    if (!ignoreEquipment && itemData.equipped) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;

                case "actorResource":
                    if (itemData.enabled && itemData.type && itemData.subType && (itemData.base || itemData.base === 0)) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;

                // Everything else
                default:
                    if (!itemData.equippable || itemData.equipped) {
                        modifiersToConcat = itemModifiers;
                    }
                    break;
            }

            if (modifiersToConcat && modifiersToConcat.length > 0) {
                for (const itemModifier of modifiersToConcat) {
                    itemModifier.container = {actorId: this.id, itemId: item.id};
                }

                allModifiers = allModifiers.concat(modifiersToConcat);
            }
        }
        return allModifiers;
    }
}
