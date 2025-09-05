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
            context: new fields.ObjectField({ // TODO-Ian: fix this with something more specific
                required: false
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
                new fields.AnyField(), // TODO-Ian: fix this with something more specific
                {required: false}
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
