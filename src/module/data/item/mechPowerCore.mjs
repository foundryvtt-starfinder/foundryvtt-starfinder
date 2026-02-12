import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechPowerCore extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechPowerCore'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            ppInitial: new fields.NumberField({
                initial: 3,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.PowerCore.PPInitial"
            }),
            ppMax: new fields.NumberField({
                initial: 5,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.PowerCore.PPMax"
            }),
            ppRegen: new fields.NumberField({
                initial: 1,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.PowerCore.PPRegen"
            }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.PowerCore.MpCost"
            })
        });

        return schema;
    }
}
