import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemAmmunition extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Ammunition'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.physicalItemTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate()
        });

        // Ammunition-specific properties
        foundry.utils.mergeObject(schema, {
            ammunitionType: new fields.StringField({
                initial: "",
                choices: ["", ...Object.keys(CONFIG.SFRPG.ammunitionTypes)],
                blank: "",
                required: true,
                label: "SFRPG.Items.Ammunition.AmmunitionType"
            }),
            useCapacity: new fields.BooleanField({
                required: true,
                initial: false,
                label: "SFRPG.Items.Ammunition.UseCapacity"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
