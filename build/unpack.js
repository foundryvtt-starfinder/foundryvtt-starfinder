import chalk from "chalk";
import fs from "fs-extra";
import url from "node:url";
import path from "path";
import sanitize from "sanitize-filename";
import { sanitizeJSON } from "./cook.js";
import LevelDatabase from "./lib/level-database.js";
import { JSONstringifyOrder, measureTime } from "./util.js";

/**
 * Unpack existing db files into json files.
 */

// Run only if this file is executed directly
const modulePath = url.fileURLToPath(import.meta.url);
if (path.resolve(modulePath) === path.resolve(process.argv[1])) {
    measureTime(async () => {
        await unpackPacks(false);
    });
}

async function unpack({packName, filePath, outputDirectory, partOfCook = false}) {
    console.log(`> Starting unpack of ${packName} into ${outputDirectory}`);
    fs.mkdir(`${outputDirectory}`, { recursive: true }, (err) => {
        if (err)
            throw err;
    });

    const db = new LevelDatabase(filePath, { packName });
    const { items, folders } = await db.getEntries();

    const promises = [];

    if (folders.length) {
        const folderMap = new Map();
        const getFolderPath = (folder, parts = []) => {
            if (parts.length > 3) {
                throw (
                    `Error: Maximum folder depth exceeded for "${folder.name}" in pack: ${packName}`
                );
            }

            parts.unshift(
                sanitize(folder.name)
                    .replace(/[\s]/g, "_")
                    .replace(/[,;]/g, "")
                    .toLowerCase()
            );
            if (folder.folder) {
                // This folder is inside another folder
                const parent = folders.find((f) => f._id === folder.folder);
                if (!parent) {
                    throw (`Error: Unknown parent folder id [${folder.folder}] in pack: ${packName}`);
                }
                return getFolderPath(parent, parts);
            }
            parts.unshift(packName);
            return path.join(...parts);
        };

        for (const folder of folders) {
            folderMap.set(folder._id, getFolderPath(folder));
        }
        const folderFilePath = path.resolve(outputDirectory, "_folders.json");
        promises.push(fs.writeFile(folderFilePath, JSONstringifyOrder(folders, 2), "utf-8"));
    }

    for (const item of items) {
        const cleanItem = partOfCook ? item : sanitizeJSON(item);
        const jsonOutput = JSONstringifyOrder(cleanItem, 2, "item");
        const filename = sanitize(item.name)
            .replace(/[\s]/g, "_")
            .replace(/[,;]/g, "")
            .toLowerCase();

        const targetFile = `${outputDirectory}/${filename}.json`;
        promises.push(fs.writeFile(targetFile, jsonOutput, { "flag": "w" }));
    }

    await Promise.all(promises);
    console.log(chalk.green(`${packName} unpack complete.`));
}

export async function unpackPacks(partOfCook = false) {
    // For now, there is no limitToPack functionality, but the bones of it have been left in
    // and it could be re-added in the future
    const limitToPack = null;
    const sourceDir = partOfCook ? "src/packs" : 'dist/packs';
    console.log(chalk.blueBright(`Unpacking ${partOfCook ? "" : "and sanitizing "}all packs from ${sourceDir}`));

    if (!fs.existsSync(sourceDir)) {
        fs.mkdir(sourceDir, { recursive: true }, (err) => {
            if (err)
                throw err;
        });
    }

    const entries = fs.readdirSync(sourceDir, {withFileTypes: true});
    const folders = entries.filter(f => !f.isFile());
    const promises = [];
    for (const folderEntry of folders) {
        const folder = folderEntry.name;

        if ((limitToPack
            && !folder.includes(limitToPack))
            || folder.endsWith(".db") // Skip NeDB!
        ) {
            continue;
        }

        const unpackDir = `./src/items/${folder}`;
        const packDir = `${sourceDir}/${folder}`;

        /* console.log(`> Cleaning up ${unpackDir}`);
        fs.rmdirSync(unpackDir, { recursive: true }); */

        promises.push(unpack({packName: folder, filePath: packDir, outputDirectory: unpackDir, partOfCook}));

    }

    await Promise.all(promises);
    console.log(`\nUnpack finished.\n`);

    return 0;
}
