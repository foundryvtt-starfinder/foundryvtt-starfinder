import SFRPGDocumentBase from "../base-document.mjs";
import SFRPGMessageBase from "./base-message.mjs";

const { fields } = foundry.data;

export default class SFRPGMessageItemInfo extends SFRPGMessageBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // Merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGDocumentBase.specialMaterialsTemplate()
        });

        // Damage message-specific properties
        foundry.utils.mergeObject(schema, {
            critical: new fields.SchemaField({
                effect: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true
                }),
                isCritical: new fields.BooleanField({
                    intitial: false,
                    required: true
                }),
                isFumble: new fields.BooleanField({
                    intitial: false,
                    required: true
                })
            }),
            descriptors: new fields.ArrayField(
                new fields.StringField({
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.descriptors)
                })
            ),
            properties: SFRPGDocumentBase._propertiesFieldData(),
            starshipWeaponProperties: new fields.ArrayField(
                new fields.StringField({
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.starshipWeaponProperties)
                })
            ),
            // Set this up as an array to future-proof so we can easily switch to multi-target support
            targetInfo: new fields.ArrayField(
                new fields.SchemaField({
                    image: new fields.FilePathField({
                        categories: ["IMAGE"],
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    name: new fields.StringField({
                        initial: "",
                        blank: true
                    }),
                    tokenUUID: new fields.DocumentUUIDField({
                        initial: null,
                        nullable: true,
                        required: false
                    }),
                    quadrant: new fields.StringField({
                        initial: "forward",
                        choices: Object.keys(CONFIG.SFRPG.starshipQuadrants, ""),
                        blank: true,
                        required: false
                    })
                })
            )
        });

        return schema;
    }

    /** @override */
    prepareTags() {
        const tags = super.prepareTags();

        // Critical hit & effect tag
        if (this.critical.isCritical && this.critical.effect.trim()) {
            tags["critical-effect"] = {text: game.i18n.format("SFRPG.Rolls.Dice.CriticalEffect", {"criticalEffect": this.critical.effect.trim() })};
        }

        // Weapon (and other item) properties
        for (const [prop, value] of Object.entries(this.properties)) {
            if (value) {
                tags[`weapon-properties ${prop}`] = {
                    text: CONFIG.SFRPG.weaponProperties[prop],
                    tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[prop]
                };
            }
        }

        // Starship weapon properties
        for (const prop of this.starshipWeaponProperties) {
            tags[`starship-weapon-properties ${prop}`] = {text: CONFIG.SFRPG.starshipWeaponProperties[prop]};
        }

        // Descriptors
        for (const descriptor of this.descriptors) {
            tags[descriptor] = {text: CONFIG.SFRPG.descriptors[descriptor]};
        }

        // Special Materials
        for (const [material, value] of Object.entries(this.specialMaterials)) {
            if (value) tags[material] = {text: CONFIG.SFRPG.specialMaterials[material]};
        }

        // Store rendered tags
        return tags;
    }
}
