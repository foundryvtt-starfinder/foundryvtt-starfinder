import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemFeat extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Feat'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate()
        });

        // Feat-specific properties
        foundry.utils.mergeObject(schema, {
            activationEvent: new fields.SchemaField({
                deactivatedAt: new fields.NumberField({
                    initial: 0,
                    nullable: true,
                    integer: true,
                    required: true
                }),
                endsOn: new fields.StringField({
                    initial: "onTurnStart",
                    choices: Object.keys(CONFIG.SFRPG.effectEndTypes),
                    required: true
                }),
                endTime: new fields.NumberField({
                    initial: 0,
                    nullable: false,
                    integer: true,
                    required: true
                }),
                startTime: new fields.NumberField({
                    initial: 0,
                    nullable: false,
                    integer: true,
                    required: true
                }),
                status: new fields.StringField({
                    initial: "",
                    blank: true,
                    nullable: true,
                    required: true
                })
            }),
            descriptors: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}),
                {validateKey: (key) => key in CONFIG.SFRPG.descriptors}
            ),
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
            }),
            requirements: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.Items.Feat.Requirements"
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
