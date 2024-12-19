import Progress from '../progress.js';

export class PackLoader {
    constructor() {
        this.loadedPacks = {
            Actor: {},
            Item: {}
        };
    }

    async *loadPacks(entityType, packs) {
        if (!this.loadedPacks[entityType]) this.loadedPacks[entityType] = {};

        const progress = new Progress({
            steps: packs.length
        });

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

            progress.advance(`Loading ${pack.metadata.label}`);

            yield data;
        }

        progress.close('Loading complete');
    }

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
