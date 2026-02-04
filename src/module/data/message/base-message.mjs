import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGChatMessageBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = {};

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

        // TODO: Eventually, add more detail to this
        schema.damage = new fields.ObjectField();

        schema.descriptors = new fields.TypedObjectField(
            new fields.BooleanField({initial: false}),
            {validateKey: (key) => key in CONFIG.SFRPG.descriptors}
        );

        schema.hasMagicDamage = new fields.SchemaField({
            value: new fields.BooleanField({
                initial: false,
                nullable: true
            })
        });

        // TODO: Eventually, add more detail to this
        schema.rollOptions = new fields.ObjectField();

        schema.rollSuccess = new fields.BooleanField({
            initial: null,
            nullable: true
        });

        schema.rollType = new fields.StringField({
            initial: "none",
            choices: Object.keys(CONFIG.SFRPG.rollTypes)
        });

        schema.tags = new fields.TypedObjectField(
            new fields.SchemaField(SFRPGChatMessageBase._tagData())
        );

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGDocumentBase.specialMaterialsTemplate()
        });
        return schema;
    }

    static _tagData() {
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
