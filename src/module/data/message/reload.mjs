import SFRPGDocumentBase from "../base-document.mjs";
import SFRPGMessageBase from "./base-message.mjs";

const { fields } = foundry.data;

export default class SFRPGMessageReload extends SFRPGMessageBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // Damage message-specific properties
        foundry.utils.mergeObject(schema, {
            actionType: new fields.StringField({
                blank: true,
                initial: ""
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
