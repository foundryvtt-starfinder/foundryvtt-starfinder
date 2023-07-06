import { generateUUID } from '../utils/utilities.js';
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "./types.js";

/**
 * A data object that hold information about a specific modifier.
 *
 * @param {Object}        data               The data for the modifier.
 * @param {String}        data.name          The name for the modifier. Only useful for identifying the modifier.
 * @param {Number|String} data.modifier      The value to modify with. This can be either a constant number or a Roll formula.
 * @param {String}        data.type          The modifier type. This is used to determine if a modifier stacks or not.
 * @param {String}        data.modifierType  Determines if this modifier is a constant value (+2) or a roll formula (1d4).
 * @param {String}        data.effectType    The category of things that might be modified by this value.
 * @param {String}        data.valueAffected The specific statistic being affected.
 * @param {Boolean}       data.enabled       Is this modifier enabled or not.
 * @param {String}        data.source        Where does this modifier come from? An item, or an ability?
 * @param {String}        data.notes         Any notes that are useful for this modifier.
 * @param {String}        data.subtab        What subtab should this appear on in the character sheet?
 * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
 * @param {String|null}   data.id            Override a random id with a specific one.
 * @param {Object|null}   data.container     The UUIDs of the actor and item, if applicable, the modifier is owned by.
 * @param {Object|null}   data.damage        If this modifier is a damage section modifier, the damage type and group
 * @param {String}        data.limitTo       If this modifier is on an item, should the modifier affect only that item?
 *
 * @param {Object}        options            Options to configure this modifier
 * @param {Boolean}       includeContainer   Whether the this modifier should include container information. True during data prep.
 */
export default class SFRPGModifier {
    constructor({
        name = "",
        modifier = 0,
        type = SFRPGModifierTypes.UNTYPED,
        modifierType = SFRPGModifierType.CONSTANT,
        effectType = SFRPGEffectType.SKILL,
        valueAffected = "",
        enabled = true,
        source = "",
        notes = "",
        subtab = "misc",
        condition = "",
        id = null,
        container = null,
        damage = null,
        limitTo = ""
    } = {}, {
        includeContainer = false
    } = {}) {
        this.name = name;
        this.modifier = modifier;
        this.type = type;
        this.effectType = effectType;
        this.valueAffected = valueAffected;
        this.enabled = enabled;
        this.source = source;
        this.notes = notes;
        this.modifierType = modifierType;
        this.condition = condition;
        this.subtab = subtab;

        if (damage) this.damage = damage;
        if (limitTo) this.limitTo = limitTo;
        if (includeContainer && container) this.container = container;

        const roll = Roll.create(modifier.toString()).evaluate({maximize: true});
        this.max = roll.total;

        this._id = id ?? generateUUID();
    }

    get actor() {
        return fromUuidSync(this.container.actorUuid);
    }

    get item() {
        return fromUuidSync(this.container.itemUuid);
    }

    get token() {
        return fromUuidSync(this.container.tokenUuid);
    }

    get primaryOwner() {
        return this.item || this.actor;
    }

    get hasDamageSection() {
        return (this.damage && Object.values(this.damage.damageTypes).some(type => !!type)) || false;
    }

}
