import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorNPC extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.commonTemplate({actorType: "npc"}),
            ...SFRPGActorBase.conditionsTemplate(),
            ...SFRPGActorBase.spellTemplate({actorType: "npc"})
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema.attributes.fields, {
            abilityDC: new fields.SchemaField({
                base: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: true
                })
            }, {label: "SFRPG.NPCSheet.Header.AbilityDC", hint: "SFRPG.NPCSheet.Header.AbilityDCTooltip"}),
            baseSpellDC: new fields.SchemaField({
                base: new fields.NumberField({
                    initial: null,
                    min: 0,
                    integer: true,
                    nullable: true,
                    required: true
                })
            }, {label: "SFRPG.NPCSheet.Header.BaseSpellDC", hint: "SFRPG.NPCSheet.Header.BaseSpellDCTooltip"}),
            rp: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    integer: true,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    integer: true,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.Resolve"})
        });

        foundry.utils.mergeObject(schema.attributes.fields.hp.fields, {
            max: new fields.NumberField({
                initial: 10,
                min: 0,
                integer: true,
                nullable: false,
                required: true
            })
        });

        schema.attributes.fields.eac.fields.base = new fields.NumberField({
            initial: 0,
            min: 0,
            integer: true,
            nullable: false,
            required: true
        });
        schema.attributes.fields.kac.fields.base = new fields.NumberField({
            initial: 0,
            min: 0,
            integer: true,
            nullable: false,
            required: true
        });
        schema.attributes.fields.fort.fields.base = new fields.NumberField({
            initial: 0,
            min: 0,
            integer: true,
            nullable: false,
            required: true
        });
        schema.attributes.fields.reflex.fields.base = new fields.NumberField({
            initial: 0,
            min: 0,
            integer: true,
            nullable: false,
            required: true
        });
        schema.attributes.fields.will.fields.base = new fields.NumberField({
            initial: 0,
            min: 0,
            integer: true,
            nullable: false,
            required: true
        });

        foundry.utils.mergeObject(schema.details.fields, {
            combatRole: new fields.StringField({
                initial: "",
                blank: true,
                choices: ["", ...Object.keys(CONFIG.SFRPG.combatRoles)],
                label: "SFRPG.CombatRoles.Label"
            }),
            cr: new fields.NumberField({
                initial: 1,
                min: 0,
                integer: true,
                nullable: false,
                required: true,
                label: "SFRPG.CR"
            }),
            environment: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.Environment"
            }),
            organization: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.Organization"
            }),
            organizationSize: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 1,
                    nullable: true
                }),
                min: new fields.NumberField({
                    initial: null,
                    min: 1,
                    nullable: true
                })
            }, {label: "SFRPG.NPCSheet.Biography.Organization.GroupSize", hint: "SFRPG.NPCSheet.Biography.Organization.GroupSizeTooltip"}),
            raceAndGrafts: new fields.StringField({
                initial: "",
                blank: true,
                label: "SFRPG.NPCSheet.Header.RaceAndGraftsPlaceHolderText"
            }),
            source: new fields.StringField({
                initial: "",
                blank: true,
                label: "SFRPG.SourceBook"
            }),
            subtype: new fields.StringField({
                initial: "",
                blank: true,
                label: "SFRPG.NPCSheet.Header.SubtypePlaceHolderText"
            }),
            type: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.NPCSheet.Header.TypePlaceHolderText"
            }),
            xp: new fields.SchemaField({}, {label: "SFRPG.XP"})
        });

        // No NPC-specific fields

        // Edit initial values as needed
        schema.abilities.fields.cha.fields.base.initial = 0;
        schema.abilities.fields.con.fields.base.initial = 0;
        schema.abilities.fields.dex.fields.base.initial = 0;
        schema.abilities.fields.int.fields.base.initial = 0;
        schema.abilities.fields.str.fields.base.initial = 0;
        schema.abilities.fields.wis.fields.base.initial = 0;

        return schema;
    }
}
