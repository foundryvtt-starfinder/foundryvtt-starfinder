import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipSensor extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipSensor'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Sensor-specific properties
        foundry.utils.mergeObject(schema, {
            modifier: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipSensor.Modifier",
                hint: "SFRPG.ItemSheet.StarshipSensor.ModifierTooltip"
            }),
            range: new fields.StringField({
                initial: "none",
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.starshipWeaponRanges),
                label: "SFRPG.ItemSheet.StarshipSensor.Range",
                hint: "SFRPG.ItemSheet.StarshipSensor.RangeTooltip"
            })
        });

        return schema;
    }
}
