import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorDrone extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.commonTemplate({includeBaseAbilities: true}),
            ...SFRPGActorBase.conditionsTemplate(),
            ...SFRPGActorBase.modifiersTemplate()
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema.attributes.fields, {
            armorSlots: new fields.SchemaField({
                current: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                max: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.DroneSheet.Traits.ArmorSlots"}),
            baseAttackBonus: new fields.SchemaField({
                ...SFRPGActorBase.tooltipTemplate(),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.BaseAttackBonusTitle"}),
            rp: new fields.SchemaField({
                ...SFRPGActorBase.tooltipTemplate(),
                max: new fields.NumberField({
                    initial: 10,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                min: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.Resolve"}),
            weaponMounts: new fields.SchemaField({
                melee: new fields.SchemaField({
                    current: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    }),
                    max: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.DroneSheet.Traits.MeleeWeaponMounts"}),
                ranged: new fields.SchemaField({
                    current: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    }),
                    max: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.DroneSheet.Traits.RangedWeaponMounts"})
            })
        });

        foundry.utils.mergeObject(schema.details.fields, {
            chassis: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.DroneSheet.Features.Chassis"
            }),
            level: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: 20,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                min: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.LevelLabelText"})
        });

        foundry.utils.mergeObject(schema.traits.fields, {
            weaponProf: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.TraitWeaponProf"})
        });

        // Character-specific fields
        foundry.utils.mergeObject(schema, {
            resources: new fields.ObjectField({ // TODO-Ian: detail this
                label: "SFRPG.ActorSheet.Features.Categories.ActorResources"
            })
        });

        // Edit initial values as needed
        schema.skills.fields.acr.fields.enabled.initial = true;
        schema.skills.fields.ath.fields.enabled.initial = true;
        schema.skills.fields.com.fields.enabled.initial = true;
        schema.skills.fields.eng.fields.enabled.initial = true;
        schema.skills.fields.per.fields.enabled.initial = true;
        schema.skills.fields.ste.fields.enabled.initial = true;

        return schema;
    }
}
