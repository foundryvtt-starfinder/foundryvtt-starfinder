const fs = require('fs');
const equipmentPaths = ["src/items/characters", "src/items/alien-archives"];

/**
 * The new data structure for how damage is stored on an item
 * 
 * @typedef DamagePart
 * @property {string}                   formula  The roll formula passed to the Foundry Roll API
 * @property {{[key: string]: boolean}} types    A set of key value pairs which determine if a damage type is being used
 * @property {string}                   operator The value that determines how multiple types of damage should be handled.
 */

/**
 * A function that takes an array of strings and converts them into the new 
 * DamagePart type.
 * 
 * @param {DamagePart[]} acc  The accumulated array of updated damage parts
 * @param {string[]}     curr The current array of damage parts.
 * @returns An array of updated damage parts
 */
function damagePartsReducer(acc, curr) {
    // If the current element is not an array, chances are this
    // item has already been converted. So, let's push it onto the accumlated
    // array and move on.
    if (!Array.isArray(curr)) {
        acc.push(curr);
        return acc;
    }

    let [formula, type] = curr;

    if (!type) {
        acc.push({ "formula": formula || "", "types": {}, "operator": "" });
    } else if (type.includes("+")) {
        let types = type.split('+');
        acc.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "and" });
    } else if (type.includes('|')) {
        let types = type.split('|');
        acc.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "or" });
    } else {
        acc.push({ "formula": formula, "types": { [type]: true }, "operator": "" } );
    }

    return acc;
}

try {
    for (const path of equipmentPaths) {
        fs.readdir(path, 'utf-8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                console.log(`Loading json for file ${file}`);
                let json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });

                let actor = JSON.parse(json);

                if (actor.items && actor.items.length > 0) {
                    console.log(`Updating the damage types for actor items...`);
                    for (const item of actor.items) {
                        if (item.data.damage?.parts?.length > 0) {
                            item.data.damage.parts = item.data.damage.parts.reduce(damagePartsReducer, []);
                        }

                        if (item.data.critical?.parts?.length > 0) {
                            item.data.critical.parts = item.data.critical.parts.reduce(damagePartsReducer, []);
                        }
                    }
                }

                json = JSON.stringify(actor, null, 2);

                fs.writeFileSync(`${path}/${file}`, json);
                console.log(`File ${file} was updated...`);
            }
        });
    }
} catch (err) {
    console.log(err);
}