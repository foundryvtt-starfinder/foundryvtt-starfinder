import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMagic extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Magic'
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

        // Magic Item-specific properties
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
