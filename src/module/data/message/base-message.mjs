import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGChatMessageBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = {};
        schema.rollType = new fields.StringField({
            initial: "roll",
            choices: Object.keys(CONFIG.SFRPG.rollTypes)
        });
        return schema;
    }
}
