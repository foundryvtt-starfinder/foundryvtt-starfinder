import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemWeapon extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Weapon'
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

        // Weapon-specific properties
        foundry.utils.mergeObject(schema, {
            equippedBulkMultiplier: new fields.NumberField({initial: 1, min: 0}),
            special: new fields.StringField({
                initial: "",
                blank: true,
                required: false
            }),
            weaponCategory: new fields.StringField({
                initial: "uncategorized",
                choices: Object.keys(CONFIG.SFRPG.weaponCategories),
                blank: false,
                required: true
            }),
            weaponType: new fields.StringField({
                initial: "basicM",
                choices: Object.keys(CONFIG.SFRPG.weaponTypes),
                blank: false,
                required: true
            })
        });

        // Change some initial values specific to weapons
        schema.attributes.fields.sturdy.initial = true;
        schema.container.fields.isOpen.initial = true;
        schema.container.fields.storage.initial = [{
            acceptsType: [
                "fusion"
            ],
            affectsEncumbrance: true,
            amount: 0,
            subtype: "fusion",
            type: "slot",
            weightProperty: "level"
        }];
        schema.proficient.initial = true;
        schema.ability.initial = "str";

        return schema;
    }
}
