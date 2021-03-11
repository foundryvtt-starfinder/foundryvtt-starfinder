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

	const statics = [
		'lang',
		'templates',
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
		copyWatchFiles
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
async function cookPacksNoFormattingCheck() {
    await cookWithOptions({formattingCheck: false});
}
async function cookPacks() {
    await cookWithOptions();
}
async function cookWithOptions(options = {formattingCheck: true}) {
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

            // Cache conditions to be referenced later
            if (directory == "conditions") {
                conditionsCache[jsonInput._id] = jsonInput;
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

    // Construct condition finding regular expression
    var regularExpressionSubstring = "";
    let numberOfConditions = Object.keys(conditionsCache).length
    var index = 0;
    for (let conditionId in conditionsCache) {
        let condition = conditionsCache[conditionId];
        // Construct a substring used to generate a condition finding regular expression
        if (index == numberOfConditions - 1) {
            regularExpressionSubstring += condition.name;
        }
        else {
            regularExpressionSubstring += condition.name + "|";
        }
        index++;
    }

    conditionsRegularExpression =  new RegExp("(" + regularExpressionSubstring + ")","g");

    if (options.formattingCheck == true) {
        console.log(`\nStarting formatting check.`);
        formattingCheck(allItems)
    }
    else {
        console.log(`\n*Skipping* formatting check.`);
    }

    console.log(`\nStarting consistency check.`);
    consistencyCheck(allItems, compendiumMap)

    console.log(`\nUpdating items with updated IDs.\n`);
    
    await unpackPacks();
    
    console.log(`\nCook finished with ${cookErrorCount} errors.\n`);

    return 0;
}

/**
 *
 * The formatting check goes through all items and checks various fields to ensure the entered values meets certain criteria.
 * Usually individual checks are added when we notice a larger risk of data entry error on a specific field, or when any data entry error
 * would cause significant harm to the usability of the entry.
 */
// Conditions cache and regular expression are generated during beginning of cooking and used during formatting checks
var conditionsCache = {};
var conditionsRegularExpression;
var validArmorTypes = ["light","power","heavy","shield"];
var validCreatureSizes = ["fine", "diminutive", "tiny", "small", "medium", "large", "huge", "gargantuan", "colossal"];
function formattingCheck(allItems) {

    for (let item of allItems) {
        let data = item.data;
        let pack = item.pack;

        if(!data || !data.data  || !data.type) {
            continue; // Malformed data or journal entry - outside the scope of the formatting check
        }
        // We only check formatting of aliens, vehicles & equipment for now
        if (data.type === "npc") {
            formattingCheckAlien(data,pack, item.file, {checkLinks: true})
        }
        else if (data.type === "equipment") {
            formattingCheckItems(data, pack, item.file, {checkImage: true, checkSource: true, checkPrice: true, checkLevel: true, checkLinks: true})
        }
        else if (data.type === "vehicle") {
            formattingCheckVehicle(data, pack, item.file,{checkLinks:true});
        }
        else if (data.type == "spell") {
            formattingCheckSpell(data, pack, item.file, {checkLinks:true});
        }
        else if (data.type == "race") {
            formattingCheckRace(data, pack, item.file, {checkLinks:true});
        }
    }
}

function formattingCheckRace(data, pack, file, options = {checkLinks:true}) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${file}: Name is not well formatted "${data.name}".`, pack);
    }

    // Validate HP values
    if(data.data.hp.value < 0) {
        addWarningForPack(`${file}: HP value not entered correctly.`, pack);
    }

    if(data.data.size) {
        if(!validCreatureSizes.includes(data.data.size)) {
            addWarningForPack(`${file}: Size value not entered correctly.`, pack);
        }
    }
    else {
        addWarningForPack(`${file}: Size value not entered correctly.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
    }

    // Validate source
    let source = data.data.source;
    if (!source) {
        addWarningForPack(`${file}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${file}: Improperly formatted source field "${source}".`, pack);
    }

    // Check biography for references to conditions
    if (options.checkLinks) {
        let description = data.data.description.value
        let result = searchDescriptionForUnlinkedCondition(description);
        if (result.found) {
            addWarningForPack(`${file}: Found reference to ${result.match} in description without link".`, pack);
        }
    }
}

function formattingCheckAlien(data, pack, file, options = {checkLinks: true}) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${file}: Name is not well formatted "${data.name}".`, pack);
    }
    // Validate attributes
    // Validate HP & Stamina Points
    if (!data.data.attributes || !data.data.attributes.hp || !data.data.attributes.sp) {
        addWarningForPack(`${file}: Missing HP/SP values.`, pack);
        return;
    }
    // Validate HP values
    else if(data.data.attributes.hp.value != data.data.attributes.hp.max) {
        addWarningForPack(`${file}: HP value not entered correctly.`, pack);
    }
    // Validate SP values
    if(data.data.attributes.sp.value != data.data.attributes.sp.max) {
        addWarningForPack(`${file}: SP value not entered correctly.`, pack);
    }

    if(data.data.traits.size) {
        if(!validCreatureSizes.includes(data.data.traits.size)) {
            addWarningForPack(`${file}: Size value not entered correctly.`, pack);
        }
    }
    else {
        addWarningForPack(`${file}: Size value not entered correctly.`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
    }

    // Validate token image
    if (data.token.img && !data.token.img.startsWith("systems") && !data.token.img.startsWith("icons")) {
    addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
    }

    // Validate source
    let source = data.data.details.source;
    if (!source) {
        addWarningForPack(`${file}: Missing source field.`, pack);
       return;
    }
    if (!isSourceValid(source)) {
       addWarningForPack(`${file}: Improperly formatted source field "${source}".`, pack);
    }

    // Check biography for references to conditions
    if (options.checkLinks) {
        let description = data.data.details.biography.value
        let result = searchDescriptionForUnlinkedCondition(description);
        if (result.found) {
            addWarningForPack(`${file}: Found reference to ${result.match} in biography without link".`, pack);
        }
    }

    // Validate items
    for (i in data.items) {
        formattingCheckItems(data.items[i], pack, file, {checkImage: true, checkSource: false, checkPrice: false, checkLinks: options.checkLinks})
    }
}

function formattingCheckItems(data, pack, file, options = {checkImage: true, checkSource: true, checkPrice: true, checkLevel: true, checkLinks: true}) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${file}: Name is not well formatted "${data.name}".`, pack);
    }

    // Validate image
    if ( options.checkImage) {
        if (data.img && // Only validate if img is set
            !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
            addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
        }
    }

    // Validate source
    if (options.checkSource) {
        let source = data.data.source;
        if (!isSourceValid(source)) {
            addWarningForPack(`${file}: Improperly formatted source field "${source}".`, pack);
        }
    }

    // Validate price
    if (options.checkPrice) {
        let price = data.data.price;
        if (!price || price <= 0) {
            addWarningForPack(`${file}: Improperly formatted armor price field "${price}".`, pack);
        }
    }

    // Validate level
    if (options.checkLevel) {
        let level = data.data.level;
        if (!level || level <= 0) {
            addWarningForPack(`${file}: Improperly formatted armor level field "${level}".`, pack);
        }
    }

    // If a weapon
    if(data.data.weaponType) {
        formattingCheckWeapons(data, pack, file);
    }

    // If armor
    let armor = data.data.armor
    if (armor) {
        // Validate armor type
        let armorType = data.data.armor.type
        if(!validArmorTypes.includes(armorType)) {
            addWarningForPack(`${file}: Improperly formatted armor type field "${armorType}".`, pack);
        }
    }

    // Check description for references to conditions
    if (options.checkLinks) {
        let description = data.data.description.value

        if (description) {
            let result = searchDescriptionForUnlinkedCondition(description);
            if (result.found) {
                addWarningForPack(`${file}: Found reference to ${result.match} in description without link".`, pack);
            }
        }
        else {
            // Item has no description
        }
    }
}

function formattingCheckWeapons(data, pack, file) {

    let lowecaseName = data.name.toLowerCase()
    if(lowecaseName.includes("multiattack"))
    {
        // Should be [MultiATK]
        addWarningForPack(`${file}: Improperly formatted multiattack name field "${data.name}".`, pack);
    }
    if(lowecaseName.includes("multiatk") ) {

        if(data.name.includes("[MultiATK] "))
        {
            // Looks good, contains the proper multi-attack prefix and a space
        }
        else {
            // Anything else is close, but is slightly off
            addWarningForPack(`${file}: Improperly formatted multiattack name field "${data.name}".`, pack);
        }
    }
}

function formattingCheckVehicle(data, pack, file, options = {checkLinks: true}) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${file}: Name is not well formatted "${data.name}".`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
    }

    // Validate source
    let source = data.data.details.source;
    if (!source) {
        addWarningForPack(`${file}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${file}: Improperly formatted source field "${source}".`, pack);
    }

    // Validate price
    let price = data.data.details.price;
    if (!price || price <= 0) {
        addWarningForPack(`${file}: Improperly formatted vehicle price field "${armorType}".`, pack);
    }

    // Validate level
    let level = data.data.details.level;
    if (!level || level <= 0) {
        addWarningForPack(`${file}: Improperly formatted vehicle level field "${armorType}".`, pack);
    }

    // Check description for references to conditions
    if (options.checkLinks) {
        let description = data.data.details.description.value
        if (description) {
            let result = searchDescriptionForUnlinkedCondition(description);
            if (result.found) {
                addWarningForPack(`${file}: Found reference to ${result.match} in description without link".`, pack);
            }
        }
        else {
            // Vehicle has no description
        }
    }

    // Validate items
    for (i in data.items) {
        formattingCheckItems(data.items[i], pack, file, {checkImage: true, checkSource: false, checkPrice: false, checkLinks: options.checkLinks})
    }
}

function formattingCheckSpell(data, pack, file, options = {checkLinks:true}) {

    // Validate name
    if (!data.name || data.name.endsWith(' ') || data.name.startsWith(' ')) {
        addWarningForPack(`${file}: Name is not well formatted "${data.name}".`, pack);
    }

    // Validate image
    if (data.img && !data.img.startsWith("systems") && !data.img.startsWith("icons")) {
        addWarningForPack(`${file}: Image is pointing to invalid location "${data.name}".`, pack);
    }

    // Validate source
    let source = data.data.source;
    if (!source) {
        addWarningForPack(`${file}: Missing source field.`, pack);
        return;
    }
    if (!isSourceValid(source)) {
        addWarningForPack(`${file}: Improperly formatted source field "${source}".`, pack);
    }

    //Check spell description for unlinked references to conditions
    if(options.checkLinks) {
        let description = data.data.description.value
        let result = searchDescriptionForUnlinkedCondition(description);
        if (result.found) {
            addWarningForPack(`${file}: Found reference to ${result.match} in description without link".`, pack);
        }
    }
}

// Check if a description contains an unlinked reference to a condition
function searchDescriptionForUnlinkedCondition(description) {

    let matches = [...description.matchAll(conditionsRegularExpression)];
    //Found a potential reference to a condition
    if (matches && matches.length > 0) {
        // Capture the character before and after each match and use some basic heuristics to decide if it's an linked condition in the description
        for(let matchIndex in matches) {

            let match = matches[matchIndex];
            let conditionWord = match[0];
            let matchedWord = description.substring( match["index"], match["index"] + match["length"]);

            // We want to capture a character before and after
            let characterBeforeIndex = match["index"] - 1;
            let characterAfterIndex = match["index"] + conditionWord.length;
            let characterBefore = description.substring(characterBeforeIndex, characterBeforeIndex + 1);
            let characterAfter = description.substring(characterAfterIndex, characterAfterIndex + 1);
            let delimiterCharacters = [">", "<", ";",",","/","(",")","."];

            var unlinkedReferenceFound = false;
            // If surrounded by { and } we assume it is linked and continue
            if (characterBefore === "{" && characterAfter === "}")
            {
                continue;
            }
            // If the condition is surrounded by spaces, it is unlinked
            // it should be contained in a link to the compendium like this `@Compendium[sfrpg.spells.YDXegEus8p0BnsH1]{Invisibility}`
            else if (characterBefore === " " && characterAfter === " ") {
                unlinkedReferenceFound = true;
            }
            // If potentially within the contents of a tag or surrounded by delimiting characters
            else if (delimiterCharacters.includes(characterBefore) && (delimiterCharacters.includes(characterAfter) || " ")) {
                // The condition was found between two delimiters, most likely in the contents of an html tag.
                // Or it was found at the tail of a delimiter followed by a space (at the end of a comma separated list.
                unlinkedReferenceFound = true
            }
            // Condition was found after a space but right before a delimiting character, like the end of a sentence.
            // Or hugging opening brackets, or the start of a comma separated list.
            else if ((delimiterCharacters.includes(characterBefore) || " ") && delimiterCharacters.includes(characterAfter)) {
                unlinkedReferenceFound = true;
            }

            if (unlinkedReferenceFound) {
                return {found: true, match: conditionWord};
            }
        }
    }
    return {found: false};
}

// Checks a source string for conformance to string format outlined in CONTRIBUTING.md
function isSourceValid(source) {

    // NOTE: One day this should be changed if they publish further Core books (Galaxy Exploration Manual included for posterity)
    let CoreBooksSourceMatch = [...source.matchAll(/(CRB|AR|PW|COM|SOM|NS|GEM) pg\. [\d]+/g)];
    // NOTE: One day this should be increased when they publish further Alien Archives (Alien Archive 5 included for posterity)
    let AlienArchiveSourceMatch = [...source.matchAll(/AA([1-5]) pg\. [\d]+/g)];
    let AdventurePathSourceMatch = [...source.matchAll(/AP #[\d]+ pg\. [\d]+/g)];

    if (CoreBooksSourceMatch && CoreBooksSourceMatch.length > 0) {
       // ✅ formatted Core book source
       return true;
    }
    else if (AlienArchiveSourceMatch && AlienArchiveSourceMatch.length > 0) {
       // ✅ formatted Alien Archives source
       return true;
    }
    if (AdventurePathSourceMatch && AdventurePathSourceMatch.length > 0) {
       // ✅ formatted Adventure path source
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
exports.cookNoFormattingCheck = gulp.series(cookPacksNoFormattingCheck, clean, execBuild, postCook);
exports.unpack = unpackPacks;
exports.default = gulp.series(clean, execBuild);
