import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipAblativeArmor extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipAblativeArmor'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Ablative Armor-specific properties
        foundry.utils.mergeObject(schema, {
            ablativeValue: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipAblativeArmor.AblativeValue",
                hint: "SFRPG.ItemSheet.StarshipAblativeArmor.AblativeValueTooltip"
            }),
            targetLockPenalty: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipAblativeArmor.TargetLockPenalty",
                hint: "SFRPG.ItemSheet.StarshipAblativeArmor.TargetLockPenaltyTooltip"
            }),
            turnDistancePenalty: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipAblativeArmor.TurnDistancePenalty",
                hint: "SFRPG.ItemSheet.StarshipAblativeArmor.TurnDistancePenaltyTooltip"
            })
        });

        return schema;
    }
}
