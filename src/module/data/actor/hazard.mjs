import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorHazard extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema, {
            attributes: new fields.SchemaField({
                baseAttackBonus: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.BaseAttackBonusTitle"}),
                bypass: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Attributes.Bypass", hint: "SFRPG.HazardSheet.Details.Attributes.BypassTooltip"}),
                damage: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Offense.Damage", hint: "SFRPG.HazardSheet.Details.Vitals.Offense.DamageTooltip"}),
                duration: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: null,
                        min: 0,
                        integer: true,
                        nullable: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Attributes.Duration", hint: "SFRPG.HazardSheet.Details.Attributed.DurationTooltip"}),
                eac: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Defenses.EAC", hint: "SFRPG.HazardSheet.Details.Vitals.Defenses.EACTooltip"}),
                effect: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Effects.Effect", hint: "SFRPG.HazardSheet.Details.Effects.EffectTooltip"}),
                fort: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Saves.Fortitude", hint: "SFRPG.HazardSheet.Details.Vitals.Saves.FortitudeTooltip"}),
                hardness: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Defenses.Hardness", hint: "SFRPG.HazardSheet.Details.Vitals.Defenses.HardnessToooltip"}),
                hp: new fields.SchemaField({
                    max: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    }),
                    value: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Defenses.Hitpoints", hint: "SFRPG.HazardSheet.Details.Vitals.Defenses.HitpointsTooltip"}),
                init: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Attributes.Initiative", hint: "SFRPG.HazardSheet.Details.Attributes.InitiativeTooltip"}),
                kac: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Defenses.KAC", hint: "SFRPG.HazardSheet.Details.Vitals.Defenses.KACTooltip"}),
                reflex: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Saves.Reflex", hint: "SFRPG.HazardSheet.Details.Vitals.Saves.ReflexTooltip"}),
                reset: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Attributes.Reset", hint: "SFRPG.HazardSheet.Details.Attributes.ResetTooltip"}),
                trigger: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Attributes.Trigger", hint: "SFRPG.HazardSheet.Details.Attributes.TriggerTooltip"}),
                will: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.HazardSheet.Details.Vitals.Saves.Will", hint: "SFRPG.HazardSheet.Details.Vitals.Saves.WillTooltip"})
            }),
            dcs: new fields.SchemaField({
                disable: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    }, {label: "SFRPG.HazardSheet.Details.DCs.Disable", hint: "SFRPG.HazardSheet.Details.DCs.DisableTooltip"})
                }),
                notice: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    }, {label: "SFRPG.HazardSheet.Details.DCs.Notice", hint: "SFRPG.HazardSheet.Details.DCs.NoticeTooltip"})
                })
            }),
            details: new fields.SchemaField({
                cr: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "1",
                        blank: false,
                        required: true
                    })
                }, {label: "SFRPG.CR"}),
                description: new fields.SchemaField({
                    value: new fields.HTMLField()
                }, {label: "SFRPG.Description"}),
                source: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false,
                    label: "SFRPG.SourceBook"
                }),
                type: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false,
                    label: "SFRPG.NPCSheet.Header.TypePlaceHolderText"
                }),
                xp: new fields.SchemaField({}, {label: "SFRPG.XP"})
            })
        });

        return schema;
    }
}
