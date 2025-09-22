import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemFusion extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Fusion'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.physicalItemBasicsTemplate(),
            ...SFRPGItemBase.modifiersTemplate()
        });

        // No Fusion-specific properties

        // No changes to initial values needed

        return schema;
    }
}
