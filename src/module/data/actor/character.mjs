import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorCharacter extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.commonTemplate({actorType: "character"}),
            ...SFRPGActorBase.conditionsTemplate(),
            ...SFRPGActorBase.spellTemplate({actorType: "character"})
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema.attributes.fields, {
            baseAttackBonus: new fields.SchemaField({}, {label: "SFRPG.BaseAttackBonusTitle"}),
            cmd: new fields.SchemaField({}, {label: "SFRPG.ACvsCombatManeuversTitle"}),
            rp: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.Resolve"}),
            sp: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.Stamina"})
        });

        foundry.utils.mergeObject(schema.details.fields, {
            cl: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: null,
                    nullable: true,
                    required: true,
                    min: 0
                })
            }, {label: "SFRPG.CasterLevel"}),
            level: new fields.SchemaField({}, {label: "SFRPG.LevelLabelText"}),
            race: new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.ActorSheet.Features.Categories.Race"
            }),
            theme: new fields.StringField({
                initial: "",
                blank: true,
                required: false,
                label: "SFRPG.ActorSheet.Features.Categories.Theme"
            }),
            xp: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.XP"})
        });

        foundry.utils.mergeObject(schema.traits.fields, {
            armorProf: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.TraitArmorProf"}),
            weaponProf: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.TraitWeaponProf"})
        });

        // Character-specific fields
        foundry.utils.mergeObject(schema, {
            options: new fields.SchemaField({
                hideUntrained: new fields.BooleanField({
                    initial: false
                })
            }),
            skillpoints: new fields.SchemaField({}, {label: "SFRPG.SkillPoints"})
        });

        // Edit initial values as needed

        return schema;
    }
}
