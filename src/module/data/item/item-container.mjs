import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemContainer extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Container'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // No container-specific properties

        // Change some initial values specific to weapons
        schema.container.fields.isOpen.initial = true;
        schema.container.fields.storage.initial = [{
            acceptsType: [
                "weapon",
                "shield",
                "equipment",
                "goods",
                "consumable",
                "container",
                "technological",
                "fusion",
                "upgrade",
                "augmentation",
                "magic",
                "hybrid"
            ],
            affectsEncumbrance: true,
            amount: 0,
            subtype: "",
            type: "bulk",
            weightProperty: ""
        }];

        return schema;
    }
}
