import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemConsumable extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Consumable'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            // ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemTemplate()
        });

        // Consumable-specific properties
        foundry.utils.mergeObject(schema, {
            consumableType: new fields.StringField({
                initial: "serum",
                choices: Object.keys(CONFIG.SFRPG.consumableTypes),
                blank: false,
                required: true
            })
        });

        // Add two fields to the "uses" property for this item type
        foundry.utils.mergeObject(schema.uses.fields, {
            autoUse: new fields.BooleanField({initial: true}),
            autoDestroy: new fields.BooleanField({initial: true})
        });

        // Change some initial values specific to weapons
        /* schema.container.fields.isOpen.initial = true;
        schema.container.fields.storage.initial = [{
            acceptsType: [
                "spell"
            ],
            affectsEncumbrance: false,
            amount: 0,
            subtype: "spellSlot",
            type: "slot",
            weightProperty: "bulk"
        }]; */

        return schema;
    }
}
