import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipCrewQuarter extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipCrewQuarter'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // No Starship Crew Quarter-specific properties

        return schema;
    }
}
