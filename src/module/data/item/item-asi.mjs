import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemASI extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.ASI'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // No templates needed for this item type

        // ASI-specific properties
        foundry.utils.mergeObject(schema, {
            abilities: new fields.ObjectField() // TODO-Ian: detail this field properly
        });

        return schema;
    }
}
