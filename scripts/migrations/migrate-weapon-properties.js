const fs = require('fs');

/* const itemDataPaths = [
    "./src/items/equipment",
    "./src/items/archetype-features",
    "./src/items/class-features",
    "./src/items/feats",
    "./src/items/racial-features",
    "./src/items/spells",
    "./src/items/starship-components",
    "./src/items/theme-features",
    "./src/items/themes",
    "./src/items/universal-creature-rules"
]; */

const itemDataPaths = [
    "./src/items/equipment"
];

const actorDataPaths = [
    "./src/items/alien-archives"
];

try {
    /* for (const path of actorDataPaths) {
        fs.readdir(path, 'utf8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });
                let clean = false;

                const actor = JSON.parse(json);
                const items = actor.items;

                const newItems = [];
                for (const item of actor.items) {
                    if (item.properties) {

                    }
                }

                if (clean) {
                    const output = JSON.stringify(actor, null, 2);

                    fs.writeFileSync(`${path}/${file}`, output);
                    console.log(`Migrated ${actor.name}`);
                }
            }
        });
    } */

    for (const path of itemDataPaths) {
        fs.readdir(path, 'utf8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });

                const item = JSON.parse(json);
                const propertyOuts = propertyReplace(item.system.properties);

                if (propertyOuts[0]) {
                    item.system.properties = propertyOuts[1];
                    const output = JSON.stringify(item, null, 2);

                    fs.writeFileSync(`${path}/${file}`, output);
                    console.log(`Migrated ${item.name}`);
                }

            }
        });

    }

} catch (err) {
    console.log(err);
}

function propertyReplace(properties) {

    if (properties) {
        const newProperties = {};
        for (const property of Object.entries(properties)) {
            newProperties[property[0]] = {value: property[1]};
            if (property[1]) {
                newProperties[property[0]].extension = '';
            }
        }
        return [true, newProperties];
    }
    return [false, {}];
}
