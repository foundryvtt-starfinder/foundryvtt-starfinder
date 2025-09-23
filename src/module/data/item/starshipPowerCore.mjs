import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipPowerCore extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipPowerCore'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.specialMaterialsTemplate(),
            ...SFRPGItemBase.starshipBPTemplate()
        });

        // Starship Power Core-specific properties
        foundry.utils.mergeObject(schema, {
            pcu: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                required: false
            }),
            supportedSizes: new fields.ArrayField(
                new fields.StringField({
                    initial: "tiny",
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.starshipSizes),
                    label: "SFRPG.ItemSheet.StarshipPowerCore.Sizes",
                    hint: "SFRPG.ItemSheet.StarshipPowerCore.SizesTooltip"
                })
            )
        });

        return schema;
    }
}
