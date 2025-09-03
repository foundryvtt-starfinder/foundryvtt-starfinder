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
            ...SFRPGItemBase.starshipComponentTemplate()
        });

        // Starship Frame-specific properties
        foundry.utils.mergeObject(schema, {
            size: new fields.StringField({
                initial: "medium",
                choices: Object.keys(CONFIG.SFRPG.starshipSizes),
                blank: false,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.Size",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.SizeTooltip"
            }),
            maneuverability: new fields.StringField({
                initial: "average",
                choices: Object.keys(CONFIG.SFRPG.maneuverability),
                blank: false,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.Maneuverability",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.ManeuverabilityTooltip"
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
            weaponMounts: new fields.SchemaField({
                forward: new fields.SchemaField(SFRPGItemStarshipFrame.frameWeaponSlotData()),
                aft: new fields.SchemaField(SFRPGItemStarshipFrame.frameWeaponSlotData()),
                port: new fields.SchemaField(SFRPGItemStarshipFrame.frameWeaponSlotData()),
                starboard: new fields.SchemaField(SFRPGItemStarshipFrame.frameWeaponSlotData()),
                turret: new fields.SchemaField(SFRPGItemStarshipFrame.frameWeaponSlotData())
            }),
            expansionBays: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.ExpansionBays",
                hint: "SFRPG.ItemSheet.StarshipFrame.Details.ExpansionBaysTooltip"
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
        });

        return schema;
    }

    static frameWeaponSlotData() {
        const fields = foundry.data.fields;
        return {
            lightSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeLight",
            }),
            heavySlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeHeavy",
            }),
            capitalSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeCapital",
            }),
            spinalSlots: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFrame.Details.WeaponsTypeSpinal",
            })
        };
    }
}
