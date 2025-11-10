import chalk from "chalk";
import fs from "fs-extra";
import jQuery from "jquery";
import jsdom from "jsdom";
import path from "node:path";
import url from "node:url";
import isObject from "../src/module/utils/is-object.js";
import LevelDatabase from "./lib/level-database.js";
import { unpackPacks } from "./unpack.js";
import { getManifest, measureTime } from "./util.js";

let cookErrorCount = 0;
let cookAborted = false;
const packErrors = {};
const runFormattingCheck = true;

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

// Run only if this file is executed directly
const modulePath = url.fileURLToPath(import.meta.url);
if (path.resolve(modulePath) === path.resolve(process.argv[1])) {
    await measureTime(async () => {
        await cook({limitToPack: process.env.npm_config_pack ?? null});
        console.log(`---`);

        await unpackPacks(true, {limitToPack: process.env.npm_config_pack ?? null});
    });

    process.exit(0);
}

export async function cook(options = {}) {
    console.log(chalk.blueBright(`Cooking db files`));
    const limitToPack = options.limitToPack ?? null;

    const compendiumMap = {};
    const allItems = [];

    const sourceDir = "src/items";
    const directories = await fs.readdir(sourceDir);
    const promises = [];

    const dirPromises = [];

    for (const directory of directories) {
        const itemSourceDir = `${sourceDir}/${directory}`;
        const outputDir = `dist/packs/${directory}`;

        const loadDir = async (directory) => {
            if (!limitToPack || directory === limitToPack) {
                if (fs.existsSync(outputDir)) {
                    await fs.rm(outputDir, { recursive: true });
                    console.log(`Cleared ${outputDir}`);
                }
            }

            console.log(`Processing ${directory} (${itemSourceDir})`);
            compendiumMap[directory] = {};

            const files = await fs.readdir(itemSourceDir);
            compendiumMap[directory] = files;
        };

        dirPromises.push(loadDir(directory));
    }

    await Promise.all(dirPromises);

    // Do smallest first, so large packs don't block
    directories.sort((a, b) => {
        return compendiumMap[a].length - compendiumMap[b].length;
    });

    const idList = [];
    for (const directory of directories) {
        const itemSourceDir = `${sourceDir}/${directory}`;
        const outputDir = `dist/packs/${directory}`;
        const parsedFiles = [];

        const loadFile = async (file) => {
            const filePath = `${itemSourceDir}/${file}`;
            let jsonInput = await fs.readFile(filePath);
            try {
                jsonInput = JSON.parse(jsonInput);
                parsedFiles.push(jsonInput);

                if (!limitToPack || directory === limitToPack) {
                // sanitize the incoming JSON
                    sanitizeJSON(jsonInput, true);

                    // Fix missing images
                    if (!jsonInput.img && !jsonInput.pages) {
                    // Skip if a journal
                        jsonInput.img = "icons/svg/mystery-man.svg";
                    }

                    // Check for duplicate _id's on items
                    if (idList.indexOf(jsonInput._id) !== -1) {
                        throw new Error(`duplicate _id ${jsonInput._id}`);
                    } else {
                        idList.push(jsonInput._id);
                    }
                }

                compendiumMap[directory][jsonInput._id] = jsonInput;
                allItems.push({ pack: directory, data: jsonInput, file });

                if (limitToPack && directory !== limitToPack) {
                    return;
                }

            } catch (err) {
                if (!(directory in packErrors)) {
                    packErrors[directory] = [];
                }
                packErrors[directory].push(
                    `Error parsing file '${filePath.substring(
                        filePath.indexOf("items/") + 6,
                        filePath.lastIndexOf(".json") + 5
                    )}' | ${err}`
                );
                cookErrorCount++;
                return;
            }

        };

        const readPromises = [];
        for (const file of compendiumMap[directory].values()) {
            if (file === "_folders.json") continue;
            readPromises.push(loadFile(file));
        }

        const parsedFolders = await (async () => {
            const foldersFile = path.resolve(itemSourceDir, "_folders.json");
            if (fs.existsSync(foldersFile)) {
                const jsonString = await fs.readFile(foldersFile, "utf-8");
                const foldersSource = (() => {
                    try {
                        return JSON.parse(jsonString);
                    } catch (err) {
                        if (!(directory in packErrors)) {
                            packErrors[directory] = [];
                        }
                        packErrors[directory].push(`${chalk.bold(filePath)}: Error parsing folder: ${err}`);
                        cookErrorCount++;
                    }
                })();

                return foldersSource;
            }
            return [];
        })();

        await Promise.all(readPromises); // While this does block the loop, unblocking this causes a "too many files open" error.

        if (!limitToPack || directory === limitToPack) {
            const packName = path.basename(outputDir);
            const db = new LevelDatabase(outputDir, { packName });
            promises.push(db.createPack(parsedFiles, await parsedFolders, packName));

        }
    }

    await Promise.all(promises);

    if (cookErrorCount > 0) {
        cookAborted = true;
        console.log(packErrors);
        throw new Error(`\nCritical parsing errors occurred, aborting cook.`);
    }

    // Construct condition & setting finding regular expressions
    // conditionsRegularExpression = regularExpressionForFindingItemsInCache(conditionsCache);
    // settingRegularExpression = regularExpressionForFindingItemsInCache(settingCache);

    if (runFormattingCheck === true) {
        console.log(`\nRunning formatting check.`);
        formattingCheck(allItems);
    }

    console.log(`Running consistency check.`);
    consistencyCheck(allItems, compendiumMap);

    if (Object.keys(packErrors).length > 0) {
        for (const pack of Object.keys(packErrors)) {
            console.error(chalk.redBright(`\n${packErrors[pack].length} Errors cooking ${pack}.db:`));
            for (const error of packErrors[pack]) {
                console.error(chalk.redBright(`> ${error}`));
            }
        }
    }

    if (!cookAborted) {
        if (cookErrorCount > 0) {
            console.log(chalk.yellowBright(`\nCompendiums cooked with ${chalk.bold(cookErrorCount)} non-critical errors. Please check the files listed above and try again.`));
        } else {
            console.log(chalk.greenBright(`\nCompendiums cooked with ${cookErrorCount} errors!\nDon't forget to restart Foundry to refresh compendium data!`));
        }
    } else {
        throw Error(chalk.redBright(`\nCook aborted after ${cookErrorCount} critical errors!\n`));
    }
}

/**
 * Cleans compendium entries of superfluous data, sanitizes HTML and applies some defaults to prototype tokens
 * Some parts adapted from PF2e: https://github.com/foundryvtt/pf2e/blob/master/packs/scripts/extract.ts
 * Under the Apache 2.0 License: https://www.apache.org/licenses/LICENSE-2.0
 * @param {Object} jsonInput An object representing the current JSON being unpacked/cooked
 * @returns {Object} A sanitized object
 */
export function sanitizeJSON(jsonInput) {
    const manifest = getManifest().file;

    const treeShake = (item) => {
        delete item.sort;
        if (!item.folder) delete item.folder;

        delete item.permission;
        delete item.ownership;
        delete item.effects;

        delete item.flags?.exportSource;
        delete item.flags?.sourceId;

        item._stats = {
            coreVersion: manifest.compatibility.minimum,
            systemId: "sfrpg",
            systemVersion: manifest.version
        };

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

        if (Number(jsonInput?.system?.attributes?.hp?.max)) {
            if (jsonInput.system.attributes.hp.value) jsonInput.system.attributes.hp.value = Number(jsonInput.system.attributes.hp.max);
        }

        if (Number(jsonInput?.system?.attributes?.sp?.max)) {
            if (jsonInput.system.attributes.sp.value) jsonInput.system.attributes.sp.value = Number(jsonInput.system.attributes.sp.max);
        }

        if (Number(jsonInput?.system?.attributes?.rp?.max)) {
            if (jsonInput.system.attributes.rp.value) jsonInput.system.attributes.rp.value = Number(jsonInput.system.attributes.rp.max);
        }
    };

    // Clean up description HTML
    const _cleanDescription = (description) => {
        if (!description) {
            return "";
        }

        const { window } = new jsdom.JSDOM();
        const $ = jQuery(window);

        const jQueryDescription = (() => {
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
            jQueryDescription.find(selector).each((_i, span) => {
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
            jQueryDescription.find(selector).each((_i, el) => {
                $(el)
                    .removeAttr("style title")
                    .removeClass("title")
                    .filter('*[class=""]')
                    .removeAttr('class');
            });
        }

        // Replace erroneously copied links with actually working ones
        jQueryDescription.find("i[class*='fas']").remove();
        const fakeLink = jQueryDescription.find("a.entity-link, a.content-link");
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
            .append(jQueryDescription)
            .html()
            .replace(/@Compendium\[/g, "@UUID[Compendium.") // Replace @Compendium links with @UUID links
            .replace(/(\w)(@UUID)/g, "$1 $2") // Add a space before the start of @UUID links if there is a word before.
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
            .replace(/(\w)(<em>)/g, "$1 $2") // Add a space before the start of <em> tags if there is a word before.
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
        if ((isObject(item?.flags?.core)) // If an object
            && Object.entries(item?.flags?.core)?.length === 0) { // And is empty
            delete item.flags.core;
        }

        if ((isObject(item?.flags?.sfrpg))
            && Object.entries(item?.flags?.sfrpg)?.length === 0) {
            delete item.flags.sfrpg;
        }

        // If flags is now empty, delete it entirely
        if ((isObject(item.flags))
            && Object.entries(item?.flags)?.length === 0) {
            delete item.flags;
        }
    };

    delete jsonInput?.flags?.core?.sourceId;

    treeShake(jsonInput);
    cleanFlags(jsonInput);
    sanitizeDescription(jsonInput);

    if (jsonInput.items) {
        for (const item of jsonInput.items) {
            treeShake(item);
            cleanFlags(item);
            sanitizeDescription(item);
        }
    }

    if ("prototypeToken" in jsonInput) {

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

            const size = sizeLookup[jsonInput.system.traits.size]; // Set size to match actor's
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        } else if (jsonInput.type === "character") {
            jsonInput.prototypeToken.disposition = 1; // Friendly
            jsonInput.prototypeToken.bar2.attribute = "attributes.sp"; // 2nd bar as stamina
            jsonInput.prototypeToken.sight.enabled = true;

            const size = sizeLookup[jsonInput.system.traits.size];
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        } else if (jsonInput.type === "starship") {
            jsonInput.prototypeToken.disposition = 0; // Neutral
            jsonInput.prototypeToken.bar2.attribute = "attributes.shields"; // 2nd bar as shields
        } else if (jsonInput.type === "vehicle") {
            jsonInput.prototypeToken.disposition = 0; // Neutral

            const size = sizeLookup[jsonInput.system.attributes.size];
            jsonInput.prototypeToken.width = size;
            jsonInput.prototypeToken.height = size;
        }

        cleanFlags(jsonInput.prototypeToken);
    }

    return jsonInput;
}

/**
 *
 * The formatting check goes through all items and checks various fields to ensure the entered values meets certain criteria.
 * Usually individual checks are added when we notice a larger risk of data entry error on a specific field, or when any data entry error
 * would cause significant harm to the usability of the entry.
 */

const validCreatureSizes = Object.keys(sizeLookup);
function formattingCheck(allItems) {
    for (const data of allItems) {
        const item = data.item;
        const pack = data.pack;

        if (!item || !item.system || !item.type) {
            continue; // Malformed data or journal entry - outside the scope of the formatting check
        }

        // Validate image
        if (item.img && !item.img.startsWith("systems") && !item.img.startsWith("icons")) {
            addWarningForPack(`${chalk.bold(file)}: Image is pointing to invalid location "${item.name}.`, pack);
        }

        const source = item.system.details.source;
        if (!isSourceValid(source)) {
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted source field "${chalk.bold(source)}.`, pack);
        }

        if (item.type === "npc" || item.type === "npc2") {
            // NOTE: `checkEcology` off by default as it currently produces hundreds of errors.
            formattingCheckAlien(item, pack, item.file, {  checkEcology: false });
        // If an item or a vehicle
        } else if (!item.items || item.type === "vehicle") {
            formattingCheckItems(item, pack, item.file);
        }
    }
}

function formattingCheckAlien(item, pack, file, options = {  checkEcology: true }) {

    if (item?.system.size) {
        if (!validCreatureSizes.includes(data.system.size)) {
            addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
        }
    } else {
        addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
    }

    if (item.system.traits.size) {
        if (!validCreatureSizes.includes(item.system.traits.size)) {
            addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
        }
    } else {
        addWarningForPack(`${chalk.bold(file)}: Size value not entered correctly.`, pack);
    }

    if (options.checkEcology === true) {
        // Validate ecology
        const environment = item.system.details.environment;
        const organization = item.system.details.organization;
        if (environment === null || environment === "") {
            addWarningForPack(`${fichalk.bold(file)}: Environment is missing.`, pack);
        }
        if (organization === null || organization === "") {
            addWarningForPack(`${chalk.bold(file)}: Organization is missing.`, pack);
        }
    }

    // Validate items
    for (item of item.items) {
        formattingCheckItems(item, pack, file, { checkImage: true, checkSource: false, checkPrice: false, checkLinks: options.checkLinks });
    }
}

function formattingCheckItems(item, pack, file) {

    // Validate price
    const price = item.system.price;
    if (!price || price <= 0) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted price field "${chalk.bold(price)}.`, pack);
    }

    // Validate level

    const level = item.system.level;
    if (!level || level <= 0) {
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted level field "${chalk.bold(level)}.`, pack);
    }

    // If a weapon
    if (item.system.weaponType) {
        runFormattingCheckWeapons(item, pack, file);
    }

    // Validate any embedded items (vehicles only)
    for (embedded of item.items) {
        formattingCheckItems(embedded, pack, file);
    }
}

function runFormattingCheckWeapons(item, pack, file) {

    const lowecaseName = item.name.toLowerCase();
    if (lowecaseName.includes("multiattack")) {
        // Should be [MultiATK]
        addWarningForPack(`${chalk.bold(file)}: Improperly formatted multiattack name field "${chalk.bold(item.name)}.`, pack);
    }
    if (lowecaseName.includes("multiatk")) {

        if (item.name.includes("[MultiATK] ")) {
            // Looks good, contains the proper multi-attack prefix and a space
        } else {
            // Anything else is close, but is slightly off
            addWarningForPack(`${chalk.bold(file)}: Improperly formatted multiattack name field "${chalk.bold(item.name)}.`, pack);
        }
    }
}

// Checks a source string for conformance to string format outlined in CONTRIBUTING.md
function isSourceValid(source) {

    // NOTE: One day this should be changed if they publish further Core books (Galaxy Exploration Manual included for posterity)
    const CoreBooksSourceMatch = [...source.matchAll(/(CRB|PW|AR|COM|NS|SOM|GEM|TR|GM|DC|IS|PoC|EN|DS|SS|MG) pg\. [\d]+/g)];
    // NOTE: One day this should be increased when they publish further Alien Archives (Alien Archive 5 included for posterity)
    const AlienArchiveSourceMatch = [...source.matchAll(/AA([1-4]) pg\. [\d]+/g)];
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
    for (const data of allItems) {
        const item = data.item;
        const pack = data.pack;
        if (!data || !item || !item.system || !item.system.description) continue;

        const desc = item.system.description.value;
        if (!desc) continue;

        const itemMatch = [...desc.matchAll(/@Item\[([^\]]*)\]({([^}]*)})?/gm)];
        if (itemMatch && itemMatch.length > 0) {
            for (const localItem of itemMatch) {
                const localItemId = localItem[1];
                const localItemName = localItem[3] || localItemId;

                // @Item links cannot exist in compendiums.
                if (!(pack in packErrors)) {
                    packErrors[pack] = [];
                }
                packErrors[pack].push(`${chalk.bold(item.file)}: Using @Item to reference to '${chalk.bold(localItemName)}' (with id: ${chalk.bold(localItemId)}), @Item is not allowed in compendiums. Please use '${chalk.bold('@UUID[Compendium.sfrpg.' + pack + ".Item." + localItemId + "]")}' instead.`);
                cookErrorCount++;
            }
        }

        const journalMatch = [...desc.matchAll(/@JournalEntry\[([^\]]*)\]({([^}]*)})?/gm)];
        if (journalMatch && journalMatch.length > 0) {
            for (const localItem of journalMatch) {
                const localItemId = localItem[1];
                const localItemName = localItem[2] || localItemId;

                // @Item links cannot exist in compendiums.
                if (!(pack in packErrors)) {
                    packErrors[pack] = [];
                }
                packErrors[pack].push(`${chalk.bold(item.file)}: Using @JournalEntry to reference to '${chalk.bold(localItemName)}' (with id: ${chalk.bold(localItemId)}), @JournalEntry is not allowed in compendiums. Please use '${chalk.bold('@UUID[Compendium.sfrpg.' + pack + "." + localItemId + "]")}' instead.`);
                cookErrorCount++;
            }
        }

        const compendiumMatch = [...desc.matchAll(/@UUID\[([^\]]*)]({([^}]*)})?/gm)];
        if (compendiumMatch && compendiumMatch.length > 0) {
            for (const otherItem of compendiumMatch) {
                const link = otherItem[1];
                const otherItemName = otherItem[4] || link;

                const linkParts = link.split('.');
                // Skip links to journal entry pages
                // @UUID[Compendium.sfrpg.some-pack.abcxyz.JournalEntryPage.abcxyz]
                if (linkParts.includes('JournalEntryPage')) {
                    continue;
                }
                if (linkParts.length !== 5) {
                    if (!(pack in packErrors)) {
                        packErrors[pack] = [];
                    }
                    packErrors[pack].push(`${chalk.bold(item.file)}: Compendium link to '${chalk.bold(link)}' is not valid. It does not have enough segments in the link. Expected format is Compendium.sfrpg.compendiumName.itemType.itemId.`);
                    cookErrorCount++;
                    continue;
                }

                // @UUID[Compendium.sfrpg.some-pack.Item.abcxyz]
                //      [0]         [1]   [2]       [3]  [4]
                const system = linkParts[1];
                const otherPack = linkParts[2];
                const otherItemId = linkParts[4];

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
                    const foundItem = allItems.find(x => x.pack === otherPack && x._id === otherItemId);
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
