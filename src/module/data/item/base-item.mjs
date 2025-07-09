import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../modifiers/types.js";

export default class SFRPGItemBase extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
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
        const fields = foundry.data.fields;
        return {
            ability: new fields.StringField(),
            actionTarget: new fields.StringField(),
            actionType: new fields.StringField(),
            attackBonus: new fields.NumberField(),
            chatFlavor: new fields.StringField(),
            critical: new fields.SchemaField({
                effect: new fields.StringField(),
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        { required: false, nullable: true }
                    )
                )
            }),
            damage: new fields.SchemaField({
                parts: new fields.ArrayField(
                    new fields.SchemaField(
                        SFRPGItemBase.damagePartTemplate(),
                        { required: false, nullable: true }
                    )
                )
            }),
            damageNotes: new fields.StringField(),
            descriptors: new fields.ObjectField(),
            formula: new fields.StringField(),
            rollNotes: new fields.StringField(),
            properties: new fields.ObjectField(),
            save: new fields.SchemaField({
                dc: new fields.StringField(),
                descriptor: new fields.StringField(),
                type: new fields.StringField()
            })
        };
    }

    static activatedEffectTemplate() {
        const fields = foundry.data.fields;
        return {
            activation: new fields.SchemaField({
                cost: new fields.NumberField(),
                condition: new fields.StringField(),
                type: new fields.StringField()
            }),
            area: new fields.SchemaField({
                effect: new fields.StringField(),
                shapable: new fields.BooleanField(),
                shape: new fields.StringField(),
                units: new fields.StringField(),
                value: new fields.NumberField() // TODO-Ian Might be a string?
            }),
            duration: new fields.SchemaField({
                units: new fields.StringField(),
                value: new fields.StringField()
            }),
            isActive: new fields.BooleanField(),
            range: new fields.SchemaField({
                additional: new fields.StringField(),
                per: new fields.StringField(),
                units: new fields.StringField(),
                value: new fields.StringField()
            }),
            target: new fields.SchemaField({
                type: new fields.StringField(),
                value: new fields.StringField()
            }),
            uses: new fields.SchemaField({
                max: new fields.StringField(),
                per: new fields.StringField(),
                value: new fields.NumberField({min: 0})
            })
        };
    }

    static containerTemplate() {
        const fields = foundry.data.fields;
        return {
            container: new fields.SchemaField({
                contents: new fields.ArrayField(
                    new fields.SchemaField({
                        id: new fields.StringField({required: true}),
                        index: new fields.NumberField()
                    })
                ),
                includeContentsInWealth: new fields.BooleanField({initial: true}),
                isOpen: new fields.BooleanField({initial: true}),
                storage: new fields.ArrayField(
                    new fields.SchemaField({
                        acceptsType: new fields.ArrayField(new fields.StringField()),
                        affectsEncumbrance: new fields.BooleanField(),
                        amount: new fields.NumberField({min: 0}),
                        subtype: new fields.StringField(),
                        type: new fields.StringField(),
                        weightProperty: new fields.StringField()
                    })
                )
            })
        };
    }

    static damagePartTemplate() {
        const fields = foundry.data.fields;
        return {
            name: new fields.StringField(),
            formula: new fields.StringField(),
            types: new fields.SchemaField(
                [
                    ...Object.keys(CONFIG.SFRPG.energyDamageTypes),
                    ...Object.keys(CONFIG.SFRPG.kineticDamageTypes)
                ].reduce((obj, type) => {
                    obj[type] = new fields.BooleanField({ initial: false, required: false });
                    return obj;
                }, {}),
                { required: false }
            ),
            group: new fields.NumberField(),
            isPrimarySection: new fields.BooleanField()
        };
    }

    static modifierDamageTemplate() {
        const fields = foundry.data.fields;
        return {
            damageGroup: new fields.NumberField({
                initial: null,
                required: false,
                nullable: true,
                integer: true
            }),
            damageTypes: new fields.SchemaField(
                [
                    ...Object.keys(CONFIG.SFRPG.energyDamageTypes),
                    ...Object.keys(CONFIG.SFRPG.kineticDamageTypes)
                ].reduce((obj, type) => {
                    obj[type] = new fields.BooleanField({ initial: false, required: false });
                    return obj;
                }, {}),
                { required: false }
            )
        };
    }

    static itemDurationTemplate() {
        const fields = foundry.data.fields;
        return {
            activeDuration: new SchemaField({
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
        const fields = foundry.data.fields;
        return {
            ammunitionType: new fields.StringField(),
            capacity: new fields.SchemaField({
                max: new fields.NumberField({min: 0}),
                value: new fields.NumberField({min: 0})
            }),
            usage: new fields.SchemaField({
                per: new fields.StringField(),
                value: new fields.NumberField({min: 0})
            })
        };
    }

    static modifiersTemplate() {
        const fields = foundry.data.fields;
        return {
            modifiers: new fields.ArrayField(
                new fields.SchemaField(SFRPGItemBase.modifierTemplate())
            )
        };
    }

    static modifierTemplate() {
        const fields = foundry.data.fields;
        return {
            _id: new fields.StringField({ initial: "", required: true, readonly: false }),
            name: new fields.StringField({
                initial: "New Modifier",
                required: false,
                blank: false,
                label: "SFRPG.ModifierNameLabel",
                hint: "SFRPG.ModifierNameTooltip"
            }),
            modifier: new fields.StringField({
                initial: "0",
                required: true,
                label: "SFRPG.ModifierModifierLabel",
                hint: "SFRPG.ModifierModifierTooltip"
            }),
            max: new fields.NumberField({ initial: 0, integer: true, required: false }),
            type: new fields.StringField({
                initial: SFRPGModifierTypes.UNTYPED,
                required: false,
                choices: Object.values(SFRPGModifierTypes),
                label: "SFRPG.ModifierTypeLabel",
                hint: "SFRPG.ModifierTypeTooltip"
            }),
            modifierType: new fields.StringField({
                initial: SFRPGModifierType.CONSTANT,
                required: true,
                choices: Object.values(SFRPGModifierType).concat("damageSection"),
                label: "SFRPG.ModifierModifierTypeLabel",
                hint: "SFRPG.ModifierModifierTypeTooltip"
            }),
            effectType: new fields.StringField({
                initial: SFRPGEffectType.SKILL,
                required: true,
                choices: Object.values(SFRPGEffectType),
                label: "SFRPG.ModifierEffectTypeLabel",
                hint: "SFRPG.ModifierEffectTypeTooltip"
            }),
            valueAffected: new fields.StringField({
                initial: "",
                required: false,
                blank: true,
                label: "SFRPG.ModifierValueAffectedLabel",
                hint: "SFRPG.ModifierValueAffectedTooltip"
            }),
            enabled: new fields.BooleanField({
                initial: false,
                required: true,
                label: "SFRPG.ModifierEnabledLabel",
                hint: "SFRPG.ModifierEnabledTooltip"
            }),
            source: new fields.StringField({
                initial: "",
                required: false,
                label: "SFRPG.ModifierSourceLabel",
                hint: "SFRPG.ModifierSourceTooltip"
            }),
            notes: new fields.HTMLField({
                initial: "",
                required: false,
                label: "SFRPG.ModifierNotesLabel",
                hint: "SFRPG.ModifierNotesTooltip"
            }),
            subtab: new fields.StringField({
                initial: "misc",
                required: false,
                choices: ["permanent", "temporary", "misc", "condition"]
            }),
            condition: new fields.StringField({ initial: "", required: false }),
            damage: new fields.SchemaField(
                SFRPGItemBase.modifierDamageTemplate(),
                { required: false, nullable: true }
            ),
            limitTo: new fields.StringField({
                initial: "",
                required: false,
                nullable: true,
                blank: true,
                choices: ["", "parent", "container"],
                label: "SFRPG.ModifierLimitToLabel",
                hint: "SFRPG.ModifierLimitToTooltip"
            })
        };
    }

    static physicalItemTemplate() {
        const fields = foundry.data.fields;
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
        const fields = foundry.data.fields;
        return {
            specialMaterials: new fields.ObjectField()
        };
    }

    static speedTemplate() {
        const fields = foundry.data.fields;
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
        const fields = foundry.data.fields;
        return {
            cost: new fields.NumberField(),
            costMultipliedBySize: new fields.BooleanField,
            isPowered: new fields.BooleanField(),
            pcu: new fields.NumberField()
        };
    }
}
