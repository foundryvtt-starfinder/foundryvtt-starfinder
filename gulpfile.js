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
const jsdom = require("jsdom");
const terser = require("gulp-terser");
const sourcemaps = require("gulp-sourcemaps");
const cssClean = require('gulp-clean-css');

const { JSDOM } = jsdom;
const { window } = new JSDOM();

const $ = require("jquery")(window);

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

/** ******************/
/*		BUILD		*/
/** ******************/

/**
 * Build Less
 */
async function buildLess() {
    const name = 'sfrpg';

    return gulp
        .src(`src/less/${name}.less`)
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(cssClean())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('dist'));
}

/**
 * Copy static files
 */
async function copyFiles() {

    // Build static files first
    gulp.src([
        'src/fonts/*',
        'src/icons/*',
        'src/icons/**/*',
        'src/images/**/*',
        'src/images/*',
        'src/lang/*.json',
        'src/packs/*.db',
        'src/templates/**/*.hbs',
        "src/*.json"
    ])
        .pipe(gulp.dest((file) => file.base.replace("\\src", "\\dist")));

    // Then pipe in js files to be minified
    gulp.src('src/sfrpg.js')
        .pipe(sourcemaps.init())
        // Minify the JS
        .pipe(terser({
            ecma: 2016,
            compress: {
                module: true
            }
        }))
        .pipe(sourcemaps.write('./maps'))
        // Output
        .pipe(gulp.dest('dist'));

    return gulp.src([
        'src/module/**/*.js',
        'src/module/*.js'
    ])
        .pipe(sourcemaps.init())
        // Minify the JS
        .pipe(terser({
            ecma: 2016,
            compress: {
                module: true
            }
        }))
        .pipe(sourcemaps.write('./maps'))
        // Output
        .pipe(gulp.dest('dist/module'));

}

/**
 * Copy only those files that we want to watch while developing.
 *
 * Over time, with the inclusion of tons of images and icons, the number
 * of files that are being copied over to the dist folder has increased by
 * a large amount. This was causing the watch process to slow to a crawl while
 * it re copied a bunch of static files. This method is only concerned with copying
 * files that might actually change during development.
 */
async function copyWatchFiles() {
    const name = 'sfrpg';

    // Don't minify on build:watch in order to give quickest build time.
    gulp.src([
        'src/lang/*.json',
        'src/templates/**/*.hbs',
        "src/*.json"
    ])
        .pipe(gulp.dest((file) => file.base.replace("\\src", "\\dist")));

    gulp.src(`src/${name}.js`)
        .pipe(gulp.dest('dist'));

    return gulp.src([
        'src/module/**/*.js',
        'src/module/*.js'
    ])
        .pipe(gulp.dest('dist/module'));
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
    gulp.watch('src/**/*.less', { ignoreInitial: true }, buildLess);
    gulp.watch(
        ['src/fonts', 'src/templates', 'src/lang', 'src/*.json', 'src/**/*.js'],
        { ignoreInitial: true },
        copyWatchFiles
    );
}

/**
 * Sorts the keys in a JSON object, which should make it easier to find data keys.
 */
function JSONstringifyOrder( obj, space, sortingMode = "default" ) {
    let allKeys = [];
    let seen = {};
    JSON.stringify(obj, function(key, value) {
        if (!(key in seen)) {
            allKeys.push(key);
            seen[key] = null;
        }
        return value;
    });
    allKeys.sort();

    if (sortingMode === "item") {
        // Ensure name is after _id, and type is after name.
        const idIndex = allKeys.indexOf("_id");

        const nameIndex = allKeys.indexOf("name");
        if (nameIndex > -1) {
            allKeys.splice(nameIndex, 1);
            allKeys.splice(idIndex + 1, 0, "name");
        }

        const typeIndex = allKeys.indexOf("type");
        if (typeIndex > -1) {
            allKeys.splice(typeIndex, 1);
            allKeys.splice(idIndex + 2, 0, "type");
        }
    }

    return JSON.stringify(obj, allKeys, space);
}

/**
 * Cleans compendium entries of superfluous data, sanitizes HTML and applies some defaults to prototype tokens
 * Some parts adapted from PF2e: https://github.com/foundryvtt/pf2e/blob/master/packs/scripts/extract.ts
 * Under the Apache 2.0 License: https://www.apache.org/licenses/LICENSE-2.0
 * @param {Object} jsonInput An object representing the current JSON being unpacked/cooked
 * @returns {Object} A sanitized object
 */
function sanitizeJSON(jsonInput) {
    const treeShake = (item) => {
        delete item.sort;
        delete item.folder;
        delete item._stats;
        delete item.permission;
        delete item.ownership;
        delete item.effects;

        delete item.flags?.exportSource;
        delete item.flags?.sourceId;
        delete item.flags?.core?.exportSource;
        delete item.flags?.core?.sourceId;

        // Remove leading or trailing spaces
        item.name = item.name.trim();
        // Replace forge URLs
        item.img &&= item.img.replace(
            "https://assets.forge-vtt.com/bazaar/systems/sfrpg/assets/",
            "systems/sfrpg/"
        );
        item.img &&= item.img.replace(
            "https://assets.forge-vtt.com/bazaar/core/",
            ""
        );

        if (item.type === "npc2" && !item?.system?.attributes?.sp?.max > 0) {
            delete item?.system?.attributes?.sp;
        }

        if (item.type === "npc2" && !item?.system?.attributes?.rp?.max > 0) {
            delete item?.system?.attributes?.rp;
        }
    };

    // Clean up description HTML
    const _cleanDescription = (description) => {
        if (!description) {
            return "";
        }

        const $description = (() => {
            try {
                return $(
                    description.startsWith("<p>") && /<\/(?:p|ol|ul|table)>$/.test(description)
                        ? description
                        : `<p>${description}</p>`
                );
            } catch (error) {
                console.error(error);
                throw Error(`Failed to parse description of ${jsonInput.name} (${jsonInput._id}):\n${description}`);
            }
        })();

        // Strip out span tags from AoN copypasta
        // TODO: div doesn't seem to work consistently
        const selectors = [
            "span[class*='fontstyle']",
            "span[id*='ctl00']",
            "div"
        ];
        for (const selector of selectors) {
            $description.find(selector).each((_i, span) => {
                $(span)
                    .contents()
                    .unwrap(selector)
                    .each((_j, node) => {
                        if (node.nodeName === "#text") {
                            node.textContent = node.textContent.trim();
                        }
                    });
            });
        }

        // Remove other needless classes from AoN/PDF copypasta
        const classes = [
            "*.title",
            "*[style*='text-align: justify']",
            "*[title*='Page']",
            "*[style*='font-family']",
            "*[style*='font-size']"
        ];

        for (const selector of classes) {
            $description.find(selector).each((_i, el) => {
                $(el)
                    .removeAttr("style title")
                    .removeClass("title")
                    .filter('*[class=""]')
                    .removeAttr('class');
            });
        }

        // Replace erroneously copied links with actually working ones
        $description.find("i[class*='fas']").remove();
        const fakeLink = $description.find("a.entity-link, a.content-link");
        if (fakeLink.length > 0) {
            fakeLink.each((index, el) => {
                const element = $(el);
                const compendium = element.data("pack");
                const id = element.data("id");
                const text = element.text().trim();
                const uuid = `@UUID[Compendium.${compendium}.${id}]{${text}}`;
                element.replaceWith(uuid);
            });
        }

        // Standardise descriptions with regex
        return $("<div>")
            .append($description)
            .html()
            .replace(/@Compendium\[/g, "@UUID[Compendium.") // Replace @Compendium links with @UUID links
            .replace(/<([hb]r)>/g, "<$1 />") // Prefer self-closing tags
            .replace(/ {2,}/g, " ") // Replace double or more spaces with a single space
            .replace(/<(div|p)>\s*<\/(div|p)>/g, "") // Delete empty <p>s and <div>s
            .replace(/<\/p>\s*<p>/g, "</p>\n<p>") // Replace any spaces between <p>s with a newline
            .replace(/<p>[ \r\n]+/g, "<p>") // Remove any newlines at the start of <p>
            .replace(/[ \r\n]+<\/p>/g, "</p>") // Remove any newlines at the end of <p>
            .replace(/<(?:b|strong)>\s*/g, "<strong>") // Remove whitespace at the start of <strong> tags
            .replace(/\s*<\/(?:b|strong)>/g, "</strong>") // Remove whitespace at the end of <strong> tags
            .replace(/(<\/strong>)(\w)/g, "$1 $2") // Add a space after the end of <strong> tags
            .replace(/<(em)>\s*/g, "<em>") // Remove whitespace at the start of <em> tags
            .replace(/\s*<\/(em)>/g, "</em>") // Remove whitespace at the end of <em> tags
            .replace(/(<\/em>)(\w)/g, "$1 $2") // Add a space after the end of <em> tags
            .replace(/(<p>&nbsp;<\/p>)/g, "") // Delete paragraphs with only a non-breaking space
            .replace(/(<br \/>)+/g, "</p>\n<p>") // Replace any number of <br /> tags with <p>s
            .replace(/(\n)+/g, "\n") // Replace any number of newlines with a single one
            .replace(/(窶・)/g, "—") // For some reason these two characters often appear in place of an em dash
            .trim();
    };

    const sanitizeDescription = (item) => {
        if ("system" in item) {
            if ("description" in item.system) {
                item.system.description.value = _cleanDescription(item.system.description.value);
                if (item.system.description.short) {
                    item.system.description.short = _cleanDescription(item.system.description.short);
                }
            } else if ("details" in item.system) {
                if ("description" in item.system.details) {
                    item.system.details.description.value = _cleanDescription(item.system.details.description.value);
                    if (item.system.details.description.short) {
                        item.system.details.description.short = _cleanDescription(item.system.details.description.short);
                    }
                } else if ("biography" in item.system.details) {
                    item.system.details.biography.value = _cleanDescription(item.system.details.biography.value);
                }
            }
        }
    };

    const cleanFlags = (item) => {
        // Clear rogue flags from modules
        for (const flag in item.flags) {
            if (!["core", "sfrpg"].includes(flag)) {
                delete item.flags[flag];
            }
        }

        // If core or sfrpg is empty, delete it
        if ((typeof item?.flags?.core === "object" && item?.flags?.core !== null) && Object.entries(item?.flags?.core)?.length === 0) {
            delete item.flags.core;
        }

        if ((typeof item?.flags?.sfrpg === "object" && item?.flags?.sfrpg !== null) && Object.entries(item?.flags?.sfrpg)?.length === 0) {
            delete item.flags.sfrpg;
        }

        // If flags is now empty, delete it entirely
        if ((typeof item.flags === "object" && item.flags !== null) && Object.entries(item?.flags)?.length === 0) {
            delete item.flags;
        }
    };

    treeShake(jsonInput);
    cleanFlags(jsonInput);
    sanitizeDescription(jsonInput);

    if (jsonInput.items) {
        for (let item of jsonInput.items) {
            treeShake(item);
            cleanFlags(item);
            sanitizeDescription(item);
        }
    }

    if ("prototypeToken" in jsonInput) {
        const sizeLookup = {
            "fine": 1,
            "diminutive": 1,
            "tiny": 1,
            "small": 1,
            "medium": 1,
            "large": 2,
            "huge": 3,
            "gargantuan": 4,
            "colossal": 6
        };

        // No "character" because iconics come in multiple levels, and we don't want to include level in the token name.
        const actorTypes = [
            "npc",
            "starship",
            "vehicle",
            "npc2",
            "hazard"
        ];

        delete jsonInput.prototypeToken.actorId;
        delete jsonInput.prototypeToken.actorData;

        // Ensure token name is the same as the actor name, if applicable
        if (actorTypes.includes(jsonInput.type)) {
            jsonInput.prototypeToken.name = jsonInput.name;
        }

        jsonInput.prototypeToken.sight.enabled = false; // Sight is disabled for NPCs by default
        jsonInput.prototypeToken.bar1.attribute = "attributes.hp"; // Most tokens have hp as their first bar
        jsonInput.prototypeToken.bar2.attribute = ""; // The 2nd bar is set per token type
        jsonInput.prototypeToken.disposition = -1; // Hostile by default
        jsonInput.prototypeToken.displayBars = 20; // Show bars on hover
        jsonInput.prototypeToken.displayName = 20; // Show name on hover

        if (["npc", "npc2"].includes(jsonInput.type)) {
            if (jsonInput.system?.attributes?.rp?.max > 0) {
                jsonInput.prototypeToken.bar2.attribute = "attributes.rp"; // If the NPC has resolve points, set them as the 2nd bar
            }

            let size = sizeLookup[jsonInput.system.traits.size]; // Set size to match actor's
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        } else if (jsonInput.type === "character") {
            jsonInput.prototypeToken.disposition = 1; // Friendly
            jsonInput.prototypeToken.bar2.attribute = "attributes.sp"; // 2nd bar as stamina
            jsonInput.prototypeToken.sight.enabled = true;

            let size = sizeLookup[jsonInput.system.traits.size];
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        } else if (jsonInput.type === "starship") {
            jsonInput.prototypeToken.disposition = 0; // Neutral
            jsonInput.prototypeToken.bar2.attribute = "attributes.shields"; // 2nd bar as shields
        } else if (jsonInput.type === "vehicle") {
            jsonInput.prototypeToken.disposition = 0; // Neutral

            let size = sizeLookup[jsonInput.system.attributes.size];
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        }

        cleanFlags(jsonInput.prototypeToken);
    }

    return jsonInput;
}

/**
 * Unpack existing db files into json files.
 */
async function unpack(sourceDatabase, outputDirectory, partOfCook = false) {
    fs.mkdir(`${outputDirectory}`, { recursive: true }, (err) => {
        if (err)
            throw err;
    });

    let db = new AsyncNedb({ filename: sourceDatabase, autoload: true });
    let items = await db.asyncFind({});

    for (let item of items) {
        let cleanItem = partOfCook ? item : sanitizeJSON(item);
        let jsonOutput = JSONstringifyOrder(cleanItem, 2, "item");
        let filename = sanitize(item.name);
        filename = filename.replace(/[\s]/g, "_");
        filename = filename.replace(/[,;]/g, "");
        filename = filename.toLowerCase();

        let targetFile = `${outputDirectory}/${filename}.json`;
        fs.writeFileSync(targetFile, jsonOutput, { "flag": "w" });
    }
}

async function gulpUnpackPacks(done, partOfCook = false) {
    await unpackPacks(partOfCook);
}

async function unpackPacks(partOfCook = false) {
    let sourceDir = partOfCook ? "./src/packs" : `${getConfig().dataPath.replaceAll("\\", "/")}/data/systems/sfrpg/packs`;
    console.log(`Unpacking ${partOfCook ? "" : "and sanitizing "}all packs from ${sourceDir}`);

    let files = fs.readdirSync(sourceDir);
    for (let file of files) {
        if (limitToPack && !file.includes(limitToPack)) {
            continue;
        }

        if (file.endsWith(".db")) {
            let fileWithoutExt = file.substr(0, file.length - 3);
            let unpackDir = `./src/items/${fileWithoutExt}`;
            let sourceFile = `${sourceDir}/${file}`;

            console.log(`Processing ${fileWithoutExt}`);

            console.log(`> Cleaning up ${unpackDir}`);
            fs.rmdirSync(unpackDir, { recursive: true });

            console.log(`> Unpacking ${sourceFile} into ${unpackDir}`);
            await unpack(sourceFile, unpackDir, partOfCook);

            console.log(chalk.greenBright(`> Done.`));
        }
    }

    console.log(`\nUnpack finished.\n`);

    return 0;
}

/**
 * Cook db source json files into .db files with nedb
 */
let cookErrorCount = 0;
let cookAborted = false;
let packErrors = {};
let limitToPack = null;
async function cookPacksNoFormattingCheck() {
    await cookWithOptions({ formattingCheck: false });
}
async function cookPacks(params) {
    await cookWithOptions({parameters: params, formattingCheck: true});
}
async function cookWithOptions(options = { formattingCheck: true }) {

    console.log(chalk.blueBright(`Cooking db files`));

    for (let i = 3; i < process.argv.length; i++) {
        if (process.argv[i] === '--pack') {
            limitToPack = process.argv[i + 1];
            i++;
        }
    }

    let compendiumMap = {};
    let allItems = [];

    cookErrorCount = 0;
    cookAborted = false;
    packErrors = {};

    let sourceDir = "./src/items";
    let directories = fs.readdirSync(sourceDir);
    for (let directory of directories) {
        let itemSourceDir = `${sourceDir}/${directory}`;
        let outputFile = `./src/packs/${directory}.db`;

        console.log(`Processing ${directory}`);
        compendiumMap[directory] = {};

        let db = null;
        if (!limitToPack || directory === limitToPack) {
            if (fs.existsSync(outputFile)) {
                console.log(`> Removing ${outputFile}`);
                fs.unlinkSync(outputFile);
            }

            db = new AsyncNedb({ filename: outputFile, autoload: true });
        }

        console.log(`> Reading and sanitizing files in ${itemSourceDir}`);
        let files = fs.readdirSync(itemSourceDir);
        for (let file of files) {
            let filePath = `${itemSourceDir}/${file}`;
            let jsonInput = fs.readFileSync(filePath);
            try {
                jsonInput = JSON.parse(jsonInput);

            } catch (err) {
                if (!(directory in packErrors)) {
                    packErrors[directory] = [];
                }
                packErrors[directory].push(`${chalk.bold(filePath)}: Error parsing file: ${err}`);
                cookErrorCount++;
                continue;
            }

            // Cached conditions to be referenced later
            if (directory === "conditions" && jsonInput.name !== "Invisible") {
                conditionsCache[jsonInput._id] = jsonInput;
            }
            // Cached setting to be referenced later
            else if (directory === "setting") {
                settingCache[jsonInput._id] = jsonInput;
            }

            if (!limitToPack || directory === limitToPack) {
                // sanitize the incoming JSON
                sanitizeJSON(jsonInput);

                // Fix missing images
                if (!jsonInput.img && !jsonInput.pages) {
                    // Skip if a journal
                    jsonInput.img = "icons/svg/mystery-man.svg";
                }

                const movingActorTypes = ["character", "drone", "npc"];
                if (movingActorTypes.includes(jsonInput.type)) {
                    tryMigrateActorSpeed(jsonInput);
                }
            }

            compendiumMap[directory][jsonInput._id] = jsonInput;
            allItems.push({ pack: directory, data: jsonInput, file: file });

            if (limitToPack && directory !== limitToPack) {
                continue;
            }
            await db.asyncInsert(jsonInput);
        }
        if (!limitToPack || directory === limitToPack) {
            console.log(chalk.greenBright(`> Finished processing data for ${directory}.`));
        }
    }

    if (cookErrorCount > 0) {
        console.error(chalk.red(`\nCritical parsing errors occurred, aborting cook.`));
        cookAborted = true;
        return 1;
    }

    // Construct condition & setting finding regular expressions
    conditionsRegularExpression = regularExpressionForFindingItemsInCache(conditionsCache);
    settingRegularExpression = regularExpressionForFindingItemsInCache(settingCache);

    if (options.formattingCheck === true) {
        console.log(`\nStarting formatting check.`);
        formattingCheck(allItems);
    } else {
        console.log(`\n*Skipping* formatting check.`);
    }

    console.log(`\nStarting consistency check.`);
    consistencyCheck(allItems, compendiumMap);

    console.log(`\nUpdating items with updated IDs.\n`);

    await unpackPacks(true);

    console.log(`\nCook finished with ${cookErrorCount} errors.\n`);

    return 0;
}

// Generates a regular expression to find references to the provided items
function regularExpressionForFindingItemsInCache(cache) {

    let regularExpressionSubstring = "";
    const conditionNames = Object.entries(cache).map(x => x[1].name);
    regularExpressionSubstring = conditionNames.join("|");

    return new RegExp("(" + regularExpressionSubstring + ")", "g");
}

function tryMigrateActorSpeed(jsonInput) {
    const speedValue = jsonInput.system?.attributes?.speed?.value;
    const specialValue = jsonInput.system?.attributes?.speed?.special;
    if (speedValue) {
        let baseSpeed = speedValue;
        if (baseSpeed && isNaN(baseSpeed)) {
            baseSpeed = baseSpeed.replace(/\D/g, '');
            baseSpeed = Number(baseSpeed);
        }

        // If all else fails, forcibly reset it to 30.
        if (!baseSpeed || isNaN(baseSpeed)) {
            baseSpeed = 30;
        }

        jsonInput.system.attributes.speed = {
            land: { base: 0 },
            flying: { base: 0 },
            swimming: { base: 0 },
            burrowing: { base: 0 },
            climbing: { base: 0 },
            special: "",
            mainMovement: "land"
        };

        const lowercaseSpeedValue = speedValue.toLowerCase();
        if (lowercaseSpeedValue.includes("climb")) {
            jsonInput.system.attributes.speed.climbing.base = baseSpeed;
            jsonInput.system.attributes.speed.mainMovement = "climbing";
        } else if (lowercaseSpeedValue.includes("fly")) {
            jsonInput.system.attributes.speed.flying.base = baseSpeed;
            jsonInput.system.attributes.speed.mainMovement = "flying";
        } else if (lowercaseSpeedValue.includes("burrow")) {
            jsonInput.system.attributes.speed.burrowing.base = baseSpeed;
            jsonInput.system.attributes.speed.mainMovement = "burrowing";
        } else if (lowercaseSpeedValue.includes("swim")) {
            jsonInput.system.attributes.speed.swimming.base = baseSpeed;
            jsonInput.system.attributes.speed.mainMovement = "swimming";
        } else {
            jsonInput.system.attributes.speed.land.base = baseSpeed;
            jsonInput.system.attributes.speed.mainMovement = "land";
        }

        let finalSpecial = "";
        if (speedValue !== baseSpeed) {
            finalSpecial += "original base: " + speedValue.trim();
        }
        if (specialValue) {
            if (finalSpecial.length > 0) {
                finalSpecial += "; original special: ";
            }
            finalSpecial += specialValue.trim();
        }

        jsonInput.system.attributes.speed.special = finalSpecial;
    }
}

/**
 *
 * The formatting check goes through all items and checks various fields to ensure the entered values meets certain criteria.
 * Usually individual checks are added when we notice a larger risk of data entry error on a specific field, or when any data entry error
 * would cause significant harm to the usability of the entry.
 */
// conditions / setting cache and regular expression are generated during beginning of cooking and used during formatting checks
let conditionsCache = {};
let settingCache = {};
let conditionsRegularExpression;
let settingRegularExpression;
let poisonAndDiseasesRegularExpression = new RegExp("(poison|disease)", "g");
let validArmorTypes = ["light", "power", "heavy", "shield"];
let validCreatureSizes = ["fine", "diminutive", "tiny", "small", "medium", "large", "huge", "gargantuan", "colossal"];
function formattingCheck(allItems) {
    for (const item of allItems) {
        const data = item;
        const itemData = item.data;
        const pack = item.pack;

        if (!data || !itemData || !itemData.system || !itemData.type) {
            continue; // Malformed data or journal entry - outside the scope of the formatting check
        }

        // We only check formatting of aliens, vehicles & equipment for now
        if (itemData.type === "npc" || itemData.type === "npc2") {
            // NOTE: `checkEcology` off by default as it currently produces hundreds of errors.
            formattingCheckAlien(itemData, pack, item.file, { checkLinks: true, checkEcology: false });
        } else if (itemData.type === "equipment") {
            formattingCheckItems(itemData, pack, item.file, { checkImage: true, checkSource: true, checkPrice: true, checkLevel: true, checkLinks: true });
        } else if (itemData.type === "vehicle") {
            formattingCheckVehicle(itemData, pack, item.file, { checkLinks: true });
        } else if (itemData.type === "spell") {
            formattingCheckSpell(itemData, pack, item.file, { checkLinks: true });
        } else if (itemData.type === "race") {
            formattingCheckRace(itemData, pack, item.file, { checkLinks: true });
        } else if (itemData.type === "feat") {
            formattingCheckFeat(itemData, pack, item.file, { checkLinks: true });
        }
    }
}

function formattingCheckRace(data, pack, file, options = { checkLinks: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${data.name}.`, pack);
    }

    // Validate HP values
    if (data.system.hp.value < 0) {
        addWarningForPack(`${chalk.bold(file)}: HP value not entered correctly.`, pack);
    }

    if (data.system.size) {
        if (!validCreatureSizes.includes(data.system.size)) {
            addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
        }
    } else {
        addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${data.name}.`, pack);
    }

    // Validate source
    let source = data.system.source;
    if (!source) {
        addWarningForPack(`${chalk.bold(file)}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${source}.`, pack);
    }

    // Check biography for references to conditions
    if (options.checkLinks) {
        let description = data.system.description.value;
        let result = searchDescriptionForUnlinkedCondition(description);
        if (result.found) {
            for (let match of result.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
    }
}

function formattingCheckAlien(data, pack, file, options = { checkLinks: true, checkEcology: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${data.name}.`, pack);
    }
    // Validate attributes
    // Validate HP exists
    if (!data.system.attributes || !data.system.attributes.hp) {
        addWarningForPack(`${chalk.bold(file)}: Missing HP values.`, pack);
        return;
    }
    // Validate HP values
    else if (data.system.attributes.hp.value !== data.system.attributes.hp.max) {
        addWarningForPack(`${chalk.bold(file)}: HP value not entered correctly.`, pack);
    }

    if (data.system.traits.size) {
        if (!validCreatureSizes.includes(data.system.traits.size)) {
            addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
        }
    } else {
        addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
    }

    // Validate token image
    if (data.prototypeToken.img && !data.prototypeToken.img.startsWith("systems") && !data.prototypeToken.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
    }

    // Validate source
    let source = data.system.details.source;
    if (!source) {
        addWarningForPack(`${chalk.bold(file)}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${chalk.bold(source)}.`, pack);
    }

    if (options.checkEcology === true) {
        // Validate ecology
        let environment = data.system.details.environment;
        let organization = data.system.details.organization;
        if (environment === null || environment === "") {
            addWarningForPack(`${fichalk.bold(file)}: Environment is missing.`, pack);
        }
        if (organization === null || organization === "") {
            addWarningForPack(`${chalk.bold(file)}: Organization is missing.`, pack);
        }
    }

    if (options.checkLinks === true) {
        let description = data.system.details.biography.value;
        // Check biography for references to conditions
        let conditionResult = searchDescriptionForUnlinkedCondition(description);
        if (conditionResult.found) {
            for (let match of conditionResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in biography without link.`, pack);
            }
        }
        // Check biography for references to the setting
        let settingResult = searchDescriptionForUnlinkedReference(description, settingRegularExpression);
        if (settingResult.found) {
            for (let match of settingResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
    }

    // Validate items
    for (i in data.items) {
        formattingCheckItems(data.items[i], pack, file, { checkImage: true, checkSource: false, checkPrice: false, checkLinks: options.checkLinks });
    }
}

function formattingCheckItems(data, pack, file, options = { checkImage: true, checkSource: true, checkPrice: true, checkLevel: true, checkLinks: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${chalk.bold(data.name)}.`, pack);
    }

    // Validate image
    if (options.checkImage) {
        if (data.img // Only validate if img is set
            && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
            addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
        }
    }

    // Validate source
    if (options.checkSource) {
        let source = data.system.source;
        if (!isSourceValid(source)) {
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${chalk.bold(source)}".`, pack);
        }
    }

    // Validate price
    if (options.checkPrice) {
        let price = data.system.price;
        if (!price || price <= 0) {
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted armor price field "${chalk.bold(price)}.`, pack);
        }
    }

    // Validate level
    if (options.checkLevel) {
        let level = data.system.level;
        if (!level || level <= 0) {
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted armor level field "${chalk.bold(level)}.`, pack);
        }
    }

    // If a weapon
    if (data.system.weaponType) {
        formattingCheckWeapons(data, pack, file);
    }

    // If armor
    let armor = data.system.armor;
    if (armor) {
        // Validate armor type
        let armorType = data.system.armor.type;
        if (!validArmorTypes.includes(armorType)) {
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted armor type field "${chalk.bold(armorType)}.`, pack);
        }
    }

    // Validate links
    if (options.checkLinks) {
        let description = data.system.description.value;

        if (description) {

            // Check description for references to conditions
            let conditionResult = searchDescriptionForUnlinkedReference(description, conditionsRegularExpression);
            if (conditionResult.found) {
                for (let match of conditionResult.foundWords) {
                    addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
                }
            }

            // Check description for references to poisons / diseases
            let poisonResult = searchDescriptionForUnlinkedReference(description, poisonAndDiseasesRegularExpression);
            if (poisonResult.found) {
                for (let match of poisonResult.foundWords) {
                    addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
                }
            }
        } else {
            // Item has no description
        }
    }

}

function formattingCheckWeapons(data, pack, file) {

    let lowecaseName = data.name.toLowerCase();
    if (lowecaseName.includes("multiattack")) {
        // Should be [MultiATK]
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted multiattack name field "${chalk.bold(data.name)}.`, pack);
    }
    if (lowecaseName.includes("multiatk")) {

        if (data.name.includes("[MultiATK] ")) {
            // Looks good, contains the proper multi-attack prefix and a space
        } else {
            // Anything else is close, but is slightly off
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted multiattack name field "${chalk.bold(data.name)}.`, pack);
        }
    }
}

function formattingCheckVehicle(data, pack, file, options = { checkLinks: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${chalk.bold(data.name)}.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
    }

    // Validate source
    let source = data.system.details.source;
    if (!source) {
        addWarningForPack(`${chalk.bold(file)}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${chalk.bold(source)}.`, pack);
    }

    // Validate price
    let price = data.system.details.price;
    if (!price || price <= 0) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted vehicle price field "${chalk.bold(armorType)}.`, pack);
    }

    // Validate level
    let level = data.system.details.level;
    if (!level || level <= 0) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted vehicle level field "${chalk.bold(armorType)}.`, pack);
    }

    // Check description for references to conditions
    if (options.checkLinks) {
        let description = data.system.details.description.value;
        if (description) {
            let result = searchDescriptionForUnlinkedCondition(description);
            if (result.found) {
                for (let match of result.foundWords) {
                    addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
                }
            }
        } else {
            // Vehicle has no description
        }
    }

    // Validate items
    for (i in data.items) {
        formattingCheckItems(data.items[i], pack, file, { checkImage: true, checkSource: false, checkPrice: false, checkLinks: options.checkLinks });
    }
}

function formattingCheckSpell(data, pack, file, options = { checkLinks: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${chalk.bold(data.name)}.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
    }

    // Validate source
    let source = data.system.source;
    if (!source) {
        addWarningForPack(`${chalk.bold(file)}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${chalk.bold(source)}.`, pack);
    }

    // Check spell description for unlinked references to conditions
    if (options.checkLinks === true) {
        let description = data.system.description.value;

        // Check references to conditions
        let conditionResult = searchDescriptionForUnlinkedReference(description, conditionsRegularExpression);
        if (conditionResult.found) {
            for (let match of settingResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
        // Check references to the setting
        let settingResult = searchDescriptionForUnlinkedReference(description, settingRegularExpression);
        if (settingResult.found) {
            for (let match of settingResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
    }
}

function formattingCheckFeat(data, pack, file, options = { checkLinks: true }) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${chalk.bold(file)}: Name is not well formatted "${chalk.bold(data.name)}.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${chalk.bold(data.name)}.`, pack);
    }

    // NOTE: We don't validate `source` for feats as we currently are not decided if we should use this field as
    // it's used for other items (it is generally used to provide an explanation of what game mechanic unlocks the
    // feat)

    if (options.checkLinks === true) {
        let description = data.system.description.value;
        // Check description for references to conditions
        let conditionResult = searchDescriptionForUnlinkedReference(description, conditionsRegularExpression);
        if (conditionResult.found) {
            for (let match of conditionResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
        // Check description for references to the setting
        let settingResult = searchDescriptionForUnlinkedReference(description, settingRegularExpression);
        if (settingResult.found) {
            for (let match of settingResult.foundWords) {
                addWarningForPack(`${chalk.bold(file)}: Found reference to ${chalk.bold(match)} in description without link.`, pack);
            }
        }
    }
}

// Check if a description contains an unlinked reference to a condition
function searchDescriptionForUnlinkedCondition(description) {

    return searchDescriptionForUnlinkedReference(description, conditionsRegularExpression);
}

// Checks if a description contains an unlinked reference to any value found in the provided regular expression
function searchDescriptionForUnlinkedReference(description, regularExpression) {

    let matches = [...description.matchAll(regularExpression)];
    let foundWords = [];
    let alreadyLinked = [];
    // Found a potential reference to a condition
    if (matches && matches.length > 0) {
        // Capture the character before and after each match and use some basic heuristics to decide if it's an linked condition in the description
        for (let match of matches) {

            let conditionWord = match[0];
            let matchedWord = description.substring(match["index"], match["index"] + match["length"]);

            // We want to capture a character before and after
            let characterBeforeIndex = match["index"] - 1;
            let characterAfterIndex = match["index"] + conditionWord.length;
            let characterBefore = description.substring(characterBeforeIndex, characterBeforeIndex + 1);
            let characterAfter = description.substring(characterAfterIndex, characterAfterIndex + 1);
            let delimiterCharacters = [">", "<", ";", ",", "/", "(", ")", "."];

            let unlinkedReferenceFound = false;
            // If surrounded by { and } we assume it is linked and continue
            if (characterBefore === "{" && characterAfter === "}") {
                alreadyLinked.push(conditionWord);
                continue;
            }
            // If the condition is surrounded by spaces, it is unlinked
            // it should be contained in a link to the compendium like this `@UUID[Compendium.sfrpg.spells.YDXegEus8p0BnsH1]{Invisibility}`
            else if (characterBefore === " " && characterAfter === " ") {
                unlinkedReferenceFound = true;
                if (!alreadyLinked.includes(conditionWord)) foundWords.push(conditionWord);
            }
            // If potentially within the contents of a tag or surrounded by delimiting characters
            else if (delimiterCharacters.includes(characterBefore) && (delimiterCharacters.includes(characterAfter) || characterAfter === " ")) {
                // The condition was found between two delimiters, most likely in the contents of an html tag.
                // Or it was found at the tail of a delimiter followed by a space (at the end of a comma separated list.
                unlinkedReferenceFound = true;
                if (!alreadyLinked.includes(conditionWord)) foundWords.push(conditionWord);
            }
            // Condition was found after a space but right before a delimiting character, like the end of a sentence.
            // Or hugging opening brackets, or the start of a comma separated list.
            else if ((delimiterCharacters.includes(characterBefore) || characterBefore === " ") && delimiterCharacters.includes(characterAfter)) {
                unlinkedReferenceFound = true;
                if (!alreadyLinked.includes(conditionWord)) foundWords.push(conditionWord);
            }
            // This is a simple rule of thumb which checks of the word in question is surrounded by `&nbsp;`. In this case we'll ignore,
            // as this can be used to escape a condition word (ie. `Burning`) in an otherwise unrelated context (ie. `... the Burning Archipelago...`)
            else if (characterBefore === ";" && characterAfter === "&") {
                unlinkedReferenceFound = false;
            }

        }
        if (foundWords.length > 0) {
            foundWords = [...new Set(foundWords)]; // Remove duplicates; only link the first instance
            return { found: true, foundWords: foundWords };
        }
    }
    return { found: false };
}

// Checks a source string for conformance to string format outlined in CONTRIBUTING.md
function isSourceValid(source) {

    // NOTE: One day this should be changed if they publish further Core books (Galaxy Exploration Manual included for posterity)
    const CoreBooksSourceMatch = [...source.matchAll(/(CRB|AR|PW|COM|SOM|NS|GEM|TR|GM|DC|IS) pg\. [\d]+/g)];
    // NOTE: One day this should be increased when they publish further Alien Archives (Alien Archive 5 included for posterity)
    const AlienArchiveSourceMatch = [...source.matchAll(/AA([1-5]) pg\. [\d]+/g)];
    const AdventurePathSourceMatch = [...source.matchAll(/AP #[\d]+ pg\. [\d]+/g)];
    const StarfinderSocietySourceMatch =  [...source.matchAll(/SFS #[\d]+-[\d]+ pg\. [\d]+/g)];
    const StarfinderAdventureSourceMatch =  [...source.matchAll(/SA:\S+ pg\. [\d]+/g)];

    if (CoreBooksSourceMatch && CoreBooksSourceMatch.length > 0) {
        // ✅ formatted Core book source
        return true;
    } else if (AlienArchiveSourceMatch && AlienArchiveSourceMatch.length > 0) {
        // ✅ formatted Alien Archives source
        return true;
    } else if (AdventurePathSourceMatch && AdventurePathSourceMatch.length > 0) {
        // ✅ formatted Adventure path source
        return true;
    } else if (StarfinderSocietySourceMatch && StarfinderSocietySourceMatch.length > 0) {
        // ✅ formatted Starfinder Society source
        return true;
    } else if (StarfinderAdventureSourceMatch && StarfinderAdventureSourceMatch.length > 0) {
        // ✅ formatted Starfinder Adventure source
        return true;
    } else if (source === "ACD") {
        //  ✅ formatted Alien Card Deck source
        return true;
    }

    return false;
}

function addWarningForPack(warning, pack) {

    if (!(pack in packErrors)) {
        packErrors[pack] = [];
    }

    cookErrorCount += 1;
    packErrors[pack].push(warning);
}

function consistencyCheck(allItems, compendiumMap) {
    for (let item of allItems) {
        let data = item;
        let itemData = item.data;
        if (!data || !itemData || !itemData.system || !itemData.system.description) continue;

        let desc = itemData.system.description.value;
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
                packErrors[pack].push(`${chalk.bold(item.file)}: Using @Item to reference to '${chalk.bold(localItemName)}' (with id: ${chalk.bold(localItemId)}), @Item is not allowed in compendiums. Please use '${chalk.bold('@UUID[Compendium.sfrpg.' + pack + "." + localItemId + "]")}' instead.`);
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
                packErrors[pack].push(`${chalk.bold(item.file)}: Using @JournalEntry to reference to '${chalk.bold(localItemName)}' (with id: ${chalk.bold(localItemId)}), @JournalEntry is not allowed in compendiums. Please use '${chalk.bold('@UUID[Compendium.sfrpg.' + pack + "." + localItemId + "]")}' instead.`);
                cookErrorCount++;
            }
        }

        let compendiumMatch = [...desc.matchAll(/@UUID\[([^\]]*)]({([^}]*)})?/gm)];
        if (compendiumMatch && compendiumMatch.length > 0) {
            for (let otherItem of compendiumMatch) {
                let link = otherItem[1];
                let otherItemName = otherItem[4] || link;

                let linkParts = link.split('.');
                // Skip links to journal entry pages
                // @UUID[Compendium.sfrpg.some-pack.abcxyz.JournalEntryPage.abcxyz]
                if (linkParts.length === 6) {
                    continue;
                }
                if (linkParts.length !== 4) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${chalk.bold(item.file)}: Compendium link to '${chalk.bold(link)}' is not valid. It does not have enough segments in the link. Expected format is Compendium.sfrpg.compendiumName.itemId.`);
                    cookErrorCount++;
                    continue;
                }

                // @UUID[Compendium.sfrpg.some-pack.abcxyz]
                //      [0]         [1]   [2]       [3]
                let system = linkParts[1];
                let otherPack = linkParts[2];
                let otherItemId = linkParts[3];

                // @UUID links must link to sfrpg compendiums.
                if (system !== "sfrpg") {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${chalk.bold(item.file)}: Compendium link to '${chalk.bold(otherItemName)}' (with id: ${chalk.bold(otherItemId)}) is not referencing the sfrpg system, but instead using '${chalk.bold(system)}'.`);
                    cookErrorCount++;
                }

                // @UUID links to the same compendium could be @Item links instead.
                /* if (otherPack === pack) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${item.file}: Compendium link to '${otherItemName}' (with id: ${otherItemId}) is referencing the same compendium, consider using @Item[${otherItemId}] instead.`);
                    cookErrorCount++;
                }*/

                // @UUID links must link to a valid compendium.
                if (!(otherPack in compendiumMap)) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${chalk.bold(item.file)}: '${chalk.bold(otherItemName)}' (with id: ${chalk.bold(otherItemId)}) cannot find '${chalk.bold(otherPack)}', is there an error in the compendium name?`);
                    cookErrorCount++;
                    continue;
                }

                // @UUID links must link to a valid item ID.
                let itemExists = false;
                if (otherItemId in compendiumMap[otherPack]) {
                    itemExists = true;
                } else {
                    let foundItem = allItems.find(x => x.pack === otherPack && x._id === otherItemId);
                    itemExists = !!foundItem;
                }

                if (!itemExists) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${chalk.bold(item.file)}: '${chalk.bold(otherItemName)}' (with id: ${chalk.bold(otherItemId)}) not found in '${chalk.bold(otherPack)}'.`);
                    cookErrorCount++;
                }
            }
        }
    }
}

async function postCook() {

    if (Object.keys(packErrors).length > 0) {
        for (let pack of Object.keys(packErrors)) {
            console.error(chalk.redBright(`\n${packErrors[pack].length} Errors cooking ${pack}.db:`));
            for (let error of packErrors[pack]) {
                console.error(chalk.redBright(`> ${error}`));
            }
        }
    }

    if (!cookAborted) {
        if (cookErrorCount > 0) {
            console.log(chalk.redBright(`\nCompendiums cooked with ${chalk.bold(cookErrorCount)} errors. Please check the files listed above and try again.`));
        } else {
            console.log(chalk.greenBright(`\nCompendiums cooked with ${cookErrorCount} errors!\nDon't forget to restart Foundry to refresh compendium data!\n`));
        }
    } else {
        throw Error(chalk.redBright(`\nCook aborted after ${cookErrorCount} critical errors!\n`));
    }
    return 0;
}

/** ******************/
/*   LOCALIZATION   */
/** ******************/
async function copyLocalization() {
    console.log(`Opening localization files`);

    const itemSourceDir = "./src/lang";
    const files = fs.readdirSync(itemSourceDir);

    // First we sort the JSON keys alphabetically
    console.log(`Sorting keys`);
    for (const filePath of files) {
        console.log(`> ${filePath}`);
        const fileRaw = fs.readFileSync(itemSourceDir + "/" + filePath);
        const fileJson = JSON.parse(fileRaw);

        const outRaw = JSONstringifyOrder(fileJson, 4);
        fs.writeFileSync(itemSourceDir + "/" + filePath, outRaw);
    }
    console.log(``);

    // Get original file data
    const englishFilePath = "./src/lang/en.json";
    const englishRaw = fs.readFileSync(englishFilePath);
    const englishJson = JSON.parse(englishRaw);

    const germanFilePath = "./src/lang/de.json";
    const germanRaw = fs.readFileSync(germanFilePath);
    const germanJson = JSON.parse(germanRaw);

    // Then we ensure all languages are in sync with English
    console.log(`Ensuring language files are in sync with English`);
    for (const filePath of files) {
        const isEnglish = filePath.includes("en.json");
        if (isEnglish) {
            continue;
        }

        console.log(`> ${filePath}`);

        const languageRaw = fs.readFileSync(itemSourceDir + "/" + filePath);
        const languageJson = JSON.parse(languageRaw);

        let copiedJson = JSON.parse(JSON.stringify(englishJson));
        mergeDeep(copiedJson, languageJson);

        const outRaw = JSONstringifyOrder(copiedJson, 4);
        fs.writeFileSync(itemSourceDir + "/" + filePath, outRaw);
    }
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

/** ******************/
/*		CLEAN		*/
/** ******************/

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
        `maps`,
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

/** ******************/
/*		LINK		*/
/** ******************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
    const name = 'sfrpg';
    const config = fs.readJSONSync('foundryconfig.json');

    let destDir;
    try {
        if (
            fs.existsSync(path.resolve('.', 'dist', 'module.json'))
            || fs.existsSync(path.resolve('.', 'src', 'module.json'))
        ) {
            destDir = 'modules';
        } else if (
            fs.existsSync(path.resolve('.', 'dist', 'system.json'))
            || fs.existsSync(path.resolve('.', 'src', 'system.json'))
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

/** ******************/
/*	COPY USER DATA	*/
/** ******************/

/**
 * Copy build to User Data folder (for Docker - doesn't like symlinks)
 */
async function copyUserData() {
    const name = 'sfrpg';
    const config = fs.readJSONSync('foundryconfig.json');
    console.log("THIS IS SPARTA!");
    let destDir;
    try {
        if (
            fs.existsSync(path.resolve('.', 'dist', 'module.json'))
            || fs.existsSync(path.resolve('.', 'src', 'module.json'))
        ) {
            destDir = 'modules';
        } else if (
            fs.existsSync(path.resolve('.', 'dist', 'system.json'))
            || fs.existsSync(path.resolve('.', 'src', 'system.json'))
        ) {
            destDir = 'systems';
        } else {
            throw Error(
                `Could not find ${chalk.blueBright(
                    'module.json'
                )} or ${chalk.blueBright('system.json')}`
            );
        }

        let targetDir;
        console.log("TARGET TIME");
        if (config.dataPath) {
            if (!fs.existsSync(path.join(config.dataPath, 'Data')))
                throw Error('User Data path invalid, no Data directory found');

            targetDir = path.join(config.dataPath, 'Data', destDir, name);
        } else {
            throw Error('No User Data path defined in foundryconfig.json');
        }

        if (argv.clean || argv.c) {
            console.log(
                chalk.yellow(`Removing build in ${chalk.blueBright(targetDir)}`)
            );

            await fs.remove(targetDir);
        } else if (!fs.existsSync(targetDir)) {
            console.log(
                chalk.green(`Copying build to ${chalk.blueBright(targetDir)}`)
            );
            await fs.copy(path.resolve('./dist'), targetDir);
        }
        return Promise.resolve();
    } catch (err) {
        Promise.reject(err);
    }
}

/** *******************/
/*		PACKAGE		 */
/** *******************/

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
        const zipName = `${manifest.file.id}-v${manifest.file.version}.zip`;
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

        zip.finalize();
    } catch (err) {
        Promise.reject(err);
    }
}

/** *******************/
/*		PACKAGE		 */
/** *******************/

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
exports.watch = gulp.series(execBuild, buildWatch);
exports.clean = clean;
exports.link = linkUserData;
exports.copyUser = copyUserData;
exports.libs = copyLibs;
exports.package = gulp.series(copyReadmeAndLicenses, packageBuild);
exports.publish = gulp.series(
    clean,
    updateManifest,
    execBuild,
    copyReadmeAndLicenses,
    packageBuild
);
exports.copyLocalization = copyLocalization;
exports.cook = gulp.series(cookPacks, clean, execBuild, postCook);
exports.cookNoFormattingCheck = gulp.series(cookPacksNoFormattingCheck, clean, execBuild, postCook);
exports.unpack = gulpUnpackPacks;
exports.default = gulp.series(clean, execBuild);
