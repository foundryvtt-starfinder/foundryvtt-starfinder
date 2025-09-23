import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipShield extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipShield'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Shield-specific properties
        foundry.utils.mergeObject(schema, {
            armorBonus: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipShield.ArmorBonus",
                hint: "SFRPG.ItemSheet.StarshipShield.ArmorBonusTooltip"
            }),
            defenseValue: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipShield.DefenseValue",
                hint: "SFRPG.ItemSheet.StarshipShield.DefenseValueTooltip"
            }),
            isDeflector: new fields.BooleanField({
                initial: false,
                required: false,
                label: "SFRPG.ItemSheet.StarshipAction.IsDeflector",
                hint: "SFRPG.ItemSheet.StarshipShield.ShieldTypeTooltip"
            }),
            regeneration: new fields.NumberField({
                initial: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipShield.Regeneration",
                hint: "SFRPG.ItemSheet.StarshipShield.RegenerationTooltip"
            }),
            shieldPoints: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipShield.ShieldPoints",
                hint: "SFRPG.ItemSheet.StarshipShield.ShieldPointsTooltip"
            }),
            targetLockBonus: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipShield.TargetLockBonus",
                hint: "SFRPG.ItemSheet.StarshipShield.TargetLockBonusTooltip"
            })
        });

        return schema;
    }
}
