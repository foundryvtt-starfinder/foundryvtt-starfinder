import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemAmmunition extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Ammunition'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.physicalItemBasicsTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate()
        });

        // Ammunition-specific properties
        foundry.utils.mergeObject(schema, {
            ammunitionType: new fields.StringField({
                initial: "",
                choices: ["", ...Object.keys(CONFIG.SFRPG.ammunitionTypes)],
                blank: true,
                required: true,
                label: "SFRPG.Items.Ammunition.AmmunitionType"
            }),
            attributes: new fields.SchemaField({
                customBuilt: new fields.BooleanField({
                    initial: false
                }),
                dex: new fields.SchemaField({
                    mod: new fields.StringField({
                        initial: "-5",
                        blank: true,
                        required: true
                    })
                }),
                size: new fields.StringField({
                    initial: "medium",
                    required: true,
                    choices: Object.keys(CONFIG.SFRPG.itemSizes)
                }),
                sturdy: new fields.BooleanField({
                    initial: false
                })
            }),
            capacity: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: true
                })
            }, {label: "SFRPG.Items.Capacity.Capacity"}),
            identified: new fields.BooleanField({initial: true}),
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
