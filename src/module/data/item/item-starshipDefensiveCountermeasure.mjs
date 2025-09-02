import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipDefensiveCountermeasure extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipDefensiveCountermeasure'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipComponentTemplate()
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
