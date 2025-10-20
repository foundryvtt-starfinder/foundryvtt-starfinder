import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorDrone extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.commonTemplate({actorType: "drone"}),
            ...SFRPGActorBase.conditionsTemplate()
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema.attributes.fields, {
            rp: new fields.SchemaField({
                max: new fields.NumberField({ // doesn't need to be here for actors, but token resource bars not functional without storing this
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
            tempmax: new fields.NumberField({
                initial: null,
                min: 0,
                integer: true,
                nullable: true,
                required: true
            })
        });

        foundry.utils.mergeObject(schema, {
            traits: new fields.SchemaField({
                spellResistance: new fields.SchemaField({ // TODO: collate this and 'sr' into one field
                    base: new fields.NumberField({
                        initial: 0,
                        integer: true,
                        nullable: true,
                        required: true
                    })
                }, {label: "SFRPG.SpellResistance"}),
                weaponProf: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.TraitWeaponProf"})
            })
        });

        // Edit initial values as needed
        schema.skills.initial.acr.enabled = true;
        schema.skills.initial.ath.enabled = true;
        schema.skills.initial.com.enabled = true;
        schema.skills.initial.eng.enabled = true;
        schema.skills.initial.per.enabled = true;
        schema.skills.initial.ste.enabled = true;

        return schema;
    }
}
