const fs = require('fs');
const equipmentPaths = [
    "src/items/class-features",
    "src/items/conditions",
    "src/items/feats",
    "src/items/spells"
];

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

                let item = JSON.parse(json);

                if (item.data.damage?.parts?.length > 0) {
                    console.log(`Updating the damage types for actor items...`);
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

                if (item.data.critical?.parts?.length > 0) {
                    item.data.critical.parts = item.data.critical.parts.reduce((arr, curr) => {
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

                json = JSON.stringify(item, null, 2);

                fs.writeFileSync(`${path}/${file}`, json);
                console.log(`File ${file} was updated...`);
            }
        });
    }
} catch (err) {
    console.log(err);
}
