import Progress from '../progress.js';

export class PackLoader {
    constructor() {
        this.loadedPacks = {
            Actor: {},
            Item: {}
        };
    }

    async *loadPacks(entityType, packs) {
        if (!this.loadedPacks[entityType]) {
            this.loadedPacks[entityType] = {};
        } // TODO: i18n for progress bar

        const progress = new Progress({
            steps: packs.length
        });

        for (const packId of packs) {
            let data = this.loadedPacks[entityType][packId];

            if (!data) {
                const pack = game.packs.get(packId);
                progress.advance(`Loading ${pack.metadata.label}`);

                if (pack.documentName === entityType) {
                    const fields = [
                        "type",
                        "system.level"
                    ];
                    if (entityType === "Actor") {
                        fields.push(...[
                            "system.details.cr",
                            "system.attributes.hp.max",
                            "system.details.type",
                            "system.traits.size",
                            "system.details.organizationSize",
                            "system.details.alignment"
                        ]);
                    } else {
                        fields.push(...[
                            "system.pcu",
                            "system.cost",
                            "system.weaponCategory",
                            "system.weaponType",
                            "system.school",
                            "system.allowedClasses"
                        ]);
                    }
                    const content = await pack.getIndex({"fields": fields });
                    data = this.loadedPacks[entityType][packId] = {
                        pack,
                        content
                    };
                } else {
                    continue;
                }
            } else {
                const {
                    pack
                } = data;
                progress.advance(`Loading ${pack.metadata.label}`);
            }

            yield data;
        }

        progress.close('Loading complete');
    }
}

export const packLoader = new PackLoader();
