// This script updates the items and actors in the compendiums to change default empty durations (i.e.
// durations of "text" with no text in field) to instantaneous duration

const fs = require('fs');

const pathPrefix = "src/items/";
const actorPaths = [
    "alien-archives",
    "characters",
    "creature-companions",
    "hazards",
    "starships",
    "vehicles"
];

const itemPaths = [
    "archetype-features",
    "archetypes",
    "class-features",
    "classes",
    "effects",
    "equipment",
    "feats",
    "races",
    "racial-features",
    "spells",
    "starship-actions",
    "starship-components",
    "theme-features",
    "themes",
    "universal-creature-rules"
];

console.log(`Starting script`);

for (const currentPath of itemPaths) {
    const folderPath = pathPrefix + currentPath;
    console.log(`Checking items in folder: ${folderPath}`);

    const files = fs.readdirSync(folderPath).filter(e => e !== '_folders.json');
    for (const file of files) {
        const fname = folderPath + '/' + file;
        const json = fs.readFileSync(fname);
        const itemData = JSON.parse(json);
        const [wasUpdated, newItemData] = durationFix(itemData);
        if (wasUpdated) {
            fs.writeFileSync(fname, JSON.stringify(newItemData, null, 2));
        }
    }
}

for (const currentPath of actorPaths) {
    const folderPath = pathPrefix + currentPath;
    console.log(`Checking items in folder: ${folderPath}`);

    const files = fs.readdirSync(folderPath).filter(e => e !== '_folders.json');
    for (const file of files) {
        const fname = folderPath + '/' + file;
        const json = fs.readFileSync(fname);
        const actorData = JSON.parse(json);
        const [wasUpdated, newActorData] = actorDurationFix(actorData);
        if (wasUpdated) {
            fs.writeFileSync(fname, JSON.stringify(newActorData, null, 2));
        }
    }
}

function durationFix(itemData) {
    const duration = itemData.system.duration ?? null;
    if (duration) {
        if (duration.units === "" && !duration.value) {
            duration.units = "instantaneous";
            duration.value = "";
            return [true, itemData];
        }
    }
    return [false, itemData];
}

function actorDurationFix(actorData) {
    let changed = false;

    // Fix durations in all the actor's items
    for (itemData of actorData.items) {
        const [wasUpdated, newItemData] = durationFix(itemData);
        if (wasUpdated) {
            itemData = newItemData;
            changed = true;
        }
    }

    // Return the new actor data
    return [changed, actorData];
}
