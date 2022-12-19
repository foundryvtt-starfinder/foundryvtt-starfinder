const fs = require('fs');
const equipmentPath = "src/items/starship-components";

try {
    fs.readdir(equipmentPath, 'utf-8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            console.log(`Loading json for file ${file}`);
            let json = fs.readFileSync(`${equipmentPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            let component = JSON.parse(json);

            if (component.data.damage?.parts?.length > 0) {
                console.log(`Updating the damage types for starship weapons...`);
                component.data.damage.parts = component.data.damage.parts.reduce((arr, curr) => {
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

            json = JSON.stringify(component, null, 2);

            fs.writeFileSync(`${equipmentPath}/${file}`, json);
            console.log(`File ${file} was updated...`);
        }
    });
} catch (err) {
    console.log(err);
}
