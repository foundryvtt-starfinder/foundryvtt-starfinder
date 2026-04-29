import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipExpansionBay extends SFRPGItemBase {

    static get metadata() {
        return {
            type: "starshipExpansionBay",
            icon: "fas fa-boxes-packing"
        };
    }

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipExpansionBay'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // No Starship Expansion Bay-specific properties

        return schema;
    }
}
