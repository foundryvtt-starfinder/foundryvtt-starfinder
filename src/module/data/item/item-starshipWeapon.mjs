import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipWeapon extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipWeapon'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipComponentTemplate()
        });

        // Weapon-specific properties
        foundry.utils.mergeObject(schema, {
            actionTarget: new fields.StringField({
                initial: "",
                required: false,
                choices: Object.keys(CONFIG.SFRPG.actionTargetsStarship),
                blank: true,
                label: "SFRPG.Items.Action.ActionTarget.Title",
                hint: "SFRPG.Items.Action.ActionTarget.Tooltip"
            }),
            attackBonus: new fields.NumberField({
                initial: null,
                nullable: true,
                required: false,
                label: "SFRPG.Items.Action.AttackRollBonus"
            }),
            capacity: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    hint: "SFRPG.ItemSheet.Capacity.CapacityMaxTooltip"
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    hint: "SFRPG.ItemSheet.Capacity.CapacityValueTooltip"
                })
            }, {
                required: true,
                label: "SFRPG.ItemSheet.Capacity.Capacity"
            }),
            class: new fields.StringField({
                initial: "light",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.starshipWeaponClass),
                blank: false,
                label: "SFRPG.ItemSheet.StarshipWeapon.Class",
                hint: "SFRPG.ItemSheet.StarshipWeapon.ClassTooltip"
            }),
            damage: new fields.SchemaField({
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        {required: false, nullable: true}
                    ),
                    {required: true}
                )
            }),
            mount: new fields.SchemaField({
                arc: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false,
                    choices: ["", ...Object.keys(CONFIG.SFRPG.starshipArcs)],
                    label: "SFRPG.ItemSheet.StarshipWeapon.Arc",
                    hint: "SFRPG.ItemSheet.StarshipWeapon.ArcTooltip"
                }),
                mounted: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.ItemSheet.StarshipWeapon.Mounted",
                    hint: "SFRPG.ItemSheet.StarshipWeapon.MountedTooltip"
                })
            }),
            range: new fields.StringField({
                initial: "none",
                choices: Object.keys(CONFIG.SFRPG.starshipWeaponRanges),
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.StarshipWeapon.Range",
                hint: "SFRPG.ItemSheet.StarshipWeapon.RangeTooltip"
            }),
            special: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}) // TODO: Add validation of these keys to the model based on CONFIG.SFRPG.starshipWeaponProperties
            ),
            speed: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                label: "SFRPG.ItemSheet.StarshipWeapon.Speed",
                hint: "SFRPG.ItemSheet.StarshipWeapon.SpeedTooltip"
            }),
            weaponType: new fields.StringField({
                initial: "direct",
                choices: Object.keys(CONFIG.SFRPG.starshipWeaponTypes),
                blank: false,
                required: true,
                label: "SFRPG.ItemSheet.StarshipWeapon.WeaponType",
                hint: "SFRPG.ItemSheet.StarshipWeapon.WeaponTypeTooltip"
            })
        });

        return schema;
    }
}
