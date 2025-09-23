import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipThruster extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipThruster'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Thruster-specific properties
        foundry.utils.mergeObject(schema, {
            isBooster: new fields.BooleanField({
                initial: false,
                required: false,
                label: "SFRPG.ItemSheet.StarshipThruster.IsBooster"
            }),
            isEnabled: new fields.BooleanField({
                initial: true,
                required: false,
                label: "SFRPG.ItemSheet.StarshipThruster.IsEnabled"
            }),
            pilotingModifier: new fields.NumberField({
                initial: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipThruster.PilotingModifier",
                hint: "SFRPG.ItemSheet.StarshipThruster.PilotingModifierTooltip"
            }),
            speed: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                label: "SFRPG.ItemSheet.StarshipThruster.Speed",
                hint: "SFRPG.ItemSheet.StarshipThruster.SpeedTooltip"
            }),
            supportedSize: new fields.StringField({
                initial: "tiny",
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.starshipSizes),
                label: "SFRPG.ItemSheet.StarshipThruster.Size",
                hint: "SFRPG.ItemSheet.StarshipThruster.SizeTooltip"
            })
        });

        return schema;
    }
}
