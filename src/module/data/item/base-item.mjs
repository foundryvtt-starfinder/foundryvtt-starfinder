import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGItemBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = super.defineSchema();

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
                )
            }),
            damageNotes: new fields.StringField({
                required: false,
                label: "SFRPG.Items.Action.DamageNotes",
                hint: "SFRPG.Items.Action.DamageNotesTooltip"
            }),
            descriptors: new fields.ObjectField(), // TODO-Ian: detail this type more
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
            properties: new fields.ObjectField(), // TODO-Ian: detail this type more
            save: new fields.SchemaField({
                ...SFRPGItemBase.saveTemplate()
            }, {
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
                shapable: new fields.BooleanField(),
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
                    initial: "",
                    choices: ["text", ...Object.keys(CONFIG.SFRPG.durationTypes)],
                    blank: true
                }),
                value: new fields.StringField()
            }, {
                required: true,
                label: "SFRPG.Items.Activation.Duration"
            }),
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
                max: new fields.StringField({nullable: true}),
                per: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.limitedUsePeriods)],
                    blank: true
                }),
                value: new fields.NumberField({min: 0, nullable: true})
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
                        id: new fields.StringField({required: true}),
                        index: new fields.NumberField({min: 0})
                    }),
                    {required: true}
                ),
                includeContentsInWealth: new fields.BooleanField({
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
                        amount: new fields.NumberField({min: 0}),
                        subtype: new fields.StringField({
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
                            choices: Object.keys(CONFIG.SFRPG.storageWeightProperties),
                            blank: true
                        })
                    })
                )
            })
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
                value: new fields.StringField({initial: "0"})
            })
        };
    }

    static itemUsageTemplate() {
        return {
            ammunitionType: new fields.StringField({
                initial: "",
                blank: true,
                choices: ["", ...Object.keys(CONFIG.SFRPG.ammunitionTypes)],
                label: "SFRPG.Items.Ammunition.AmmunitionType"
            }, {required: true}),
            capacity: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true
                })
            }, {required: true}),
            usage: new fields.SchemaField({
                per: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.capacityUsagePer)],
                    blank: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true
                })
            }, {required: true})
        };
    }

    static physicalItemTemplate(options = {}) {
        const isEquippable = options.isEquippable ?? false;
        const isEquipment = options.isEquipment ?? false;
        return {
            attributes: new fields.SchemaField({
                ac: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: ""
                    })
                }),
                customBuilt: new fields.BooleanField({
                    initial: false
                }),
                dex: new fields.SchemaField({
                    mod: new fields.StringField({
                        initial: "",
                        required: true
                    })
                }),
                hardness: new fields.SchemaField({
                    value: new fields.StringField({
                        initial: ""
                    })
                }),
                hp: new fields.SchemaField({
                    max: new fields.StringField({
                        initial: "",
                        required: true
                    }),
                    value: new fields.NumberField({
                        initial: null,
                        nullable: true,
                        min: 0,
                        required: true
                    })
                }),
                size: new fields.StringField({
                    initial: "medium",
                    required: true,
                    choices: CONFIG.SFRPG.itemSizes
                }),
                sturdy: new fields.BooleanField({
                    initial: false
                })
            }),
            attuned: new fields.BooleanField({initial: false}),
            bulk: new fields.StringField({
                initial: "L",
                required: true
            }),
            equippable: new fields.BooleanField({initial: isEquippable}),
            equipped: new fields.BooleanField({initial: false}),
            equippedBulkMultiplier: new fields.NumberField({initial: 1, min: 0}),
            identified: new fields.BooleanField({initial: true}),
            isEquipment: new fields.BooleanField({initial: isEquipment}),
            level: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true
            }),
            price: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                required: true
            }),
            proficient: new fields.BooleanField({initial: false}),
            quantity: new fields.NumberField({
                initial: 1,
                min: 0,
                required: true
            }),
            quantityPerPack: new fields.NumberField({
                initial: 1,
                min: 1,
                required: true
            })
        };
    }

    static saveTemplate() {;
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
            specialMaterials: new fields.ObjectField() // TODO-Ian: detail this field properly
        };
    }

    static starshipComponentTemplate() {
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
            }),
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
