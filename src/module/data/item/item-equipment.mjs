import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemEquipment extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Equipment'
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
            ...SFRPGItemBase.physicalItemTemplate({isEquippable: true, isEquipment: true}),
            ...SFRPGItemBase.specialMaterialsTemplate()
        });

        // Armor-specific properties
        foundry.utils.mergeObject(schema, {
            armor: new fields.SchemaField({
                type: new fields.StringField({
                    initial: "light",
                    choices: Object.keys(CONFIG.SFRPG.armorTypes),
                    blank: false,
                    required: true
                }),
                eac: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                kac: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                dex: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    required: true
                }),
                acp: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    required: true
                }),
                speedAdjust: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    required: true
                })
            }),
            equippedBulkMultiplier: new fields.NumberField({initial: 1, min: 0}),
            strength: new fields.NumberField(),
            // TODO: replace speed with modern speed template (below) once migrations work
            speed: new fields.StringField({
                initial: "",
                required: true
            }),
            /* speed: new fields.SchemaField(SFRPGDocumentBase._speedFieldData()), */
            reach: new fields.StringField({
                initial: "",
                required: true
            })
        });

        // Change some initial values specific to armor
        schema.attributes.fields.sturdy.initial = true;
        schema.proficient.initial = true;

        return schema;
    }
}
