import { type } from 'jquery';
import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipReinforcedBulkhead extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipReinforcedBulkhead'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.starshipComponentTemplate()
        });

        // Starship Reinforced Bulkhead-specific properties
        foundry.utils.mergeObject(schema, {
            fortification: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipReinforcedBulkhead.Fortification",
                hint: "SFRPG.ItemSheet.StarshipReinforcedBulkhead.FortificationTooltip"
            })
        });

        return schema;
    }
}
