import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemArmor extends SFRPGItemBase {
    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFROG.Item.Armor'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.actionTemplate(),
            ...SFRPGItemBase.activatedEffectTemplate(),
            ...SFRPGItemBase.containerTemplate(),
            ...SFRPGItemBase.itemUsageTemplate(),
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.physicalItemTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate()
        });

        // Armor-specific properties
        foundry.utils.mergeObject(schema, {
            armor: new fields.SchemaField({
                type: new fields.StringField({initial: "light"}),
                eac: new fields.NumberField(),
                kac: new fields.NumberField(),
                dex: new fields.NumberField({nullable: true, initial: null}),
                acp: new fields.NumberField(),
                speedAdjust: new fields.NumberField()
            }),
            strength: new fields.NumberField(),
            speed: new fields.StringField(),
            reach: new fields.StringField()
        });

        // Change some initial values specific to armor
        schema.attributes.fields.sturdy.initial = true;
        schema.proficient.initial = true;

        return schema;
    }
}
