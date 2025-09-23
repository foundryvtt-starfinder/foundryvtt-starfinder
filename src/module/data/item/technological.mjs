import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemTechnological extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Technological'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // Consumable-specific properties
        foundry.utils.mergeObject(schema, {
            hands: new fields.NumberField({
                initial: 0,
                nullable: false,
                required: true,
                label: "SFRPG.Items.Description.Hands"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
