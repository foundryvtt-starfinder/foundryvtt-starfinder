import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemActorResource extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.ActorResource'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Actor Resource-specific properties
        foundry.utils.mergeObject(schema, {
            base: new fields.NumberField({
                initial: null,
                nullable: true,
                required: true,
                label: "SFRPG.ItemSheet.ActorResource.Base"
            }),
            combatTracker: new fields.SchemaField({
                displayAbsoluteValue: new fields.BooleanField({
                    initial: true,
                    required: true,
                    label: "SFRPG.ItemSheet.ActorResource.Enabled"
                }),
                show: new fields.BooleanField({
                    initial: true,
                    required: true,
                    label: "SFRPG.ItemSheet.ActorResource.Enabled"
                }),
                showOwnerAndGMOnly: new fields.BooleanField({
                    initial: true,
                    required: true,
                    label: "SFRPG.ItemSheet.ActorResource.Enabled"
                }),
                visualization: new fields.ArrayField(
                    new fields.SchemaField({
                        ...SFRPGItemActorResource.visualizationPartTemplate()
                    }),
                    {
                        required: false,
                        label: "SFRPG.ItemSheet.ActorResource.VisualizationsPart"
                    }
                )
            }),
            enabled: new fields.BooleanField({
                initial: true,
                required: true,
                label: "SFRPG.ItemSheet.ActorResource.Enabled"
            }),
            range: new fields.SchemaField({
                max: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true,
                    label: "SFRPG.Maximum"
                }),
                min: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true,
                    label: "SFRPG.Minimum"
                }),
                mode: new fields.StringField({
                    initial: "post",
                    choices: Object.keys(CONFIG.SFRPG.rangeModes),
                    blank: false,
                    required: true,
                    label: "SFRPG.ItemSheet.ActorResource.RangeMode"
                })
            }),
            stage: new fields.StringField({
                initial: "early",
                choices: Object.keys(CONFIG.SFRPG.calculationStages),
                blank: false,
                required: true,
                label: "SFRPG.ItemSheet.ActorResource.Stage",
                hint: "SFRPG.ItemSheet.ActorResource.StageTooltip"
            }),
            subType: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.ActorResource.SubType",
                hint: "SFRPG.ItemSheet.ActorResource.SubTypeTooltip"
            }),
            type: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ItemSheet.ActorResource.Type",
                hint: "SFRPG.ItemSheet.ActorResource.TypeTooltip"
            })
        });

        return schema;
    }

    static visualizationPartTemplate() {
        return {
            image: new fields.FilePathField({
                initial: "",
                blank: true,
                required: false,
                categories: ["IMAGE"]
            }),
            mode: new fields.StringField({
                initial: "eq",
                blank: false,
                required: false,
                choices: Object.keys(CONFIG.SFRPG.mathComparators)
            }),
            title: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.ItemSheet.ActorResource.VisualizationsTitle"
            }),
            value: new fields.NumberField({
                initial: 0,
                nullable: false,
                required: false
            })
        };
    }
}
