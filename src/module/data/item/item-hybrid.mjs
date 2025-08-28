import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemHybrid extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Hybrid'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // Consumable-specific properties
        foundry.utils.mergeObject(schema, {
            hands: new fields.NumberField({
                initial: 0,
                nullable: false,
                required: true,
                label: "SFRPG.Items.Description.Hands"
            }),
            limitedWear: new fields.BooleanField({
                required: true,
                initial: false,
                label: "SFRPG.Items.Magic.LimitedWearCheckbox"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
