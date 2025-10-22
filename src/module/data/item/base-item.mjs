import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGItemBase extends SFRPGDocumentBase {
    static migrateData(data) {
        // Initial DataModels migration for bad data
        if (data.usage?.per === "Battery charge") data.usage.per = "shot";
        if (data.usage?.per === "use") data.usage.per = "action";
        if (data.area?.shape === "shapable") data.area.shape = "";
        if (data.container?.storage) {
            for (const storage of data.container.storage) {
                if (storage.weightProperty === "bulk") storage.weightProperty = "";
            }
        }

        // Trait Selector Update (v0.29.1)
        if (!foundry.utils.isEmpty(data.properties)) {
            for (const [key, val] of Object.entries(data.properties)) {
                if (typeof val === "boolean") {
                    data.properties[key] = {value: val, extension: ""};
                }
            }
        }

        return super.migrateData(data);
    }

    static defineSchema() {
        const schema = super.defineSchema();

        foundry.utils.mergeObject(schema, {
            ...SFRPGDocumentBase.modifiersTemplate()
        });

        schema.source = new fields.StringField({
            initial: "",
            blank: true,
            required: false,
            label: "SFRPG.SourceBook"
        });
        schema.description = new fields.SchemaField({
            value: new fields.HTMLField(),
            chat: new fields.HTMLField(),
            short: new fields.HTMLField(),
            unidentified: new fields.HTMLField(),
            gmnotes: new fields.HTMLField()
        });

        return schema;
    }

    static actionTemplate() {
        return {
            ability: new fields.StringField({
                initial: "",
                required: false,
                choices: ["", ...Object.keys(CONFIG.SFRPG.abilities)],
                blank: true,
                label: "SFRPG.Items.Action.AbilityModifier"
            }),
            actionTarget: new fields.StringField({
                initial: "",
                required: false,
                choices: Object.keys(CONFIG.SFRPG.actionTargets),
                blank: true,
                label: "SFRPG.Items.Action.ActionTarget.Title",
                hint: "SFRPG.Items.Action.ActionTarget.Tooltip"
            }),
            actionType: new fields.StringField({
                initial: "",
                required: false,
                choices: ["", ...Object.keys(CONFIG.SFRPG.itemActionTypes)],
                blank: true,
                label: "SFRPG.Items.Action.ActionType"
            }),
            attackBonus: new fields.NumberField({
                initial: null,
                integer: true,
                nullable: true,
                required: false,
                label: "SFRPG.Items.Action.AttackRollBonus"
            }),
            chatFlavor: new fields.StringField({
                required: false,
                label: "SFRPG.Items.Action.ChatMessageFlavor"
            }),
            critical: new fields.SchemaField({
                effect: new fields.StringField({
                    required: false,
                    label: "SFRPG.Items.Action.CriticalEffect"
                }),
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        {required: false, nullable: true}
                    ),
                    {required: true}
                )
            }),
            damage: new fields.SchemaField({
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        {required: false, nullable: true}
                    ),
                    {required: true}
                ),
                primaryGroup: new fields.NumberField({
                    initial: null,
                    integer: true,
                    min: 0,
                    nullable: true
                })
            }),
            damageNotes: new fields.StringField({
                required: false,
                label: "SFRPG.Items.Action.DamageNotes",
                hint: "SFRPG.Items.Action.DamageNotesTooltip"
            }),
            formula: new fields.StringField({
                initial: null,
                nullable: true,
                required: true,
                label: "SFRPG.Items.Action.DamageFormula",
                hint: "SFRPG.Items.Action.DamageFormulaTooltip"
            }),
            rollNotes: new fields.StringField({
                required: false,
                label: "SFRPG.Items.Action.DamageFormula",
                hint: "SFRPG.Items.Action.DamageFormulaTooltip"
            }),
            skillCheck: new fields.SchemaField({
                dc: new fields.StringField({
                    initial: "",
                    blank: true
                }),
                type: new fields.StringField({
                    initial: "",
                    blank: true,
                    choices: ["", ...Object.keys(CONFIG.SFRPG.skills)]
                }),
                variable: new fields.BooleanField({
                    initial: false
                })
            }),
            properties: new fields.TypedObjectField(
                new fields.SchemaField({
                    extension: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    }),
                    value: new fields.BooleanField({
                        initial: false,
                        required: true
                    })
                }),
                {validateKey: (key) => key in CONFIG.SFRPG.weaponProperties}
            ),
            save: new fields.SchemaField(
                SFRPGItemBase.saveTemplate(),
                {
                    required: true,
                    nullable: true,
                    label: "SFRPG.Items.Action.SavingThrow"
                })
        };
    }

    static activatedEffectTemplate() {
        return {
            activation: new fields.SchemaField({
                cost: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: false,
                    label: "SFRPG.Items.Activation.ActivationCost"
                }),
                condition: new fields.StringField({
                    required: false,
                    label: "SFRPG.Items.Activation.ActivationCondition"
                }),
                type: new fields.StringField({
                    initial: "none",
                    choices: Object.keys(CONFIG.SFRPG.abilityActivationTypes),
                    blank: true,
                    required: true,
                    label: "SFRPG.Items.Activation.Activation"
                })
            }, {
                required: true,
                label: "SFRPG.Items.Activation.Activation"
            }),
            area: new fields.SchemaField({
                effect: new fields.StringField({
                    initial: "",
                    choices: Object.keys(CONFIG.SFRPG.spellAreaEffects),
                    blank: true
                }),
                shapable: new fields.BooleanField({initial: false}),
                shape: new fields.StringField({
                    initial: "",
                    choices: Object.keys(CONFIG.SFRPG.spellAreaShapes),
                    blank: true
                }),
                units: new fields.StringField({
                    initial: "",
                    choices: Object.keys(CONFIG.SFRPG.distanceUnits),
                    blank: true
                }),
                value: new fields.StringField({initial: ""})
            }, {
                required: true,
                label: "SFRPG.Items.Activation.Area"
            }),
            duration: new fields.SchemaField({
                units: new fields.StringField({
                    initial: "instantaneous",
                    choices: [...Object.keys(CONFIG.SFRPG.durationTypes, "text")]
                }),
                value: new fields.StringField({
                    initial: "",
                    blank: true
                })
            }, {label: "SFRPG.Items.Activation.Duration"}),
            isActive: new fields.BooleanField(),
            range: new fields.SchemaField({
                units: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.distanceUnits)],
                    blank: true,
                    required: true
                }),
                value: new fields.StringField({
                    required: false
                })
            }, {
                required: true,
                label: "SFRPG.Items.Activation.Range"
            }),
            target: new fields.SchemaField({
                value: new fields.StringField({nullable: true})
            }, {
                required: true,
                label: "SFRPG.Items.Activation.Target"
            }),
            uses: new fields.SchemaField({
                max: new fields.StringField({
                    initial: "",
                    blank: true
                }),
                per: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.limitedUsePeriods)],
                    blank: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true
                })
            }, {
                required: true,
                label: "SFRPG.Items.Activation.LimitedUses"
            })
        };
    }

    static containerTemplate() {
        return {
            container: new fields.SchemaField({
                contents: new fields.ArrayField(
                    new fields.SchemaField({
                        id: new fields.StringField({
                            required: true
                        }),
                        index: new fields.NumberField({
                            min: 0,
                            integer: true
                        })
                    }),
                    {required: true}
                ),
                includeContentsInWealthCalculation: new fields.BooleanField({
                    initial: true,
                    label: "SFRPG.ActorSheet.Inventory.Container.IncludeContentsInWealthCalculation",
                    hint: "SFRPG.ActorSheet.Inventory.Container.IncludeContentsInWealthCalculationTooltip"
                }),
                isOpen: new fields.BooleanField({initial: true}),
                storage: new fields.ArrayField(
                    new fields.SchemaField({
                        acceptsType: new fields.ArrayField(
                            new fields.StringField({
                                choices: Object.keys(CONFIG.SFRPG.containableTypes)
                            })
                        ),
                        affectsEncumbrance: new fields.BooleanField({initial: true}),
                        amount: new fields.NumberField({
                            min: 0,
                            integer: true
                        }),
                        subtype: new fields.StringField({
                            initial: "",
                            blank: true,
                            choices: Object.keys(CONFIG.SFRPG.storageIdentifiers)
                        }),
                        type: new fields.StringField({
                            choices: Object.keys(CONFIG.SFRPG.storageTypes)
                        }),
                        weightMultiplier: new fields.NumberField({
                            min: 0,
                            nullable: true,
                            required: false
                        }),
                        weightProperty: new fields.StringField({
                            initial: "",
                            choices: Object.keys(CONFIG.SFRPG.storageWeightProperties),
                            blank: true
                        })
                    })
                )
            })
        };
    }

    static equipmentStatusTemplate(options = {}) {
        const isEquippable = options.isEquippable ?? false;
        const isEquipment = options.isEquipment ?? false;

        return {
            equippable: new fields.BooleanField({initial: isEquippable}),
            equipped: new fields.BooleanField({initial: false}),
            identified: new fields.BooleanField({initial: true}),
            isEquipment: new fields.BooleanField({initial: isEquipment}),
            proficient: new fields.BooleanField({initial: false})
        };
    }

    static itemDurationTemplate() {
        return {
            activeDuration: new fields.SchemaField({
                activationTime: new fields.NumberField(),
                endsOn: new fields.StringField({initial: "onTurnStart"}),
                expiryInit: new fields.NumberField({min: 0}),
                expiryMode: new fields.SchemaField({
                    turn: new fields.StringField({initial: "parent"}),
                    type: new fields.StringField({initial: "turn"})
                }),
                unit: new fields.StringField({initial: "round"}),
                value: new fields.StringField({initial: "0", blank: true})
            })
        };
    }

    static itemUsageTemplate() {
        return {
            ammunitionType: new fields.StringField({
                initial: "",
                blank: true,
                choices: ["", ...Object.keys(CONFIG.SFRPG.ammunitionTypes)],
                label: "SFRPG.Items.Ammunition.AmmunitionType",
                required: true
            }),
            capacity: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true
                })
            }),
            usage: new fields.SchemaField({
                per: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.capacityUsagePer)],
                    blank: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true
                })
            })
        };
    }

    static physicalItemAttributesTemplate() {
        return {
            attributes: new fields.SchemaField({
                ac: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }),
                customBuilt: new fields.BooleanField({
                    initial: false
                }),
                dex: new fields.SchemaField({
                    mod: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }),
                hardness: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    })
                }),
                hp: new fields.SchemaField({
                    max: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: true
                    }),
                    value: new fields.NumberField({
                        initial: null,
                        min: 0,
                        integer: true,
                        nullable: true,
                        required: true
                    })
                }),
                size: new fields.StringField({
                    initial: "medium",
                    required: true,
                    choices: Object.keys(CONFIG.SFRPG.itemSizes)
                }),
                sturdy: new fields.BooleanField({
                    initial: false
                })
            })
        };
    }

    static physicalItemBasicsTemplate() {
        return {
            bulk: new fields.StringField({
                initial: "L",
                blank: true,
                required: true
            }),
            level: new fields.NumberField({
                initial: 1,
                min: 0,
                integer: true,
                required: true
            }),
            price: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: true,
                required: true
            }),
            quantity: new fields.NumberField({
                initial: 1,
                min: 0,
                nullable: true,
                required: true
            }),
            quantityPerPack: new fields.NumberField({
                initial: 1,
                min: 1,
                nullable: true,
                required: true
            })
        };
    }

    static physicalItemTemplate(options = {}) {
        return {
            ...SFRPGItemBase.equipmentStatusTemplate(options),
            ...SFRPGItemBase.physicalItemAttributesTemplate(),
            ...SFRPGItemBase.physicalItemBasicsTemplate()
        };
    }

    static saveTemplate() {
        return {
            dc: new fields.StringField({
                initial: "",
                blank: true,
                label: "SFRPG.ActionSave"
            }),
            descriptor: new fields.StringField({
                initial: "negate",
                choices: Object.keys(CONFIG.SFRPG.saveDescriptors),
                blank: true,
                label: "SFRPG.SaveDescriptor"
            }),
            type: new fields.StringField({
                initial: "",
                choices: ["", ...Object.keys(CONFIG.SFRPG.saves)],
                blank: true,
                label: "SFRPG.Save"
            })
        };
    }

    static specialMaterialsTemplate() {
        return {
            specialMaterials: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}),
                {validateKey: (key) => Object.keys(CONFIG.SFRPG.specialMaterials).includes(key)}
            )
        };
    }

    static starshipBPTemplate() {
        return {
            cost: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                required: true
            }),
            costMultipliedBySize: new fields.BooleanField({
                initial: false,
                required: true
            })
        };
    }

    static starshipPowerTemplate() {
        return {
            isPowered: new fields.BooleanField({
                intial: true,
                required: false
            }),
            pcu: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                required: false
            })
        };
    }
}
