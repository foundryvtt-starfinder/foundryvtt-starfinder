import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemAugmentation extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Augmentation'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // Augmentation-specific properties
        foundry.utils.mergeObject(schema, {
            system: new fields.StringField({
                initial: "none",
                choices: Object.keys(CONFIG.SFRPG.augmentationSystems),
                blank: true,
                required: true,
                label: "SFRPG.Items.Augmentation.System"
            }),
            type: new fields.StringField({
                initial: "cybernetic",
                choices: Object.keys(CONFIG.SFRPG.augmentationTypes),
                blank: false,
                required: true,
                label: "SFRPG.Items.Augmentation.Type"
            })
        });

        // No changes to initial values needed

        return schema;
    }
}
