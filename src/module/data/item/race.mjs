import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemRace extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Race'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Species-specific properties
        foundry.utils.mergeObject(schema, {
            abilityMods: new fields.SchemaField({
                parts: new fields.ArrayField(
                    new fields.AnyField(), // TODO: Replace this with something that supports the format [[2, con], [2, wis], [-2, int]]
                    { initial: [], required: true, label: "SFRPG.SpeciesAbilityModifier" }
                )
            }),
            hp: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    integer: true,
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
                initial: "Humanoid",
                required: true,
                blank: true,
                label: "SFRPG.ItemSheet.Header.Type"
            })
        });

        // No initial value changes to templated fields

        return schema;
    }
}
