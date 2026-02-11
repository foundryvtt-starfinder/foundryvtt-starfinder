import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGMessageBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.buttons = new fields.ArrayField(
            new fields.SchemaField({
                dc: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    integer: true,
                    min: 0
                }),
                subtype: new fields.StringField({
                    initial: "",
                    blank: true,
                    choices: ["", ...Object.keys(CONFIG.SFRPG.abilities), ...Object.keys(CONFIG.SFRPG.saves), ...Object.keys(CONFIG.SFRPG.skills)]
                }),
                type: new fields.StringField({
                    initial: "other",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.chatButtonTypes)
                })
            })
        );

        // TODO: We may want to change this to an array of strings at some point
        schema.rollBreakdown = new fields.StringField({
            initial: "",
            blank: true
        });

        // TODO: Eventually, add more detail to this
        schema.rollCriteria = new fields.ObjectField();

        schema.rollNotes = new fields.StringField({
            initial: "",
            blank: true
        });

        schema.tags = new fields.TypedObjectField(
            new fields.SchemaField(SFRPGMessageBase._tagFieldData())
        );

        return schema;
    }

    static _tagFieldData() {
        return {
            tag: new fields.StringField({
                initial: "",
                blank: ""
            }),
            text: new fields.StringField({
                initial: "",
                blank: ""
            })
        };
    }
}
