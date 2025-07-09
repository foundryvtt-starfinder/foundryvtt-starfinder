// import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../modifiers/types.js";
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

    static itemDurationTemplate() {
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
        return {
            modifiers: new fields.ArrayField(
                new fields.EmbeddedDataField(SFRPGModifier)
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
            specialMaterials: new fields.ObjectField()
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
            cost: new fields.NumberField(),
            costMultipliedBySize: new fields.BooleanField,
            isPowered: new fields.BooleanField(),
            pcu: new fields.NumberField()
        };
    }
}
