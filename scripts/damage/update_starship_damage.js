const fs = require('fs');
const equipmentPath = "src/items/starships";

try {
    fs.readdir(equipmentPath, 'utf-8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            console.log(`Loading json for file ${file}`);
            let json = fs.readFileSync(`${equipmentPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            let starship = JSON.parse(json);

            if (starship.items && starship.items.length > 0) {
                console.log(`Updating the damage types for starship weapons...`);
                const weapons = starship.items.filter(i => i.type === "starshipWeapon");
                for (const weapon of weapons) {
                    if (weapon.data.damage?.parts?.length > 0) {
                        weapon.data.damage.parts = weapon.data.damage.parts.reduce((arr, curr) => {
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

            json = JSON.stringify(starship, null, 2);

            fs.writeFileSync(`${equipmentPath}/${file}`, json);
            console.log(`File ${file} was updated...`);
        }
    });
} catch (err) {
    console.log(err);
}