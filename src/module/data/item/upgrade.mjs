import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemUpgrade extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Upgrade'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
            ...SFRPGItemBase.physicalItemAttributesTemplate(),
            ...SFRPGItemBase.physicalItemBasicsTemplate()
        });

        // Upgrade-specific properties
        foundry.utils.mergeObject(schema, {
            allowedArmorType: new fields.StringField({
                initial: "any",
                choices: ["any", ...Object.keys(CONFIG.SFRPG.allowedArmorTypes)],
                blank: false,
                required: true,
                label: "SFRPG.Items.Upgrade.AllowedArmorType"
            }),
            slots: new fields.NumberField({
                initial: 1,
                min: 0,
                nullable: false,
                required: true,
                label: "SFRPG.Items.Upgrade.Slots"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
