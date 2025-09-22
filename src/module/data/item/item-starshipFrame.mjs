import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipFrame extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipFrame'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Frame-specific properties
        foundry.utils.mergeObject(schema, {
            cost: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                required: true
            }),
            crew: new fields.SchemaField({
                minimum: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ItemSheet.StarshipFrame.Details.CrewMinimum",
                    hint: "SFRPG.ItemSheet.StarshipFrame.Details.CrewMinimumTooltip"
                }),
                maximum: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ItemSheet.StarshipFrame.Details.CrewMaximum",
                    hint: "SFRPG.ItemSheet.StarshipFrame.Details.CrewMaximumTooltip"
                })
            }),
            damageThreshold: new fields.SchemaField({
                base: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ItemSheet.StarshipFrame.Details.DamageThreshold",
                    hint: "SFRPG.ItemSheet.StarshipFrame.Details.DamageThresholdTooltip"
                })
            }),
            expansionBays: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.ExpansionBays",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.ExpansionBaysTooltip"
            }),
            hitpoints: new fields.SchemaField({
                base: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ItemSheet.StarshipFrame.Details.HitPoints",
                    hint: "SFRPG.ItemSheet.StarshipFrame.Details.HitPointsTooltip"
                }),
                increment: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ItemSheet.StarshipFrame.Details.HitPointsIncrement",
                    hint: "SFRPG.ItemSheet.StarshipFrame.Details.HitPointsIncrementTooltip"
                })
            }),
            maneuverability: new fields.StringField({
                initial: "average",
                choices: Object.keys(CONFIG.SFRPG.maneuverability),
                blank: false,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.Maneuverability",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.ManeuverabilityTooltip"
            }),
            size: new fields.StringField({
                initial: "medium",
                choices: Object.keys(CONFIG.SFRPG.starshipSizes),
                blank: false,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.Size",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.SizeTooltip"
            }),
            weaponMounts: new fields.SchemaField({
                forward: new fields.SchemaField(SFRPGItemStarshipFrame._frameWeaponSlotFieldData()),
                aft: new fields.SchemaField(SFRPGItemStarshipFrame._frameWeaponSlotFieldData()),
                port: new fields.SchemaField(SFRPGItemStarshipFrame._frameWeaponSlotFieldData()),
                starboard: new fields.SchemaField(SFRPGItemStarshipFrame._frameWeaponSlotFieldData()),
                turret: new fields.SchemaField(SFRPGItemStarshipFrame._frameWeaponSlotFieldData())
            })
        });

        return schema;
    }

    static _frameWeaponSlotFieldData() {
        const fields = foundry.data.fields;
        return {
            capitalSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeCapital"
            }),
            heavySlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeHeavy"
            }),
            lightSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeLight"
            }),
            spinalSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeSpinal"
            })
        };
    }
}
