import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechAuxiliary extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechAuxiliary'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            canBeActivated: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.MechSheet.Auxiliary.CanBeActivated"
            }),
            isActive: new fields.BooleanField({
                initial: false,
                required: true
            }),
            ppCost: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Auxiliary.PpCost"
            }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Auxiliary.MpCost"
            })
        });

        return schema;
    }
}
