import { StarfinderModifierTypes, StarfinderModifierType, StarfinderEffectType } from "./types.js";

/**
 * A data object that hold information about a specific modifier.
 * 
 * @param {String}        name          The name for the modifier. Only useful for identifiying the modifier.
 * @param {Number|String} modifier      The value to modify with. This can be either a constant number or a Roll formula.
 * @param {String}        type          The modifier type. This is used to determine if a modifier stacks or not.
 * @param {String}        modifierType  Determines if this modifer is a constant value (+2) or a roll formula (1d4).
 * @param {String}        effectType    The category of things that might be modified by this value.
 * @param {String}        valueAffected The specific statistic being affected.
 * @param {Boolean}       enabled       Is this modifier enabled or not.
 * @param {String}        source        Where does this modifier come from? An item, or an ability?
 * @param {String}        notes         Any notes that are useful for this modifer.
 */
export default class StarfinderModifier {
    constructor({
        name = "", 
        modifier = "0", 
        type = StarfinderModifierTypes.UNTYPED, 
        modifierType = StarfinderModifierType.CONSTANT, 
        effectType = StarfinderEffectType.SKILL, 
        valueAffected = "", 
        enabled = true, 
        source = "", 
        notes = ""
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

        this.deleted = false;
    }
}
