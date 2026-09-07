import SFRPGDocumentBase from "../base-document.mjs";
import SFRPGMessageBase from "./base-message.mjs";

const { fields } = foundry.data;

export default class SFRPGMessageReload extends SFRPGMessageBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // Damage message-specific properties
        foundry.utils.mergeObject(schema, {
            activationType: new fields.StringField({
                blank: true,
                initial: ""
            }),
            ammoName: new fields.StringField({
                blank: true,
                initial: ""
            }),
            capacity: new fields.SchemaField({
                current: new fields.NumberField({
                    initial: null,
                    nullable: true
                }),
                total: new fields.NumberField({
                    initial: null,
                    nullable: true
                })
            }),
            description: new fields.StringField({
                blank: true,
                initial: ""
            })
        });

        return schema;
    }

    /** @override */
    prepareTags() {
        const tags = super.prepareTags();

        // Store rendered tags
        return tags;
    }
}
