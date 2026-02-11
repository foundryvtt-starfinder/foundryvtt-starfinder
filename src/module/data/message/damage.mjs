import SFRPGDocumentBase from "../base-document.mjs";
import SFRPGMessageBase from "./base-message.mjs";

const { fields } = foundry.data;

export default class SFRPGMessageDamage extends SFRPGMessageBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // Merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGDocumentBase.specialMaterialsTemplate()
        });

        // Damage message-specific properties
        foundry.utils.mergeObject(schema, {
            critical: new fields.SchemaField({
                doubleDamage: new fields.BooleanField({
                    intitial: true
                }),
                effect: new fields.StringField({
                    initial: "",
                    blank: true
                }),
                isCritical: new fields.BooleanField({
                    intitial: false
                })
            }),
            damage: new fields.SchemaField({
                isMagic: new fields.BooleanField({
                    initial: false
                }),
                minimumDamage: new fields.BooleanField({
                    initial: false
                }),
                types: new fields.ArrayField(
                    new fields.StringField({
                        blank: false,
                        choices: Object.keys(CONFIG.SFRPG.damageAndHealingTypes)
                    })
                )
            }),
            descriptors: new fields.ArrayField(
                new fields.StringField({
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.descriptors)
                })
            ),
            partIndex: new fields.StringField({
                initial: null,
                nullable: true,
                blank: true
            }),
            properties: SFRPGDocumentBase._propertiesFieldData(),
            starshipWeaponProperties: new fields.ArrayField(
                new fields.StringField({
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.starshipWeaponProperties)
                })
            )
        });

        return schema;
    }
}
