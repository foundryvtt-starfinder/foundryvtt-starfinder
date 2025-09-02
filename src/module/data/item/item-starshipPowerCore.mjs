import { type } from 'jquery';
import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemStarshipPowerCore extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipPowerCore'
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

        // Starship Power Core-specific properties
        foundry.utils.mergeObject(schema, {
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
