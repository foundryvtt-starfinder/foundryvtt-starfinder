import SFRPGModifier from "../../modifiers/modifier.js";

const { fields } = foundry.data;

export default class SFRPGItemBase extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.description = new fields.SchemaField({
            value: new fields.HTMLField(),
            chat: new fields.HTMLField(),
            short: new fields.HTMLField(),
            unidentified: new fields.HTMLField(),
            gmnotes: new fields.HTMLField()
        });

        schema.source = new fields.StringField();
        schema.type = new fields.StringField();

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
                dc: new fields.StringField({
                    initial: ""
                }),
                descriptor: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.saveDescriptors)],
                    blank: true,
                    label: "SFRPG.SaveDescriptor"
                }),
                type: new fields.StringField({
                    initial: "",
                    choices: ["", ...Object.keys(CONFIG.SFRPG.saves)],
                    blank: true,
                    label: "SFRPG.Save"
                })
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
                    choices: Object.keys(CONFIG.SFRPG.variableDistanceUnits),
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
                    choices: ["text", ...Object.keys(CONFIG.SFRPG.effectDurationTypes)],
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
                total: new fields.NumberField({
                    min: 0,
                    nullable: true,
                    required: false
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
                    choices: ["", ...Object.keys(CONFIG.SFRPG.capacityUsagePer)],
                    blank: true
                }),
                total: new fields.NumberField({
                    nullable: true,
                    required: false
                }),
                value: new fields.NumberField({min: 0})
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

    static damagePartTemplate() {
        return {
            name: new fields.StringField({initial: null, nullable: true}),
            formula: new fields.StringField({initial: null, nullable: true}),
            types: new fields.SchemaField(
                Object.keys(CONFIG.SFRPG.damageAndHealingTypes).reduce((obj, type) => {
                    obj[type] = new fields.BooleanField({ initial: false, required: false });
                    return obj;
                }, {}),
                { required: false }
            ),
            group: new fields.NumberField({initial: null, min: 0, nullable: true}),
            isPrimarySection: new fields.BooleanField()
        };
    }

    // TODO: Move to Effect item when that is created
    /* static itemDurationTemplate() {
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
    } */

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

    static modifiersTemplate() {
        return {
            modifiers: new fields.ArrayField(
                new fields.EmbeddedDataField(SFRPGModifier),
                {required: true}
            )
        };
    }

    static physicalItemTemplate() {
        return {
            attributes: new fields.SchemaField({
                ac: new fields.SchemaField({
                    value: new fields.StringField({required: true})
                }),
                customBuilt: new fields.BooleanField(),
                dex: new fields.SchemaField({
                    mod: new fields.StringField({required: true})
                }),
                hardness: new fields.SchemaField({
                    value: new fields.StringField({required: true})
                }),
                hp: new fields.SchemaField({
                    max: new fields.StringField({required: true}),
                    value: new fields.NumberField({min: 0, required: true})
                }),
                size: new fields.StringField({initial: "medium"}),
                sturdy: new fields.BooleanField()
            }),
            attuned: new fields.BooleanField(),
            bulk: new fields.StringField({initial: "L"}),
            equippable: new fields.BooleanField({initial: true}),
            equipped: new fields.BooleanField({initial: false}),
            equippedBulkMultiplier: new fields.NumberField({initial: 1}),
            identified: new fields.BooleanField({initial: true}),
            isEquipment: new fields.BooleanField({initial: true}),
            level: new fields.NumberField({initial: 1}),
            price: new fields.NumberField({min: 0}),
            proficient: new fields.BooleanField(),
            quantity: new fields.NumberField({initial: 1, min: 0}),
            quantityPerPack: new fields.NumberField({initial: 1, min: 1})
        };
    }

    static specialMaterialsTemplate() {
        return {
            specialMaterials: new fields.ObjectField() // TODO-Ian: detail this field properly
        };
    }

    static speedTemplate() {
        return {
            land: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0})
            }),
            flying: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0}),
                baseManeuverability: new fields.NumberField({initial: 0, min: 0})
            }),
            swimming: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0})
            }),
            burrowing: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0})
            }),
            climbing: new fields.SchemaField({
                base: new fields.NumberField({initial: 0, min: 0})
            }),
            special: new fields.StringField(),
            mainMovement: new fields.StringField({initial: "land"})
        };
    }

    static starshipComponentTemplate() {
        return {
            cost: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true
            }),
            costMultipliedBySize: new fields.BooleanField({initial: false}),
            isPowered: new fields.BooleanField({intial: true}),
            pcu: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true
            })
        };
    }
}
