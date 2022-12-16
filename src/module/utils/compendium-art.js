import isObject from "./is-object.js";

/**
 * THIS CODE WAS ENTIRELY, COMPLETELY, AND UTTERLY STOLEN FROM THE PF2E SYSTEM. PLEASE FORGIVE ME SHARK.
 *
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
 *    "2qbiJSmMCDVdaRrR": {
 *      "actor": "systems/sfrpg/images/starfinder_icon.webp",
 *      "token": "systems/sfrpg/images/starfinder_icon.webp"
 *      }
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
            for (const [actorId, paths] of Object.entries(art)) {
                const record = index.get(actorId); // Find the current actor in the index
                if (!record) continue;

                record.img = paths.actor; // Set the actor's art in the index, which is used by compendium windows
                game.sfrpg.compendiumArt.map.set(`Compendium.sfrpg.${packName}.${actorId}`, paths); // Push the actor ID and art to the map
            }
        }
    }
}

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
            return isModuleArt(map) ? map : null;
        } catch (error) {
            if (error instanceof Error) {
                console.warn(`Starfinder | ${error.message}`);
            }
        }
    }

    return null;
}

function isModuleArt(record) {
    return (
        isObject(record) // Ensure the map is an object
        && Object.values(record).every(
            (packToArt) => isObject(packToArt) // Ensure each entry is an object with a pack name
                && Object.values(packToArt).every(
                    (art) => isObject(art) // Ensure each within the pack object is an object with an actor ID
                        && typeof art.actor === "string" // Within an actor object, there must be an actor string, which is a file path
                        || (isObject(art.token)
                        && typeof art.token.img === "string"
                        && (typeof art.token === "string" // token can be a file path, or an object containing the file path and the token scale
                                && (art.token.scale === undefined || typeof art.token.scale === "number")))
                )
        )
    );

}
