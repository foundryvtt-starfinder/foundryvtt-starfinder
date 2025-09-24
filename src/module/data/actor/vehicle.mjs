import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorVehicle extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.conditionsTemplate()
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.crewTemplate({type: "vehicle"}),
            attributes: new fields.SchemaField({
                controlSkill: new fields.StringField({
                    initial: "pil",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.vehicleControlSkills),
                    label: "SFRPG.VehicleSheet.Details.Modifiers.ControlSkill"
                }),
                cover: new fields.StringField({
                    initial: "partial",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.vehicleCoverTypes),
                    label: "SFRPG.VehicleSheet.Details.OtherAttributes.Cover"
                }),
                dimensions: new fields.SchemaField({
                    height: new fields.NumberField({
                        initial: 5,
                        min: 0,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Dimensions.Height"
                    }),
                    length: new fields.NumberField({
                        initial: 5,
                        min: 0,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Dimensions.Length"
                    }),
                    width: new fields.NumberField({
                        initial: 5,
                        min: 0,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Dimensions.Width"
                    })
                }),
                eac: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.EnergyArmorClassShort", hint: "SFRPG.EnergyArmorClass"}),
                expansionBays: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: false
                    })
                }, {label: "SFRPG.VehicleSheet.Details.OtherAttributes.ExpansionBays"}),
                hardness: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    integer: true,
                    nullable: false,
                    required: true,
                    label: "SFRPG.VehicleSheet.Details.Hardness"
                }),
                hp: new fields.SchemaField({
                    max: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    }),
                    threshold: new fields.NumberField({
                        initial: 7,
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
                }, {label: "SFRPG.Health"}),
                kac: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        integer: true,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.KineticArmorClassShort", hint: "SFRPG.KineticArmorClass"}),
                modifiers: new fields.SchemaField({
                    athletics: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.SkillAth"
                    }),
                    attackFullSpeed: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Modifiers.AttackFullSpeed",
                        hint: "SFRPG.VehicleSheet.Details.Modifiers.AttackTooltip"
                    }),
                    attackMoving: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Modifiers.AttackMoving",
                        hint: "SFRPG.VehicleSheet.Details.Modifiers.AttackTooltip"
                    }),
                    attackStopped: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.VehicleSheet.Details.Modifiers.AttackStopped",
                        hint: "SFRPG.VehicleSheet.Details.Modifiers.AttackTooltip"
                    }),
                    piloting: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.SkillPil"
                    }),
                    survival: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        integer: true,
                        nullable: true,
                        label: "SFRPG.SkillSur"
                    })
                }),
                size: new fields.StringField({
                    initial: "large",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.vehicleSizes),
                    required: true,
                    label: "SFRPG.VehicleSheet.Details.OtherAttributes.Size"
                }),
                speed: new fields.SchemaField({
                    drive: new fields.StringField({
                        initial: "15 ft",
                        blank: true,
                        label: "SFRPG.VehicleSheet.Details.Movement.Drive",
                        hint: "SFRPG.VehicleSheet.Details.Movement.DriveTooltip"
                    }),
                    full: new fields.StringField({
                        initial: "350 ft",
                        blank: true,
                        label: "SFRPG.VehicleSheet.Details.Movement.Full",
                        hint: "SFRPG.VehicleSheet.Details.Movement.FullTooltip"
                    }),
                    mph: new fields.StringField({
                        initial: "40 mph",
                        blank: true,
                        label: "SFRPG.VehicleSheet.Details.Movement.Speed",
                        hint: "SFRPG.VehicleSheet.Details.Movement.SpeedTooltip"
                    })
                }),
                type: new fields.StringField({
                    initial: "land",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.vehicleTypes),
                    required: true,
                    label: "SFRPG.VehicleSheet.Details.OtherAttributes.Type"
                })
            }),
            details: new fields.SchemaField({
                description: new fields.SchemaField({
                    chat: new fields.StringField({
                        initial: "",
                        blank: true
                    }),
                    unidentified: new fields.StringField({
                        initial: "",
                        blank: true
                    }),
                    value: new fields.StringField({
                        initial: "",
                        blank: true
                    })
                }),
                level: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    integer: true,
                    nullable: false,
                    label: "SFRPG.VehicleSheet.Header.Level"
                }),
                price: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    label: "SFRPG.VehicleSheet.Header.Price",
                    hint: "SFRPG.VehicleSheet.Header.PriceTooltip"
                }),
                source: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: "SFRPG.SourceBook"
                })
            }),
            hangarBay: SFRPGActorBase._crewPCField({
                init: 0,
                label: "SFRPG.VehicleSheet.Details.OtherAttributes.HangarBays"
            })
        });

        return schema;
    }
}
