import { SFRPGModifierTypes, SFRPGModifierType, SFRPGEffectType } from "./types.js";
import { generateUUID } from '../utilities.js';

/**
 * A data object that hold information about a specific modifier.
 * 
 * @param {Object}        data               The data for the modifier.
 * @param {String}        data.name          The name for the modifier. Only useful for identifiying the modifier.
 * @param {Number|String} data.modifier      The value to modify with. This can be either a constant number or a Roll formula.
 * @param {String}        data.type          The modifier type. This is used to determine if a modifier stacks or not.
 * @param {String}        data.modifierType  Determines if this modifer is a constant value (+2) or a roll formula (1d4).
 * @param {String}        data.effectType    The category of things that might be modified by this value.
 * @param {String}        data.valueAffected The specific statistic being affected.
 * @param {Boolean}       data.enabled       Is this modifier enabled or not.
 * @param {String}        data.source        Where does this modifier come from? An item, or an ability?
 * @param {String}        data.notes         Any notes that are useful for this modifer.
 * @param {String}        data.subtab        What subtab should this appear on in the character sheet?
 * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
 * @param {String|null}   data.id            Override a random id with a specific one.
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
        id = null
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

        let roll = new Roll(modifier.toString()).evaluate({maximize: true});
        this.max = roll.total;

        this._id = id ?? generateUUID();
    }
}
