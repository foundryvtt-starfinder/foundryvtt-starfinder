import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechLowerLimb extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechLowerLimb'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            slots: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.Slots"
            }),
            speed: new fields.StringField({
                initial: "",
                blank: true,
                label: "SFRPG.MechSheet.LowerLimb.Speed"
            }),
            baseHp: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.BaseHp"
            }),
            hpAdvancement: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.HpAdvancement"
            }),
            eac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.Eac"
            }),
            kac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.Kac"
            }),
            fort: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.Fort"
            }),
            ref: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.Ref"
            }),
            canBeActivated: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.CanBeActivated"
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
                label: "SFRPG.MechSheet.LowerLimb.PpCost"
            }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.MechSheet.LowerLimb.MpCost"
            })
        });

        return schema;
    }
}
