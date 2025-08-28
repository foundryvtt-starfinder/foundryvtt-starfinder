import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemMod extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Mod'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Drone Mod-specific properties
        foundry.utils.mergeObject(schema, {
            additionalMovement: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.OtherEffects.SpeedSpecial"
            }),
            additionalSenses: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.OtherEffects.AdditionalSenses"
            }),
            arms: new fields.SchemaField({
                armType: new fields.StringField({
                    initial: "general",
                    choices: Object.keys(CONFIG.SFRPG.droneArmTypes),
                    blank: false,
                    required: true,
                    label: "SFRPG.DroneSheet.Mod.Details.Arms.ArmType.Label"
                }),
                number: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    required: true,
                    label: "SFRPG.DroneSheet.Mod.Details.Arms.Amount"
                })
            }),
            bonusSkill: new fields.StringField({
                initial: "",
                choices: ["", ...Object.keys(CONFIG.SFRPG.skills)],
                blank: true,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.BaseStatistics.BonusSkill"
            }),
            isArmorSlot: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.OtherEffects.ArmorSlot"
            }),
            isFree: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.BaseStatistics.FreeInstall",
                hint: "SFRPG.DroneSheet.Mod.Details.BaseStatistics.FreeInstallLabel"
            }),
            maxInstalls: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.BaseStatistics.MaxInstalls"
            }),
            spellResistance: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.OtherEffects.SpellResistance"
            }),
            weaponProficiency: new fields.StringField({
                initial: "",
                choices: ["", ...Object.keys(CONFIG.SFRPG.weaponProficiencies)],
                blank: true,
                required: true,
                label: "SFRPG.DroneSheet.Mod.Details.OtherEffects.WeaponProficiency"
            })
        })

        // No changes to initial values needed

        return schema;
    }
}
