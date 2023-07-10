import { generateUUID } from "../utils/utilities.js";
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
 */
export default class SFRPGModifier extends foundry.abstract.DataModel {
    constructor(data, options = {}) {
        super(data, options);
    }

    _initializeSource(source, options = {}) {
        // Create a random id, or set the specific one if provided.
        source._id ||= source.id || generateUUID();

        return super._initializeSource(source, (options = {}));
    }

    // Slight hack to keep modifiers on the database or exported to JSON minimal and clean.
    toObject(source = true) {
        if (source) {
            const obj = deepClone(this._source);
            delete obj.container;
            if (!this.constructor._hasDamageSection(obj)) delete obj.damage;
            if (!obj.limitTo) delete obj.limitTo;
            return obj;
        }
        return this.schema.toObject(this);
    }

    // Remove empty optional data
    static cleanData(source = {}, options = {}) {
        if (!this._hasDamageSection(source)) source.damage = null;
        if (!source.limitTo) source.limitTo = null;

        return super.cleanData(source, options);
    }

    _initialize(options = {}) {
        super._initialize(options);

        // _id is not a document ID, so we should be able to write to it.
        Object.defineProperty(this, "_id", { value: this._id, writable: true, configurable: true });

        // Calculate max, if not already
        this.max ||= Roll.create(this.modifier.toString()).evaluate({ maximize: true }).total;
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            _id: new fields.StringField({ initial: "", required: true, readonly: false }),
            name: new fields.StringField({
                initial: "New Modifier",
                required: false,
                blank: false,
                label: "SFRPG.ModifierNameLabel",
                hint: "SFRPG.ModifierNameTooltip"
            }),
            modifier: new fields.StringField({
                initial: "0",
                required: true,
                label: "SFRPG.ModifierModifierLabel",
                hint: "SFRPG.ModifierModifierTooltip"
            }),
            max: new fields.NumberField({ initial: 0, integer: true, required: false }),
            type: new fields.StringField({
                initial: SFRPGModifierTypes.UNTYPED,
                required: false,
                choices: Object.values(SFRPGModifierTypes),
                label: "SFRPG.ModifierTypeLabel",
                hint: "SFRPG.ModifierTypeTooltip"
            }),
            modifierType: new fields.StringField({
                initial: SFRPGModifierType.CONSTANT,
                required: true,
                choices: Object.values(SFRPGModifierType).concat("damageSection"),
                label: "SFRPG.ModifierModifierTypeLabel",
                hint: "SFRPG.ModifierModifierTypeTooltip"
            }),
            effectType: new fields.StringField({
                initial: SFRPGEffectType.SKILL,
                required: true,
                choices: Object.values(SFRPGEffectType),
                label: "SFRPG.ModifierEffectTypeLabel",
                hint: "SFRPG.ModifierEffectTypeTooltip"
            }),
            valueAffected: new fields.StringField({
                initial: "",
                required: false,
                blank: true,
                label: "SFRPG.ModifierValueAffectedLabel",
                hint: "SFRPG.ModifierValueAffectedTooltip"
            }),
            enabled: new fields.BooleanField({
                initial: false,
                required: false,
                label: "SFRPG.ModifierEnabledLabel",
                hint: "SFRPG.ModifierEnabledTooltip"
            }),
            source: new fields.StringField({
                initial: "",
                required: false,
                label: "SFRPG.ModifierSourceLabel",
                hint: "SFRPG.ModifierSourceTooltip"
            }),
            notes: new fields.HTMLField({
                initial: "",
                required: false,
                label: "SFRPG.ModifierNotesLabel",
                hint: "SFRPG.ModifierNotesTooltip"
            }),
            subtab: new fields.StringField({
                initial: "misc",
                required: false,
                choices: ["permanent", "temporary", "misc"]
            }),
            condition: new fields.StringField({ initial: "", required: false }),
            container: new fields.SchemaField(
                {
                    actorUuid: new fields.StringField({ initial: null, required: true, nullable: true }),
                    itemUuid: new fields.StringField({ initial: null, required: false, nullable: true }),
                    tokenUuid: new fields.StringField({ initial: null, required: false, nullable: true })
                },
                { nullable: true, required: false }
            ),
            damage: new fields.SchemaField(
                {
                    damageGroup: new fields.NumberField({
                        initial: null,
                        required: false,
                        nullable: true,
                        integer: true
                    }),
                    damageTypes: new fields.SchemaField(
                        [
                            ...Object.keys(CONFIG.SFRPG.energyDamageTypes),
                            ...Object.keys(CONFIG.SFRPG.kineticDamageTypes)
                        ].reduce((obj, type) => {
                            obj[type] = new fields.BooleanField({ initial: false, required: false });
                            return obj;
                        }, {}),
                        { required: false }
                    )
                },
                { required: false, nullable: true }
            ),
            limitTo: new fields.StringField({
                initial: "",
                required: false,
                nullable: true,
                blank: true,
                choices: ["", "parent", "container"],
                label: "SFRPG.ModifierLimitToLabel",
                hint: "SFRPG.ModifierLimitToTooltip"
            })
        };
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
        return this.constructor._hasDamageSection(this);
    }

    static _hasDamageSection(obj) {
        return (obj.damage && Object.values(obj.damage.damageTypes).some(type => !!type)) || false;
    }
}
