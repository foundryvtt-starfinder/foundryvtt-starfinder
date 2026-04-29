import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemFusion extends SFRPGItemBase {

    static get metadata() {
        return {
            type: "fusion",
            icon: "fas fa-bolt"
        };
    }

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Fusion'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.physicalItemBasicsTemplate()
        });

        // No Fusion-specific properties

        // No changes to initial values needed

        return schema;
    }
}
