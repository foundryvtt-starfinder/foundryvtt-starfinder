import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemStarshipDriftEngine extends SFRPGItemBase {
    static migrateData(data) {
        // Initial DataModels migration for bad data (v0.29.0)
        if (data.maxSize === "superColossal") data.maxSize = "supercolossal";
        return super.migrateData(data);
    }

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.StarshipDriftEngine'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.starshipBPTemplate(),
            ...SFRPGItemBase.starshipPowerTemplate()
        });

        // Starship Drift Engine-specific properties
        foundry.utils.mergeObject(schema, {
            engineRating: new fields.NumberField({
                initial: 0,
                min: 0,
                integer: true,
                nullable: true,
                label: "SFRPG.ItemSheet.StarshipDriftEngine.EngineRating",
                hint: "SFRPG.ItemSheet.StarshipDriftEngine.EngineRatingTooltip"
            }),
            maxSize: new fields.StringField({
                initial: "medium",
                choices: Object.keys(CONFIG.SFRPG.starshipSizes),
                label: "SFRPG.ItemSheet.StarshipDriftEngine.MaxSize",
                hint: "SFRPG.ItemSheet.StarshipDriftEngine.MaxSizeTooltip"
            })
        });

        return schema;
    }
}
