import { type } from 'jquery';
import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipSecuritySystem extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipSecuritySystem'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.starshipComponentTemplate()
        });

        // No Starship Security System-specific properties

        return schema;
    }
}
