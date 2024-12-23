import isObject from "../utils/is-object.js";

/**
 * THIS CODE WAS ENTIRELY, COMPLETELY, AND UTTERLY STOLEN FROM THE PF2E SYSTEM. PLEASE FORGIVE ME SHARK.
 * PF2e version: https://github.com/foundryvtt/pf2e/blob/master/src/scripts/register-module-art.ts
 * The PF2e version is licensed under the Apache 2.0 license: https://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pull actor and token art from module.json files, which will replace default images on compendium actors and their
 * prototype tokens.
 *
 *
 * Examples of valid maps
 *
 *  "alien-archives": {
 *    "2qbiJSmMCDVdaRrR": {
 *      "actor": "systems/sfrpg/images/starfinder_icon.webp",
 *      "token": {
 *        "img": "systems/sfrpg/images/starfinder_icon.webp",
 *        "scale": 2
 *      }
 *    },
 *    "74I5mQmMMiZWJ7jf": {
 *      "actor": "systems/sfrpg/images/starfinder_icon.webp",
 *      "token": "systems/sfrpg/images/starfinder_icon.webp"
 *      }
 *    }
 *  },
 *  "equipment": {
 *    "WwjWtIrdijOZ4QNn": {
 *      "item": "modules/starfinder-iconic-tokens/art/portraits/raia.webp"
 *    }
 *  }
 *  //Parsing will fail if you have an "actor" or "token" entry and an "item" entry together!
 *  "equipment": {
 *    "WwjWtIrdijOZ4QNn": {
 *      "item": "systems/sfrpg/images/starfinder_icon.webp",
 *      "actor": "systems/sfrpg/images/starfinder_icon.webp",
 *      "token": "systems/sfrpg/images/starfinder_icon.webp"
 *    }
 *  }
 *
 */
export default async function registerCompendiumArt() {
    game.sfrpg.compendiumArt.map.clear(); // Clear any existing map
    const activeModules = [...game.modules.entries()].filter(([_key, m]) => m.active); // Get a list of active modules

    for (const [moduleKey, foundryModule] of activeModules) {
        const moduleArt = await getArtMap(foundryModule.flags?.[moduleKey]?.["sfrpg-art"]); // Get maps from any active modules
        if (!moduleArt) continue;

        for (const [packName, art] of Object.entries(moduleArt)) {
            const pack = game.packs.get(`sfrpg.${packName}`);
            if (!pack) {
                console.warn(
                    `Starfinder | Failed pack lookup from module art registration (${moduleKey}): ${packName}`
                );
                continue;
            }

            const index = pack.indexed ? pack.index : await pack.getIndex();
            for (const [id, paths] of Object.entries(art)) {
                const record = index.get(id); // Find the current document in the index
                if (!record) continue;
                if (paths.actor) {
                    record.img = paths.actor; // Set the document's art in the index, which is used by compendium windows
                } else if (paths.item) {
                    record.img = paths.item; // Set the document's art in the index, which is used by compendium windows
                }
                game.sfrpg.compendiumArt.map.set(`Compendium.sfrpg.${packName}.${id}`, paths); // Push the document ID and art to the map
            }
        }
    }
}

/**
 *
 * @param {object|string|null} art Either an art mapping object, or a file path to a JSON.
 * @returns {object|null} An art object, or null
 */
async function getArtMap(art) {
    if (!art) {
        return null;
    } else if (isModuleArt(art)) {
        return art;
    } else if (typeof art === "string") {
        // Instead of being in a module.json file, the art map is in a separate JSON file referenced by path
        try {
            const response = await fetch(art);
            if (!response.ok) {
                console.warn(`Starfinder | Failed loading art mapping file at ${art}`);
                return null;
            }
            const map = await response.json();
            const valid = isModuleArt(map);
            if (!valid) console.warn(`Starfinder | Art mapping file at ${art} is invalid.`);
            return valid ? map : null;
        } catch (error) {
            if (error instanceof Error) {
                console.warn(`Starfinder | ${error.message}`);
            }
        }
    }

    return null;
}

/**
 *
 * @param {object} record An art object
 * @returns {boolean} Whether the object is a valid compendium art object or not
 */
function isModuleArt(record) {
    return (
        isObject(record) // Ensure the map is an object
        && Object.values(record).every(
            (packToArt) => isObject(packToArt) // Ensure each entry is an object with a pack name
                && Object.values(packToArt).every(
                    (art) => isObject(art) // Ensure each entry within the pack object is an object with an actor or item ID
                        && (
                            // Within a document object, there can be an actor, token or item string. If there is an item string, there must not be a token or actor string
                            (typeof art.actor === "string" || typeof art.token === "string" || typeof art.item === "string")
                            && !((typeof art.actor === "string" || typeof art.token === "string") && typeof art.item === "string")
                            // token can be a file path, or an object containing the file path and the token scale
                            || (isObject(art.token)
                                && typeof art.token.img === "string"
                                && (art.token.scale === undefined || typeof art.token.scale === "number")
                                && art.item === undefined
                            )
                        )
                )
        )
    );

}
