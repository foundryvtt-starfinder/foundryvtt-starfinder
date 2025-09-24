import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemShield extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Shield'
    ];

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

        // Shield-specific properties
        foundry.utils.mergeObject(schema, {
            acp: new fields.NumberField({
                initial: null,
                integer: true,
                nullable: true,
                required: true,
                label: "SFRPG.Items.Shield.ArmorCheckLabel"
            }),
            bonus: new fields.SchemaField({
                aligned: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: true,
                    label: "SFRPG.Items.Shield.Aligned"
                }),
                wielded: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: true,
                    label: "SFRPG.Items.Shield.Wielded"
                })
            }),
            dex: new fields.NumberField({
                initial: null,
                integer: true,
                nullable: true,
                required: true,
                label: "SFRPG.Items.Shield.AcMaxDexLabel"
            }),
            equippedBulkMultiplier: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true
            })
        });

        // Change some initial values specific to shields
        schema.attributes.fields.sturdy.initial = true;
        schema.properties.initial = {nonlethal: true};
        schema.container.fields.isOpen.initial = true;
        schema.container.fields.storage.initial = [{
            acceptsType: [
                "upgrade"
            ],
            affectsEncumbrance: true,
            amount: 0,
            subtype: "armorUpgrade",
            type: "slot",
            weightProperty: "slots"
        },
        {
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
