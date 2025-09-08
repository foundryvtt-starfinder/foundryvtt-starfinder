import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemEffect extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Effect'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.itemDurationTemplate(),
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Effect-specific properties
        foundry.utils.mergeObject(schema, {
            context: new fields.SchemaField({
                origin: new fields.SchemaField({
                    actorUuid: new fields.StringField({
                        initial: "",
                        blank: true,
                        label: "SFRPG.Effect.OriginActorUUID"
                    }),
                    itemUuid: new fields.StringField({
                        initial: "",
                        blank: true,
                        label: "SFRPG.Effect.OriginItemUUID"
                    })
                })
            }),
            enabled: new fields.BooleanField({
                initial: true,
                required: true,
                label: "SFRPG.Effect.DetailsEnabledLabel"
            }),
            requirements: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.Header.Requirements"
            }),
            showOnToken: new fields.BooleanField({
                initial: true,
                required: true,
                label: "SFRPG.Effect.DetailsShowOnToken"
            }),
            turnEvents: new fields.ArrayField(
                new fields.SchemaField({ // TODO: migrate this to use the common damage part schema
                    content: new fields.HTMLField({required: false}),
                    damageTypes: new fields.TypedObjectField(
                        new fields.BooleanField({initial: false}) // TODO: Add validation of these keys to the model based on CONFIG.SFRPG.damageAndHealingTypes
                    ),
                    formula: new fields.StringField({
                        initial: "",
                        blank: true
                    }),
                    name: new fields.StringField({
                        initial: "",
                        blank: true
                    }),
                    trigger: new fields.StringField({
                        initial: "onTurnEnd",
                        blank: false,
                        choices: Object.keys(CONFIG.SFRPG.effectEndTypes)
                    }),
                    type: new fields.StringField({
                        initial: "roll",
                        blank: false,
                        choices: Object.keys(CONFIG.SFRPG.turnEventTypes)
                    })
                })
            ),
            type: new fields.StringField({
                initial: "effect",
                choices: Object.keys(CONFIG.SFRPG.effectTypes),
                blank: false,
                required: true
            })
        });

        return schema;
    }
}
