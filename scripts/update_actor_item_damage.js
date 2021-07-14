const fs = require('fs');
const equipmentPaths = ["src/items/characters", "src/items/alien-archives"];

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
                            item.data.damage.parts = item.data.damage.parts.reduce((arr, curr) => {
                                let [formula, type] = curr;

                                // if (type === "healing") return arr;
                                if (!type) {
                                    arr.push({ "formula": formula || "", "types": {}, "operator": "" });
                                } else if (type.includes("+")) {
                                    let types = type.split('+');
                                    arr.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "and" });
                                } else if (type.includes('|')) {
                                    let types = type.split('|');
                                    arr.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "or" });
                                } else {
                                    arr.push({ "formula": formula, "types": { [type]: true }, "operator": "" } );
                                }

                                return arr;
                            }, []);
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