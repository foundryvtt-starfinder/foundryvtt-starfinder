import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemVehicleSystem extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.VehicleSystem'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // No templates needed

        // Vehicle System-specific properties
        foundry.utils.mergeObject(schema, {
            canBeActivated: new fields.BooleanField({
                initial: true,
                required: true,
                label: "SFRPG.VehicleSystemSheet.CanBeActivated",
                hint: "SFRPG.VehicleSystemSheet.CanBeActivatedTooltip"
            }),
            isActive: new fields.BooleanField({
                initial: true,
                required: true
            }),
            piloting: new fields.SchemaField({
                piloting: new fields.NumberField({
                    initial: null,
                    required: true,
                    nullable: true,
                    label: "SFRPG.VehicleSystemSheet.Piloting",
                    hint: "SFRPG.VehicleSystemSheet.PilotingTooltip"
                }),
                usedAsPilot: new fields.BooleanField({
                    initial: false,
                    required: true,
                    label: "SFRPG.VehicleSystemSheet.UseToPilot",
                    hint: "SFRPG.VehicleSystemSheet.UseToPilotTooltip"
                })
            }),
            senses: new fields.SchemaField({
                senses: new fields.StringField({
                    initial: "",
                    required: true,
                    blank: true,
                    label: "SFRPG.VehicleSystemSheet.Senses",
                    hint: "SFRPG.VehicleSystemSheet.SensesTooltip"
                }),
                usedForSenses: new fields.BooleanField({
                    initial: false,
                    required: true,
                    label: "SFRPG.VehicleSystemSheet.UseForSenses",
                    hint: "SFRPG.VehicleSystemSheet.UseForSensesTooltip"
                })
            })
        });

        // No other initial values specific to vehicle systems

        return schema;
    }
}
