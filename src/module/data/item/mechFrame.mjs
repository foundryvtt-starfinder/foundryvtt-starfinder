import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechFrame extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechFrame'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            size: new fields.StringField({
                initial: "huge",
                blank: false,
                required: true,
                label: "SFRPG.MechSheet.Frame.Size"
            }),
            baseHp: new fields.NumberField({
                initial: 10,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.BaseHp"
            }),
            hpAdvancement: new fields.NumberField({
                initial: 8,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.HpAdvancement"
            }),
            hardness: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Hardness"
            }),
            eac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Eac"
            }),
            kac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Kac"
            }),
            fort: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Fort"
            }),
            ref: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Ref"
            }),
            strength: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.Strength"
            }),
            speed: new fields.StringField({
                initial: "60 ft.",
                blank: true,
                label: "SFRPG.MechSheet.Frame.Speed"
            }),
            frameSlots: new fields.NumberField({
                initial: 2,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.FrameSlots"
            }),
            auxSlots: new fields.NumberField({
                initial: 2,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.AuxSlots"
            }),
            operatorsMin: new fields.NumberField({
                initial: 1,
                min: 1,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.OperatorsMin"
            }),
            operatorsMax: new fields.NumberField({
                initial: 2,
                min: 1,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.Frame.OperatorsMax"
            }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.MechSheet.Frame.MpCost"
            })
        });

        return schema;
    }
}
