import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemUpgrade extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Upgrade'
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
