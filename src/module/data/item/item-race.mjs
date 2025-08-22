import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemRace extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Race'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Species-specific properties
        foundry.utils.mergeObject(schema, {
            abilityMods: new fields.SchemaField({
                parts: new fields.ArrayField(
                    /* new fields.NumberField({
                        initial: 2,
                        required: true,
                        nullable: false
                    }),
                    new fields.StringField({
                        choices: Object.keys(CONFIG.SFRPG.abilities)
                    }), */
                    new fields.AnyField(), // TODO: Replace this with something that supports the format [[2, con], [2, wis], [-2, int]]
                    { initial: [], required: true, label: "SFRPG.SpeciesAbilityModifier" }
                )
            }),
            hp: new fields.SchemaField({
                min: new fields.NumberField({ // TODO-Ian: Might be unneeded?
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.RaceHitPoints"
                })
            }),
            size: new fields.StringField({
                initial: "medium",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.actorSizes),
                blank: false,
                label: "SFRPG.RaceSize"
            }),
            subtype: new fields.StringField({
                initial: "",
                required: true,
                blank: true,
                label: "SFRPG.ItemSheet.Header.Subtype"
            }),
            type: new fields.StringField({
                initial: "humanoid",
                required: true,
                blank: true,
                label: "SFRPG.ItemSheet.Header.Type"
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
