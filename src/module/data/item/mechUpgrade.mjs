import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechUpgrade extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechUpgrade'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.MechSheet.Upgrade.MpCost"
            }),
            eacBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.EacBonus"
            }),
            kacBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.KacBonus"
            }),
            reflexBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.ReflexBonus"
            }),
            fortitudeBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.FortitudeBonus"
            }),
            speedBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.SpeedBonus"
            }),
            baseHpBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.BaseHpBonus"
            }),
            hpAdvancementBonus: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.HpAdvancementBonus"
            }),
            spBonusPerTier: new fields.NumberField({
                initial: 0,
                integer: true,
                nullable: false,
                label: "SFRPG.MechSheet.Upgrade.SpBonusPerTier"
            })
        });

        return schema;
    }
}
