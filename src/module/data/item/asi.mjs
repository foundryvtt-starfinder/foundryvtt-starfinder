import SFRPGItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class SFRPGItemASI extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.ASI'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // ASI-specific properties
        foundry.utils.mergeObject(schema, {
            abilities: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}) // TODO: Add validation of these keys to the model based on CONFIG.SFRPG.abilities
            )
        });

        return schema;
    }
}
