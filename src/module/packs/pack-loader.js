/**
 * @import { CompendiumCollection } from "@client/documents/collections/_module.mjs";
 * @import Collection from "@common/utils/collection.mjs";
*/

export class PackLoader {
    constructor() {
        this.loadedPacks = {
            Actor: {},
            Item: {}
        };
    }

    /**
     * @param {"Actor"|"Item"} entityType
     * @param {string[]} packs An array of pack IDs
     */
    async *loadPacks(entityType, packs) {
        if (!this.loadedPacks[entityType]) this.loadedPacks[entityType] = {};

        const progress = ui.notifications.notify("Loading packs...", "info", { progress: true });
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

            /** @type {CompendiumCollection} */
            const pack = data?.pack || game.packs.get(packId);
            if (pack.documentName !== entityType) continue;

            if (!data) {
                const content = await pack.getIndex({ fields });
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
     * @param {Collection[]} index
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
