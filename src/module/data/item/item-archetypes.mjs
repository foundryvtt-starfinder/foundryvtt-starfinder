import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemArchetypes extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Archetypes'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate()
        });

        // No archetype-specific properties

        return schema;
    }
}
