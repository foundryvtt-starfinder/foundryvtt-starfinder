import SFRPGModifier from "../modifiers/modifier.js";

const { fields } = foundry.data;

export default class SFRPGDocumentBase extends foundry.abstract.TypeDataModel {

    /** @inheritdoc */
    constructor(data = {}, options = {}) {
        options.fallback = true;
        super(data, options);
    }

    static defineSchema() {
        const schema = {};
        schema.slug = new fields.StringField({
            initial: "",
            blank: true,
            required: false,
            label: "SFRPG.Slug",
            hint: "SFRPG.SlugTooltip"
        });
        return schema;
    }

    static damagePartTemplate() {
        return {
            name: new fields.StringField({initial: null, nullable: true}),
            formula: new fields.StringField({initial: null, nullable: true}),
            types: new fields.SchemaField(
                Object.keys(CONFIG.SFRPG.damageAndHealingTypes).reduce((obj, type) => {
                    obj[type] = new fields.BooleanField({ initial: false, required: false });
                    return obj;
                }, {}),
                { required: false }
            ),
            group: new fields.NumberField({initial: null, min: 0, nullable: true}),
            isPrimarySection: new fields.BooleanField()
        };
    }

    static modifiersTemplate() {
        return {
            modifiers: new fields.ArrayField(
                new fields.EmbeddedDataField(SFRPGModifier),
                {required: true}
            )
        };
    }

    // TODO: Update all speeds to use this version of the template once migrations are implemented
    static _speedFieldData() {
        return {
            land: new fields.SchemaField({
                base: new fields.NumberField({initial: 30, min: 0, required: true})
            }),
            flying: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0, required: true}),
                baseManeuverability: new fields.NumberField({initial: 0, min: 0, required: true})
            }),
            swimming: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0, required: true})
            }),
            burrowing: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0, required: true})
            }),
            climbing: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0, required: true})
            }),
            special: new fields.StringField({initial: "", required: true}),
            mainMovement: new fields.StringField({initial: "land", required: true})
        };
    }

}
