import { StarfinderModifierTypes } from "./types.js";

export default class StarfinderModifier {
    constructor({name, modifier, type, effectType, valueAffected, enabled = true, source = "", notes = ""} = {}) {
        if (type !== StarfinderModifierTypes.UNTYPED && modifier < 0) {
            throw new RangeError("only untyped penalties are allowed.");
        }

        this.name = name;
        this.modifier = modifier;
        this.type = type;
        this.effectType = effectType;
        this.valueAffected = valueAffected;
        this.enabled = enabled;
        this.source = source;
        this.notes = notes;

        this.deleted = false;
    }
}
