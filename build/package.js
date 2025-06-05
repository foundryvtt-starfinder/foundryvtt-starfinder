import archiver from "archiver";
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";
import { argv } from "node:process";
import url from "node:url";
import { getManifest } from "./util.js";

async function packageBuild() {
    const manifest = getManifest();

    try {
        // Remove the package dir without doing anything else
        if (argv.clean || argv.c) {
            console.log(chalk.yellow('Removing all packaged files'));
            await fs.rm('package');
            return;
        }

        // Ensure there is a directory to hold all the packaged versions
        await fs.ensureDir('package');

        // Initialize the zip file
        const zipName = `${manifest.file.id}-${manifest.file.version}.zip`;
        const zipFile = fs.createWriteStream(path.join('package', zipName));
        const zip = archiver('zip', { zlib: { level: 9 } });

        zipFile.on('close', () => {
            console.log(chalk.green(zip.pointer() + ' total bytes'));
            console.log(chalk.green(`Zip file ${zipName} has been written`));
            return Promise.resolve();
        });

        zip.on('error', err => {
            throw err;
        });

        zip.pipe(zipFile);

        // Add the directory with the final code
        zip.directory('dist/', manifest.file.id);

        // Copy the system.json file to the package directory
        fs.copyFile('static/system.json', 'package/system.json');

        await zip.finalize();
    } catch (err) {
        Promise.reject(err);
    }
}

// Run only if this file is executed directly
const modulePath = url.fileURLToPath(import.meta.url);
if (path.resolve(modulePath) === path.resolve(process.argv[1])) {
    packageBuild();
}
