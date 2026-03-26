/**
 * @import { CompendiumCollection } from "@client/documents/collections/_module.mjs"
 * @import { Collection } from "@common/utils/collection.mjs"
 * @import { ActorSFRPG } from "../actor/actor.js"
 * @import { ItemSFRPG } from "../item/item.js"
*/

export class PackLoader {
    loadedPacks = {
        Actor: {},
        Item: {}
    };

    /**
     * @param {"Actor"|"Item"} entityType
     * @param {string[]} packs An array of pack IDs
     */
    async *loadPacks(entityType, packs) {
        if (!this.loadedPacks[entityType]) this.loadedPacks[entityType] = {};

        const progress = ui.notifications.info("Loading packs...", { progress: true });
        let pct = 0;

        const fields = [
            "type",
            "system.level"
        ];
        if (entityType === "Actor") {
            fields.push(
                "system.details.cr",
                "system.attributes.hp.max",
                "system.details.type",
                "system.traits.size",
                "system.details.organizationSize",
                "system.details.alignment"
            );
        } else {
            fields.push(
                "system.pcu",
                "system.cost",
                "system.weaponCategory",
                "system.class",
                "system.weaponType",
                "system.armor",
                "system.school",
                "system.type",
                "system.allowedClasses"
            );
        }

        for (const packId of packs) {
            let data = this.loadedPacks[entityType][packId];

            /** @type {CompendiumCollection<ActorSFRPG|ItemSFRPG>|undefined} */
            const pack = data?.pack || game.packs.get(packId);
            if (pack?.documentName !== entityType) continue;

            if (!data) {

                const index = pack.indexed ? pack.index : await pack.getIndex();
                /** @type {Set<string>} */
                const types = new Set(index.map(i => i.type));
                const indexFields = [];
                for (const type of types) {
                    const schema = CONFIG[entityType].dataModels[type].schema;

                    for (const field of schema) {
                        if (field.options.compendiumIndexField) indexFields.push(field.fieldPath);
                    }
                }

                const content = await pack.getIndex({ indexFields });
                this.setCompendiumArt(pack.collection, content);
                data = this.loadedPacks[entityType][packId] = {
                    pack,
                    content
                };

            }

            pct++;

            ui.notifications.update(progress, {message: `Loading ${pack.metadata.label}...`, pct: (pct / packs.length) });

            yield data;
        }

        ui.notifications.remove(progress);
    }

    /**
     * @param {string} packName
     * @param {Collection<string, object>[]} index
     */
    setCompendiumArt(packName, index) {
        if (!packName.startsWith("sfrpg.")) return;
        for (const record of index) {
            const entry = game.sfrpg.compendiumArt.map.get(`Compendium.${packName}.${record._id}`);
            const art = entry?.actor ?? entry?.item;
            record.img = art ?? record.img;
        }
    }
}

export const packLoader = new PackLoader();
