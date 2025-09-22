import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipSpecialAbility extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipSpecialAbility'
    ];

    static defineSchema() {
        const schema = super.defineSchema();
        return schema;
    }
}
