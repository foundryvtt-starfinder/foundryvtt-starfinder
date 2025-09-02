import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipAction extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipAction'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // no templates needed

        // Starship Action-specific properties
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemStarshipAction.actionDC(),
            effectCritical: SFRPGItemStarshipAction.effectFieldData(),
            effectNormal: SFRPGItemStarshipAction.effectFieldData(),
            formula: new fields.ArrayField(
                new fields.SchemaField({
                    ...SFRPGItemStarshipAction.actionDC(),
                    effectCritical: SFRPGItemStarshipAction.effectFieldData(),
                    effectNormal: SFRPGItemStarshipAction.effectFieldData(),
                    formula: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    name: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    })
                })
            ),
            isPush: new fields.BooleanField({
                initial: false,
                required: true
            }),
            order: new fields.NumberField({
                initial: 0,
                nullable: false,
                required: true
            }),
            phase: new fields.SchemaField({
                name: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false
                }),
                tooltip: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false
                })
            }),
            resolvePointCost: new fields.NumberField({
                initial: null,
                nullable: true,
                required: true
            }),
            role: new fields.StringField({
                initial: "",
                blank: true,
                required: true
            }),
            selectorKey: SFRPGItemStarshipAction.effectFieldData(),
            selectors: new fields.ArrayField(
                SFRPGItemStarshipAction.effectFieldData()
            )
        });

        return schema;
    }

    static actionDC() {
        const fields = foundry.data.fields;
        return {
            dc: new fields.SchemaField({
                resolve: new fields.BooleanField({
                    initial: false,
                    required: false
                }),
                value: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false
                })
            }, {nullable: true, required: true}
        )};
    }

    static effectFieldData() {
        const fields = foundry.data.fields;
        return new fields.StringField({
                initial: "",
                blank: true,
                required: false
        });
    }

    static selectorFieldData() {
        const fields = foundry.data.fields;
        return new fields.StringField({
            initial: "",
            choices: ["", ...Object.keys(CONFIG.SFRPG.starshipRoleNames)],
            blank: true,
            required: false
        });
    }
}
