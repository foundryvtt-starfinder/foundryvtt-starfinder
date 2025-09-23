import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipComputer extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipComputer'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Computer-specific properties
        foundry.utils.mergeObject(schema, {
            modifier: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipComputer.Modifier",
                hint: "SFRPG.ItemSheet.StarshipComputer.ModifierTooltip"
            }),
            nodes: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipComputer.Nodes",
                hint: "SFRPG.ItemSheet.StarshipComputer.NodesTooltip"
            })
        });

        return schema;
    }
}
