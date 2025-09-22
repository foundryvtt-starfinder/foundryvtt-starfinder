import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemWeaponAccessory extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.WeaponAccessory'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemAttributesTemplate(),
            ...SFRPGItemBase.physicalItemBasicsTemplate()
        });

        // Weapon Accessory-specific properties
        foundry.utils.mergeObject(schema, {
            weaponType: new fields.StringField({
                initial: "any",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.weaponAccessoriesSupportedTypes),
                label: "SFRPG.Items.WeaponAccessory.WeaponTypeLabel"
            })
        });

        // No initial value changes needed

        return schema;
    }
}
