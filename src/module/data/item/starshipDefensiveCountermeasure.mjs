import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipDefensiveCountermeasure extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipDefensiveCountermeasure'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Defensive Countermeasure-specific properties
        foundry.utils.mergeObject(schema, {
            targetLockBonus: new fields.NumberField({
                initial: 0,
                nullable: false,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipDefensiveCountermeasure.TargetLockBonus",
                hint: "SFRPG.ItemSheet.StarshipDefensiveCountermeasure.TargetLockBonusTooltip"
            })
        });

        return schema;
    }
}
