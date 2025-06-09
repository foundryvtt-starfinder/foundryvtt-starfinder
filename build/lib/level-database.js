import chalk from "chalk";
import { ClassicLevel } from "classic-level";
import isObject from "../../src/module/utils/is-object.js";
import { getManifest } from "../util.js";

export default class LevelDatabase extends ClassicLevel {
    DB_KEYS = ["actors", "items", "journal", "macros", "tables"];
    #dbkey;
    #embeddedKey;

    #documentDb;
    #foldersDb;
    #embeddedDb = null;

    constructor(location, options) {
        const dbOptions = options.dbOptions ?? { keyEncoding: "utf8", valueEncoding: "json" };
        super(location, dbOptions);

        const { dbKey, embeddedKey } = this.#getDBKeys(options.packName);

        this.#dbkey = dbKey;
        this.#embeddedKey = embeddedKey;

        this.#documentDb = this.sublevel(dbKey, dbOptions);
        this.#foldersDb = this.sublevel("folders", dbOptions);
        if (this.#embeddedKey) {
            this.#embeddedDb = this.sublevel(
                `${this.#dbkey}.${this.#embeddedKey}`,
                dbOptions
            );
        }
    }

    async createPack(docSources, folders, packName) {

        const isDoc = (source) => {
            return isObject(source) && "_id" in source;
        };

        const docBatch = this.#documentDb.batch();
        const embeddedBatch = this.#embeddedDb?.batch();

        const promises = [];

        for (const source of docSources) {
            if (this.#embeddedKey) {
                const embeddedDocs = source[this.#embeddedKey];
                if (Array.isArray(embeddedDocs)) {
                    for (let i = 0; i < embeddedDocs.length; i++) {
                        const doc = embeddedDocs[i];
                        if (isDoc(doc) && embeddedBatch) {
                            embeddedBatch.put(`${source._id}.${doc._id}`, doc);
                            embeddedDocs[i] = doc._id;
                        }
                    }
                }
            }

            docBatch.put(source._id, source);
        }
        promises.push(docBatch.write());
        if (embeddedBatch?.length) {
            promises.push(embeddedBatch.write());
        }
        if (folders.length) {
            const folderBatch = this.#foldersDb.batch();
            for (const folder of folders) {
                folderBatch.put(folder._id, folder);
            }
            promises.push(folderBatch.write());
        }

        await Promise.all(promises);

        await this.compactClassicLevel();

        this.close();
        console.log(chalk.greenBright(`> Finished processing data for ${packName}.`));
    }

    async getEntries() {
        const items = [];
        for await (const [docId, source] of this.#documentDb.iterator()) {
            const embeddedKey = this.#embeddedKey;
            if (embeddedKey && source[embeddedKey] && this.#embeddedDb) {
                const embeddedDocs = await this.#embeddedDb.getMany(
                    source[embeddedKey]?.map((embeddedId) => `${docId}.${embeddedId}`) ?? []
                );
                source[embeddedKey] = embeddedDocs.filter(i => !!i);
            }
            items.push(source);
        }
        const folders = [];
        for await (const [_key, folder] of this.#foldersDb.iterator()) {
            folders.push(folder);
        }
        await this.close();

        return { items, folders };
    }

    #getDBKeys(packName) {
        const DB_KEYS = ["actors", "items", "journal", "macros", "tables"];
        const manifest = getManifest().file;
        const metadata = manifest.packs.find((p) => p.path.endsWith(packName));
        if (!metadata) {
            throw (
                `Error generating dbKeys: Compendium ${packName} has no metadata in the local system.json file.`
            );
        }

        const dbKey = (() => {
            switch (metadata.type) {
                case "JournalEntry":
                    return "journal";
                case "RollTable":
                    return "tables";
                default: {
                    const key = `${metadata.type.toLowerCase()}s`;
                    if (DB_KEYS.includes(key)) {
                        return key;
                    }
                    throw (`Unkown Document type: ${metadata.type}`);
                }
            }
        })();
        const embeddedKey = (() => {
            switch (dbKey) {
                case "actors":
                    return "items";
                case "journal":
                    return "pages";
                case "tables":
                    return "results";
                default:
                    return null;
            }
        })();
        return { dbKey, embeddedKey };
    }

    /** Flushes the log of the given database to create compressed binary tables.
    * @this {ClassicLevel}
    */
    async compactClassicLevel() {
        const forwardIterator = this.keys({ limit: 1, fillCache: false });
        const firstKey = await forwardIterator.next();
        forwardIterator.close();

        const backwardIterator = this.keys({ limit: 1, reverse: true, fillCache: false });
        const lastKey = await backwardIterator.next();
        backwardIterator.close();

        if (firstKey && lastKey) return this.compactRange(firstKey, lastKey, { keyEncoding: "utf8" });
    }
}
