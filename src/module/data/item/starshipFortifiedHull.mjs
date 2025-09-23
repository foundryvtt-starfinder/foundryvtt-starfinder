import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipFortifiedHull extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipFortifiedHull'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Fortified Hull-specific properties
        foundry.utils.mergeObject(schema, {
            criticalThresholdBonus: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipFortifiedHull.CriticalThresholdBonus",
                hint: "SFRPG.ItemSheet.StarshipFortifiedHull.CriticalThresholdBonusTooltip"
            })
        });

        return schema;
    }
}
