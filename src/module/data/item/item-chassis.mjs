import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemChassis extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Chassis'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.speedTemplate()
        });

        // Drone Chassis-specific properties
        foundry.utils.mergeObject(schema, {
            abilityIncreaseStats: new fields.SchemaField({
                first: new fields.StringField({
                    initial: "str",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.abilities)],
                    blank: true,
                    label: "SFRPG.Items.Chassis.AbilityIncreaseStats.First"
                }),
                second: new fields.StringField({
                    initial: "dex",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.abilities)],
                    blank: true,
                    label: "SFRPG.Items.Chassis.AbilityIncreaseStats.Second"
                })
            }),
            abilityScores: new fields.SchemaField({
                cha: new fields.NumberField({
                    initial: 6,
                    min: 0,
                    required: true,
                    label: "SFRPG.AbilityCha"
                }),
                con: new fields.StringField({
                    initial: "-",
                    required: true,
                    label: "SFRPG.AbilityCon"
                }),
                dex: new fields.NumberField({
                    initial: 10,
                    min: 0,
                    required: true,
                    label: "SFRPG.AbilityDex"
                }),
                int: new fields.NumberField({
                    initial: 6,
                    min: 0,
                    required: true,
                    label: "SFRPG.AbilityInt"
                }),
                str: new fields.NumberField({
                    initial: 10,
                    min: 0,
                    required: true,
                    label: "SFRPG.AbilityStr"
                }),
                wis: new fields.NumberField({
                    initial: 10,
                    min: 0,
                    required: true,
                    label: "SFRPG.AbilityWis"
                })
            }),
            eac: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true,
                label: "SFRPG.DroneSheet.Chassis.Levels"
            }),
            fort: new fields.StringField({
                initial: "slow",
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: true,
                label: "SFRPG.DroneSheet.Chassis.Details.Saves.Fortitude"
            }),
            levels: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true,
                label: "SFRPG.DroneSheet.Chassis.Details.Defence.EAC"
            }),
            kac: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true,
                label: "SFRPG.DroneSheet.Chassis.Details.Defence.KAC"
            }),
            ref: new fields.StringField({
                initial: "fast",
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: true,
                label: "SFRPG.DroneSheet.Chassis.Details.Saves.Reflex"
            }),
            size: new fields.StringField({
                initial: "medium",
                choices: Object.keys(CONFIG.SFRPG.itemSizes),
                blank: true,
                required: true,
                label: "SFRPG.Size"
            }),
            will: new fields.StringField({
                initial: "slow",
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: true,
                label: "SFRPG.DroneSheet.Chassis.Details.Saves.Will"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
