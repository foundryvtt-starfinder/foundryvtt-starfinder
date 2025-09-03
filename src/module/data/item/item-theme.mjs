import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemTheme extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Theme'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Theme-specific properties
        foundry.utils.mergeObject(schema, {
            abilityMod: new fields.SchemaField({
                ability: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.abilities)],
                    blank: true,
                    required: true,
                    label: "SFRPG.Items.Ability"
                }),
                mod: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    label: "SFRPG.ModifierTitle"
                })
            }),
            skill: new fields.StringField({
                initial: "acr",
                choices: Object.keys(CONFIG.SFRPG.skills),
                blank: true,
                required: true,
                label: "SFRPG.Skill"
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
