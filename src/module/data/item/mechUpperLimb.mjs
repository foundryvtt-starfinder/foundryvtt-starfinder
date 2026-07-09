import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechUpperLimb extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechUpperLimb'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            slots: new fields.NumberField({
                initial: 2,
                min: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.Slots"
            }),
            meleeAttack: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.MeleeAttack"
            }),
            rangedAttack: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.RangedAttack"
            }),
            showAttackBonusChoice: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.ShowAttackBonusChoice"
            }),
            attackBonusChoice: new fields.StringField({
                initial: "melee",
                blank: false,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.AttackBonusChoice"
            }),
            eac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.Eac"
            }),
            kac: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.Kac"
            }),
            strength: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.Strength"
            }),
            baseHp: new fields.NumberField({
                initial: 0,
                integer: true,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.BaseHp"
            }),
            canBeActivated: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.CanBeActivated"
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
                label: "SFRPG.MechSheet.UpperLimb.PpCost"
            }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.MechSheet.UpperLimb.MpCost"
            }),
            actions: new fields.ArrayField(
                new fields.SchemaField(SFRPGItemBase.mechActionTemplate()),
                { initial: [], required: true, label: "SFRPG.MechSheet.Action.Actions" }
            )
        });

        return schema;
    }
}
