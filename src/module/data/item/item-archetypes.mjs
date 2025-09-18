import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemArchetypes extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Archetypes'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Archetype-specific properties
        foundry.utils.mergeObject(schema, {
            requirements: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.Items.Feat.Requirements"
            })
        });

        return schema;
    }
}
