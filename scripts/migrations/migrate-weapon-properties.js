const fs = require('fs');

const dataPaths = [
    "./src/items/equipment"
];

try {
    for (const path of dataPaths) {
        fs.readdir(path, 'utf8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });
                let clean = false;

                const item = JSON.parse(json);

                const properties = item.system.properties;
                if (properties) {
                    const newProperties = {};
                    for (const property of Object.entries(properties)) {
                        newProperties[property[0]] = {value: property[1]};
                        if (property[1]) {
                            newProperties[property[0]].extension = '';
                        }
                    }
                    item.system.properties = newProperties;
                    clean = true;
                }

                if (clean) {
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
