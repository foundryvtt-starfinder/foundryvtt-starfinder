import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemMechMissionPod extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.MechMissionPod'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Include container template for holding items
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.containerTemplate()
        });

        // Mission pod specific properties
        foundry.utils.mergeObject(schema, {
            isActive: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.MechSheet.MissionPod.IsActive"
            }),
            statMods: new fields.SchemaField({
                hp: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.HP"
                }),
                sp: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.SP"
                }),
                eac: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.EAC"
                }),
                kac: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.KAC"
                }),
                fort: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.Fort"
                }),
                ref: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.Ref"
                }),
                strength: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.Strength"
                }),
                speed: new fields.NumberField({
                    initial: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.MechSheet.MissionPod.Modifiers.Speed"
                })
            }, { label: "SFRPG.MechSheet.MissionPod.Modifiers.Title" }),
            mpCost: new fields.NumberField({
                initial: 0,
                min: 0,
                required: true,
                label: "SFRPG.MechSheet.MissionPod.MpCost"
            }),
            // Store item templates that get created when pod is activated
            itemTemplates: new fields.ArrayField(
                new fields.ObjectField(),
                { initial: [], required: true }
            ),
            // Store IDs of items created from templates (for cleanup on deactivation)
            createdItemIds: new fields.ArrayField(
                new fields.StringField(),
                { initial: [], required: true }
            )
        });

        // Configure container to accept mech items
        schema.container.fields.isOpen.initial = true;
        schema.container.fields.storage.initial = [{
            acceptsType: [
                "mechWeapon",
                "mechPowerCore",
                "mechUpperLimb",
                "mechAuxiliary",
                "mechUpgrade"
            ],
            affectsEncumbrance: false,
            amount: 0,
            subtype: "",
            type: "slot",
            weightProperty: ""
        }];

        return schema;
    }
}
