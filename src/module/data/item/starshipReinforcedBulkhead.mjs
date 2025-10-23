import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipReinforcedBulkhead extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipReinforcedBulkhead'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Reinforced Bulkhead-specific properties
        foundry.utils.mergeObject(schema, {
            fortification: new fields.NumberField({
                initial: null,
                min: 0,
                integer: true,
                nullable: true,
                label: "SFRPG.ItemSheet.StarshipReinforcedBulkhead.Fortification",
                hint: "SFRPG.ItemSheet.StarshipReinforcedBulkhead.FortificationTooltip"
            })
        });

        return schema;
    }
}
