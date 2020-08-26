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

                if (pack.metadata.entity === entityType) {
                    const content = await pack.getContent();
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
