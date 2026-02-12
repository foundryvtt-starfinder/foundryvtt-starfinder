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

    /** @override */
    prepareTags() {
        this.renderedTags = [];
        // Weapon (and other item) properties
        for (const [prop, value] of Object.entries(this.properties)) {
            if (value) this.renderedTags.push({tag: `weapon-properties ${prop}`, text: CONFIG.SFRPG.weaponProperties[prop]});
        }

        // Starship weapon properties
        for (const prop of this.starshipWeaponProperties) {
            this.renderedTags.push({tag: `starship-weapon-properties ${prop}`, text: CONFIG.SFRPG.starshipWeaponProperties[prop]});
        }

        // Descriptors
        for (const descriptor of this.descriptors) {
            this.renderedTags.push({tag: descriptor, text: CONFIG.SFRPG.descriptors[descriptor]});
        }

        // Special Materials
        for (const [material, value] of Object.entries(this.specialMaterials)) {
            if (value) this.renderedTags.push({tag: material, text: CONFIG.SFRPG.specialMaterials[material]});
        }

        // Magic Damage
        if (this.damage.isMagic) this.renderedTags.push({tag: "magic", text: game.i18n.localize("SFRPG.Magic.Magic")});

        // Critical
        if (this.critical.isCritical) this.renderedTags.push({tag: "critical", text: game.i18n.localize("SFRPG.Rolls.Dice.CriticalHit")});

        // Minimum Damage
        if (this.damage.minimumDamage) this.renderedTags.push({tag: "minimum-damage", text: game.i18n.localize("SFRPG.Damage.MinimumDamage")});
    }
}
