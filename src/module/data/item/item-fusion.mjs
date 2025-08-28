import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemFusion extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Fusion'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // Consumable-specific properties
        foundry.utils.mergeObject(schema, {
            level: new fields.NumberField({
                initial: 1,
                nullable: false,
                required: true,
                label: "SFRPG.LevelLabelText"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
