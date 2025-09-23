import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemWeaponAccessory extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.WeaponAccessory'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
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
