import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipAction extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipAction'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Starship Action-specific properties
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemStarshipAction.actionDCTemplate(),
            effectCritical: SFRPGItemStarshipAction._effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.CriticalEffect"}),
            effectNormal: SFRPGItemStarshipAction._effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.NormalEffect"}),
            formula: new fields.ArrayField(
                new fields.SchemaField({
                    ...SFRPGItemStarshipAction.actionDCTemplate(),
                    effectCritical: SFRPGItemStarshipAction._effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.CriticalEffect"}),
                    effectNormal: SFRPGItemStarshipAction._effectFieldData({label: "SFRPG.ItemSheet.StarshipAction.NormalEffect"}),
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
                integer: true,
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
                integer: true,
                required: true,
                label: "SFRPG.StarshipSheet.Actions.Header.ResolvePoints"
            }),
            role: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.StarshipAction.CrewRole"
            }),
            selectorKey: SFRPGItemStarshipAction._selectorFieldData(),
            selectors: new fields.ArrayField(
                SFRPGItemStarshipAction._selectorFieldData()
            )
        });

        return schema;
    }

    static actionDCTemplate() {

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
                    label: "SFRPG.ItemSheet.StarshipAction.actionDCTemplate"
                })
            }, { nullable: true, required: true}
            )
        };
    }

    static _effectFieldData(options = {}) {

        const label = options.label ?? "";
        return new fields.StringField({
            initial: "",
            blank: true,
            required: false,
            label: label
        });
    }

    static _selectorFieldData() {

        return new fields.StringField({
            initial: "",
            choices: ["", ...Object.keys(CONFIG.SFRPG.starshipRoles)],
            blank: true,
            required: false
        });
    }
}
