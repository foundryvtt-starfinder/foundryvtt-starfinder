import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemVehicleAttack extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.VehicleAttack'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Vehicle Attack-specific properties
        foundry.utils.mergeObject(schema, {
            damage: new fields.SchemaField({
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        {required: false, nullable: true}
                    ),
                    {required: true}
                )
            }),
            ignoresHardness: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                nullable: true,
                label: "SFRPG.VehicleAttackSheet.Details.IgnoresHardness"
            }),
            save: new fields.SchemaField({
                ...SFRPGItemBase.saveTemplate()
            }, {
                required: true,
                label: "SFRPG.Items.Action.SavingThrow"
            })
        });

        // No other initial values specific to vehicle attacks

        return schema;
    }
}
