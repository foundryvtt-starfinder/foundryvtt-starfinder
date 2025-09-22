import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipArmor extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipArmor'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate(),
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Armor-specific properties
        foundry.utils.mergeObject(schema, {
            armorBonus: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipArmor.ArmorBonus",
                hint: "SFRPG.ItemSheet.StarshipArmor.ArmorBonusTooltip"
            }),
            targetLockPenalty: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipArmor.TargetLockPenalty",
                hint: "SFRPG.ItemSheet.StarshipArmor.TargetLockPenaltyTooltip"
            }),
            turnDistancePenalty: new fields.NumberField({
                initial: null,
                nullable: true,
                min: 0,
                label: "SFRPG.ItemSheet.StarshipArmor.TurnDistancePenalty",
                hint: "SFRPG.ItemSheet.StarshipArmor.TurnDistancePenaltyTooltip"
            })
        });

        return schema;
    }
}
