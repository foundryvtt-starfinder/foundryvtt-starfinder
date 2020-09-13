const { AsyncNedb } = require('nedb-async');
const archiver = require('archiver');
const argv = require('yargs').argv;
const chalk = require('chalk');
const fs = require('fs-extra');
const gulp = require('gulp');
const less = require('gulp-less');
const path = require('path');
const sanitize = require("sanitize-filename");
const stringify = require('json-stringify-pretty-compact');

const SFRPG_LESS = ["src/less/*.less"];

function getConfig() {
	const configPath = path.resolve(process.cwd(), 'foundryconfig.json');
	let config;

	if (fs.existsSync(configPath)) {
		config = fs.readJSONSync(configPath);
		return config;
	} else {
		return;
	}
}

function getManifest() {
	const json = {};

	if (fs.existsSync('src')) {
		json.root = 'src';
	} else {
		json.root = 'dist';
	}

	const modulePath = path.join(json.root, 'module.json');
	const systemPath = path.join(json.root, 'system.json');

	if (fs.existsSync(modulePath)) {
		json.file = fs.readJSONSync(modulePath);
		json.name = 'module.json';
	} else if (fs.existsSync(systemPath)) {
		json.file = fs.readJSONSync(systemPath);
		json.name = 'system.json';
	} else {
		return;
	}

	return json;
}

/********************/
/*		BUILD		*/
/********************/

/**
 * Build Less
 */
function buildLess() {
	const name = 'sfrpg';

	return gulp
		.src(`src/less/${name}.less`)
		.pipe(less())
		.pipe(gulp.dest('dist'));
}

/**
 * Copy static files
 */
async function copyFiles() {
	const name = 'sfrpg';

	const statics = [
		'lang',
		'fonts',
		'images',
		'templates',
		'icons',
		'packs',
		'module',
		`${name}.js`,
		'module.json',
		'system.json',
		'template.json',
	];
	try {
		for (const file of statics) {
			if (fs.existsSync(path.join('src', file))) {
				await fs.copy(path.join('src', file), path.join('dist', file));
			}
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/**
 * Does the same as copyFiles, except it only moves the 
 * README, OGL, and LICENSE files. These aren't needed for
 * development, but they should be in the package.
 */
async function copyReadmeAndLicenses() {
	const statics = ["README.md", "OGL", "LICENSE"];

	try {
		for (const file of statics) {
			if (fs.existsSync(file)) {
				await fs.copy(file, path.join('dist', file));
			}
		}

		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

async function copyLibs() {
	const tippyLib = "tippy.js/dist/tippy.umd.min.js";
	const tippyMap = "tippy.js/dist/tippy.umd.min.js.map";
	const popperLib = "@popperjs/core/dist/umd";

	const cssFile = "tippy.js/dist/tippy.css";
	const nodeModulesPath = "node_modules";

	try {
		await fs.copy(path.join(nodeModulesPath, tippyLib), "dist/lib/tippy/tippy.min.js");
		await fs.copy(path.join(nodeModulesPath, tippyMap), "dist/lib/tippy/tippy.umd.min.js.map");
		await fs.copy(path.join(nodeModulesPath, popperLib), "dist/lib/popperjs/core");
		await fs.copy(path.join(nodeModulesPath, cssFile), "dist/styles/tippy.css");

		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
	gulp.watch('src/**/*.less', { ignoreInitial: false }, buildLess);
	gulp.watch(
		['src/fonts', 'src/templates', 'src/lang', 'src/*.json', 'src/**/*.js'],
		{ ignoreInitial: false },
		copyFiles
	);
}

/**
 * Unpack existing db files into json files.
 */
async function unpack(sourceDatabase, outputDirectory) {
    await fs.mkdir(`${outputDirectory}`, { recursive: true }, (err) => { if (err) throw err; });
    
    let db = new AsyncNedb({ filename: sourceDatabase, autoload: true });
    let items = await db.asyncFind({});
    
    for (let item of items) {
        let jsonOutput = JSON.stringify(item, null, 2);
        let filename = sanitize(item.name);
        filename = filename.replace(/[\s]/g,"_");
        filename = filename.replace(/[,;]/g,"");
        filename = filename.toLowerCase();
        
        let targetFile = `${outputDirectory}/${filename}.json`;
        await fs.writeFileSync(targetFile, jsonOutput, {"flag": "w"});
    }
}
 
async function unpackPacks() {
    console.log(`Unpacking all packs`);
    
    let sourceDir = "./src/packs";
    let files = await fs.readdirSync(sourceDir);
    for (let file of files) {
        if (file.endsWith(".db")) {
            let fileWithoutExt = file.substr(0, file.length - 3);
            let unpackDir = `./src/items/${fileWithoutExt}`;
            let sourceFile = `${sourceDir}/${file}`;
            
            console.log(`Processing ${fileWithoutExt}`);

            console.log(`> Cleaning up ${unpackDir}`);
            await fs.rmdirSync(unpackDir, {recursive: true});

            console.log(`> Unpacking ${sourceFile} into ${unpackDir}`);
            await unpack(sourceFile, unpackDir);

            console.log(`> Done.`);
        }
    }

    console.log(`\nUnpack finished.\n`);
    
    return 0;
}

/**
 * Cook db source json files into .db files with nedb
 */
var cookErrorCount = 0;
var cookAborted = false;
var packErrors = {};
async function cookPacks() {
    console.log(`Cooking db files`);
    
    let compendiumMap = {};
    let allItems = [];
    
    cookErrorCount = 0;
    cookAborted = false;
    packErrors = {};
    
    let sourceDir = "./src/items";
    let directories = await fs.readdirSync(sourceDir);
    for (let directory of directories) {
        let itemSourceDir = `${sourceDir}/${directory}`;
        let outputFile = `./src/packs/${directory}.db`;
        
        console.log(`Processing ${directory}`);
        
        if (fs.existsSync(outputFile)) {
            console.log(`> Removing ${outputFile}`);
            await fs.unlinkSync(outputFile);
        }
        
        compendiumMap[directory] = {};
        
        let db = new AsyncNedb({ filename: outputFile, autoload: true });
        
        console.log(`Opening files in ${itemSourceDir}`);
        let files = await fs.readdirSync(itemSourceDir);
        for (let file of files) {
            let filePath = `${itemSourceDir}/${file}`;
            let jsonInput = await fs.readFileSync(filePath);
            try {
                jsonInput = JSON.parse(jsonInput);
                
            } catch (err) {
                if (!(directory in packErrors)) {
                    packErrors[directory] = [];
                }
                packErrors[directory].push(`${filePath}: Error parsing file: ${err}`);
                cookErrorCount++;
                continue;
            }
            
            compendiumMap[directory][jsonInput._id] = jsonInput;
            allItems.push({pack: directory, data: jsonInput, file: file});
            
            await db.asyncInsert(jsonInput);
        }
    }
    
    if (cookErrorCount > 0) {
        console.log(`\nCritical parsing errors occurred, aborting cook.`);
        cookAborted = true;
        return 1;
    }
    
    console.log(`\nStarting consistency check.`);
    
    for (let item of allItems) {
        let data = item.data;
        if (!data || !data.data || !data.data.description) continue;
        
        let desc = data.data.description.value;
        if (!desc) continue;
        
        let pack = item.pack;
        
        let errors = [];
        let itemMatch = [...desc.matchAll(/@Item\[([^\]]*)\]({([^}]*)})?/gm)];
        if (itemMatch && itemMatch.length > 0) {
            for (let localItem of itemMatch) {
                let localItemId = localItem[1];
                let localItemName = localItem[2] || localItemId;

                // @Item links cannot exist in compendiums.
                if (!(pack in packErrors)) {
                    packErrors[pack] = [];
                }
                packErrors[pack].push(`${item.file}: Using @Item to reference to '${localItemName}' (with id: ${localItemId}), @Item is not allowed in compendiums. Please use '@Compendium[sfrpg.${pack}.${localItemId}]' instead.`);
                cookErrorCount++;
            }
        }
        
        let journalMatch = [...desc.matchAll(/@JournalEntry\[([^\]]*)\]({([^}]*)})?/gm)];
        if (journalMatch && journalMatch.length > 0) {
            for (let localItem of journalMatch) {
                let localItemId = localItem[1];
                let localItemName = localItem[2] || localItemId;

                // @Item links cannot exist in compendiums.
                if (!(pack in packErrors)) {
                    packErrors[pack] = [];
                }
                packErrors[pack].push(`${item.file}: Using @JournalEntry to reference to '${localItemName}' (with id: ${localItemId}), @JournalEntry is not allowed in compendiums. Please use '@Compendium[sfrpg.${pack}.${localItemId}]' instead.`);
                cookErrorCount++;
            }
        }
        
        let compendiumMatch = [...desc.matchAll(/@Compendium\[([^\]]*)]({([^}]*)})?/gm)];
        if (compendiumMatch && compendiumMatch.length > 0) {
            for (let otherItem of compendiumMatch) {
                let link = otherItem[1];
                let otherItemName = (otherItem.length == 4) ? otherItem[3] || link : link;
                
                let linkParts = link.split('.');
                if (linkParts.length !== 3) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: Compendium link to '${link}' is not valid. It does not have enough segments in the link. Expected format is sfrpg.compendiumName.itemId.`);
                    cookErrorCount++;
                    continue;
                }
                
                let system = linkParts[0];
                let otherPack = linkParts[1];
                let otherItemId = linkParts[2];

                // @Compendium links must link to sfrpg compendiums.
                if (system !== "sfrpg") {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: Compendium link to '${otherItemName}' (with id: ${otherItemId}) is not referencing the sfrpg system, but instead using '${system}'.`);
                    cookErrorCount++;
                }
                
                // @Compendium links to the same compendium could be @Item links instead.
                /*if (otherPack === pack) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: Compendium link to '${otherItemName}' (with id: ${otherItemId}) is referencing the same compendium, consider using @Item[${otherItemId}] instead.`);
                    cookErrorCount++;
                }*/
                
                // @Compendium links must link to a valid compendium.
                if (!(otherPack in compendiumMap)) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: '${otherItemName}' (with id: ${otherItemId}) cannot find '${otherPack}', is there an error in the compendium name?`);
                    cookErrorCount++;
                    continue;
                }
                
                // @Compendium links must link to a valid item ID.
                var itemExists = false;
                if (otherItemId in compendiumMap[otherPack]) {
                    itemExists = true;
                } else {
                    let foundItem = allItems.find(x => x.pack === otherPack && (x.data.name == otherItemId || x.data.name == otherItemName));
                    itemExists = foundItem !== null;
                }
                
                if (!itemExists) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: '${otherItemName}' (with id: ${otherItemId}) not found in '${otherPack}'.`);
                    cookErrorCount++;
                }
            }
        }
    }

    console.log(`\nUpdating items with updated IDs.\n`);
    
    await unpackPacks();
    
    console.log(`\nCook finished with ${cookErrorCount} errors.\n`);

    return 0;
}

async function postCook() {
    
    if (Object.keys(packErrors).length > 0) {
        for (let pack of Object.keys(packErrors)) {
            console.log(`\n${packErrors[pack].length} Errors cooking ${pack}.db:`);
            for (let error of packErrors[pack]) {
                console.log(`> ${error}`);
            }
        }
    }
    
    if (!cookAborted) {
        console.log(`\nCompendiums cooked with ${cookErrorCount} errors!\nDon't forget to restart Foundry to refresh compendium data!\n`);
    } else {
        console.log(`\nCook aborted after ${cookErrorCount} critical errors!\n`);
    }
    return 0;
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
async function clean() {
	const name = 'sfrpg';
	const files = [];

	files.push(
		'lang',
		'templates',
		'module',
		'fonts',
		'icons',
		'images',
		'packs',
		'lib',
		'styles',
		`${name}.js`,
		`${name}.css`,
		'module.json',
		'system.json',
		'template.json',
		'README.md',
		'OGL',
		'LICENSE'
	);

	console.log(' ', chalk.yellow('Files to clean:'));
	console.log('   ', chalk.blueBright(files.join('\n    ')));

	// Attempt to remove the files
	try {
		for (const filePath of files) {
			await fs.remove(path.join('dist', filePath));
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
	const name = 'sfrpg';
	const config = fs.readJSONSync('foundryconfig.json');

	let destDir;
	try {
		if (
			fs.existsSync(path.resolve('.', 'dist', 'module.json')) ||
			fs.existsSync(path.resolve('.', 'src', 'module.json'))
		) {
			destDir = 'modules';
		} else if (
			fs.existsSync(path.resolve('.', 'dist', 'system.json')) ||
			fs.existsSync(path.resolve('.', 'src', 'system.json'))
		) {
			destDir = 'systems';
		} else {
			throw Error(
				`Could not find ${chalk.blueBright(
					'module.json'
				)} or ${chalk.blueBright('system.json')}`
			);
		}

		let linkDir;
		if (config.dataPath) {
			if (!fs.existsSync(path.join(config.dataPath, 'Data')))
				throw Error('User Data path invalid, no Data directory found');

			linkDir = path.join(config.dataPath, 'Data', destDir, name);
		} else {
			throw Error('No User Data path defined in foundryconfig.json');
		}

		if (argv.clean || argv.c) {
			console.log(
				chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`)
			);

			await fs.remove(linkDir);
		} else if (!fs.existsSync(linkDir)) {
			console.log(
				chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`)
			);
			await fs.symlink(path.resolve('./dist'), linkDir);
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
	const manifest = getManifest();

	try {
		// Remove the package dir without doing anything else
		if (argv.clean || argv.c) {
			console.log(chalk.yellow('Removing all packaged files'));
			await fs.remove('package');
			return;
		}

		// Ensure there is a directory to hold all the packaged versions
		await fs.ensureDir('package');

		// Initialize the zip file
		const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
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
		zip.directory('dist/', manifest.file.name);

		zip.finalize();
	} catch (err) {
		Promise.reject(err);
	}
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Update version and URLs in the manifest JSON
 */
function updateManifest(cb) {
	const packageJson = fs.readJSONSync('package.json');
	const config = getConfig(),
		manifest = getManifest(),
		rawURL = config.rawURL,
		repoURL = config.repository,
		manifestRoot = manifest.root;

	if (!config) cb(Error(chalk.red('foundryconfig.json not found')));
	if (!manifest) cb(Error(chalk.red('Manifest JSON not found')));
	if (!rawURL || !repoURL)
		cb(
			Error(
				chalk.red(
					'Repository URLs not configured in foundryconfig.json'
				)
			)
		);

	try {
		const version = argv.update || argv.u;

		/* Update version */

		const versionMatch = /^(\d{1,}).(\d{1,}).(\d{1,})$/;
		const currentVersion = manifest.file.version;
		let targetVersion = '';

		if (!version) {
			cb(Error('Missing version number'));
		}

		if (versionMatch.test(version)) {
			targetVersion = version;
		} else {
			targetVersion = currentVersion.replace(
				versionMatch,
				(substring, major, minor, patch) => {
					if (version === 'major') {
						return `${Number(major) + 1}.0.0`;
					} else if (version === 'minor') {
						return `${major}.${Number(minor) + 1}.0`;
					} else if (version === 'patch') {
						return `${major}.${minor}.${Number(minor) + 1}`;
					} else {
						return '';
					}
				}
			);
		}

		if (targetVersion === '') {
			return cb(Error(chalk.red('Error: Incorrect version arguments.')));
		}

		if (targetVersion === currentVersion) {
			return cb(
				Error(
					chalk.red(
						'Error: Target version is identical to current version.'
					)
				)
			);
		}
		console.log(`Updating version number to '${targetVersion}'`);

		packageJson.version = targetVersion;
		manifest.file.version = targetVersion;

		/* Update URLs */

		const result = `${rawURL}/v${manifest.file.version}/package/${manifest.file.name}-v${manifest.file.version}.zip`;

		manifest.file.url = repoURL;
		manifest.file.manifest = `${rawURL}/master/${manifestRoot}/${manifest.name}`;
		manifest.file.download = result;

		const prettyProjectJson = stringify(manifest.file, { maxLength: 35 });

		fs.writeJSONSync('package.json', packageJson, { spaces: 2 });
		fs.writeFileSync(
			path.join(manifest.root, manifest.name),
			prettyProjectJson,
			'utf8'
		);

		return cb();
	} catch (err) {
		cb(err);
	}
}

const execBuild = gulp.parallel(buildLess, copyFiles, copyLibs);

exports.build = gulp.series(clean, execBuild);
exports.watch = buildWatch;
exports.clean = clean;
exports.link = linkUserData;
exports.libs = copyLibs;
exports.package = gulp.series(copyReadmeAndLicenses, packageBuild);
exports.publish = gulp.series(
	clean,
	updateManifest,
	execBuild,
	copyReadmeAndLicenses,
	packageBuild
);
exports.cook = gulp.series(cookPacks, clean, execBuild, postCook);
exports.unpack = unpackPacks;
exports.default = gulp.series(clean, execBuild);
