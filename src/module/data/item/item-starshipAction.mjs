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
            effectCritical: SFRPGItemStarshipAction.effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.CriticalEffect"}),
            effectNormal: SFRPGItemStarshipAction.effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.NormalEffect"}),
            formula: new fields.ArrayField(
                new fields.SchemaField({
                    ...SFRPGItemStarshipAction.actionDC(),
                    effectCritical: SFRPGItemStarshipAction.effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.CriticalEffect"}),
                    effectNormal: SFRPGItemStarshipAction.effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.NormalEffect"}),
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
                required: true,
                label: "SFRPG.ItemSheet.StarshipAction.IsPushAction"
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
                    required: false,
                    label: "SFRPG.ItemSheet.StarshipAction.Phase"
                }),
                tooltip: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false,
                    label: "SFRPG.ItemSheet.StarshipAction.PhaseTooltip"
                })
            }),
            resolvePointCost: new fields.NumberField({
                initial: null,
                nullable: true,
                required: true,
                label: "SFRPG.StarshipSheet.Actions.Header.ResolvePoints"
            }),
            role: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.StarshipAction.CrewRole"
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
                    required: false,
                    label: "SFRPG.ItemSheet.StarshipAction.ResolveFormulaAutomatically",
                    hint: "SFRPG.ItemSheet.StarshipAction.ResolveFormulaAutomaticallyTooltip"
                }),
                value: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false,
                    label: "SFRPG.ItemSheet.StarshipAction.ActionDC"
                })
            }, { nullable: true, required: true}
            )
        };
    }

    static effectFieldData(options = {}) {
        const fields = foundry.data.fields;
        const label = options.label ?? "";
        return new fields.StringField({
            initial: "",
            blank: true,
            required: false,
            label: label
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
