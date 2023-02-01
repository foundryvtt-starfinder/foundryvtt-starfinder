const fs = require('fs');
const equipmentPath = "src/items/equipment";

try {
    fs.readdir(equipmentPath, 'utf-8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            let json = fs.readFileSync(`${equipmentPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            let equipment = JSON.parse(json);

            if (equipment.data.damage && equipment.data.damage.parts.length > 0) {
                equipment.data.damage.parts = equipment.data.damage.parts.reduce((arr, curr) => {
                    let [formula, type] = curr;

                    // if (type === "healing") return arr;
                    if (type.includes("+")) {
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

            json = JSON.stringify(equipment, null, 2);

            fs.writeFileSync(`${equipmentPath}/${file}`, json);
        }
    });
} catch (err) {
    console.log(err);
}
