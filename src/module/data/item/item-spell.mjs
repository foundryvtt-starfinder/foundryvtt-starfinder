import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemSpell extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Spell'
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

        // Spell-specific properties
        foundry.utils.mergeObject(schema, {
            descriptors: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}) // TODO: Add validation of these keys to the model based on CONFIG.SFRPG.descriptors
            ),
            level: new fields.NumberField({
                initial: 1,
                min: 0,
                nullable: false,
                required: false,
                label: "SFRPG.Items.Spell.Level"
            }),
            school: new fields.StringField({
                initial: "",
                required: false,
                choices: ["", ...Object.keys(CONFIG.SFRPG.spellSchools)],
                blank: true,
                label: "SFRPG.Items.Spell.School"
            }),
            sr: new fields.BooleanField({
                initial: false,
                label: "SFRPG.Items.Spell.Resistance"
            }),
            dismissable: new fields.BooleanField({
                initial: false,
                label: "SFRPG.Items.Spell.Dismissible"
            }),
            concentration: new fields.BooleanField({
                initial: false,
                label: "SFRPG.Items.Spell.Concentration"
            }),
            materials: new fields.SchemaField({
                value: new fields.StringField({
                    initial: "",
                    required: false,
                    blank: true,
                    label: "SFRPG.Items.Spell.SpellcastingMaterials"
                }),
                consumed: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Spell.Consumed"
                }),
                cost: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false,
                    label: "SFRPG.Items.Spell.Cost"
                }),
                supply: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false,
                    label: "SFRPG.Items.Spell.Supply"
                })
            }),
            preparation: new fields.SchemaField({
                mode: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.spellPreparationModes)],
                    required: false,
                    blank: true,
                    label: "SFRPG.Items.Spell.PreparationMode"
                }),
                prepared: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Spell.Prepared"
                })
            }),
            allowedClasses: new fields.SchemaField({
                myst: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.AllowedClasses.Myst"
                }),
                precog: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.AllowedClasses.Precog"
                }),
                tech: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Spell.Tech"
                }),
                wysh: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Spell.Wysh"
                })
            }),
            isVariableLevel: new fields.BooleanField({
                initial: false,
                label: "SFRPG.Items.Spell.IsVariableLevel"
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
