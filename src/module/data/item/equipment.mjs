import SFRPGItemBase from './base-item.mjs';
import SFRPGDocumentBase from '../base-document.mjs';

const { fields } = foundry.data;

export default class SFRPGItemEquipment extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Equipment'
    ];

    static migrateData(data) {
        // v0.29.1 power armor full speed override
        if (typeof data.speed === "string") {
            data.speed = {special: data.speed};
        }

        return super.migrateData(data);
    };

    static defineSchema() {
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
                    integer: true,
                    nullable: true,
                    required: true
                }),
                kac: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: true
                }),
                dex: new fields.NumberField({
                    initial: null,
                    integer: true,
                    nullable: true,
                    required: true
                }),
                acp: new fields.NumberField({
                    initial: null,
                    integer: true,
                    nullable: true,
                    required: true
                }),
                speedAdjust: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    required: true
                })
            }),
            equippedBulkMultiplier: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true
            }),
            strength: new fields.NumberField({
                integer: true
            }),
            speed: new fields.SchemaField(SFRPGDocumentBase._speedFieldData()),
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
