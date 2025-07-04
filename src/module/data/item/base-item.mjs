import { SchemaField } from "@common/data/fields.mjs";

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
            damageNotes: new fields.StringField(),
            descriptors: new fields.ObjectField(),
            formula: new fields.StringField(),
            rollNotes: new fields.StringField(),
            properties: new fields.ObjectField(),
            critical: new fields.SchemaField({
                effect: new fields.StringField(),
                parts: new fields.ArrayField() // Might require a custom damage part field as the element?
            }),
            damage: new fields.SchemaField({
                parts: new fields.ArrayField() // Might require a custom damage part field as the element?
            }),
            save: new fields.SchemaField({
                dc: fields.StringField(),
                descriptor: fields.StringField(),
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
            modifiers: new fields.ArrayField() // Might require a custom ModifierField
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
            equippable: new fields.BooleanField(),
            equipped: new fields.BooleanField(),
            equippedBulkMultiplier: new fields.NumberField({initial: 1}),
            identified: new fields.BooleanField(),
            level: new fields.NumberField({initial: 1}),
            price: new fields.NumberField({min: 0}),
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
