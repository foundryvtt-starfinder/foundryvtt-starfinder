import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipSensor extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipSensor'
    ];

    static defineSchema() {
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
                min: 0,
                integer: true,
                nullable: true,
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
