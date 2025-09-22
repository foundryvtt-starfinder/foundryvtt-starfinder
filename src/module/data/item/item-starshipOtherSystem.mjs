import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipOtherSystem extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipOtherSystem'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // No Starship Other System-specific properties

        return schema;
    }
}
