import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemFeat extends SFRPGItemBase {

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

        // Feat-specific properties
        foundry.utils.mergeObject(schema, {
            details: new fields.SchemaField({
                category: new fields.StringField({
                    initial: "feat",
                    choices: Object.keys(CONFIG.SFRPG.featureCategories),
                    blank: false,
                    required: true,
                    label: "SFRPG.Items.Feat.FeatureCategory"
                }),
                combat: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Feat.CombatFeat"
                }),
                specialAbilityType: new fields.StringField({
                    initial: "",
                    choices: Object.keys(CONFIG.SFRPG.specialAbilityTypes),
                    blank: true,
                    required: true,
                    label: "SFRPG.Items.Feat.SpecialAbilityType"
                })
            }),
            requirements: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.Items.Feat.Requirements"
            }),
            recharge: new fields.SchemaField({
                value: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true,
                    label: "SFRPG.Items.Feat.ActionRecharge"
                }),
                charged: new fields.BooleanField({
                    initial: false,
                    label: "SFRPG.Items.Feat.Charged"
                })
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
