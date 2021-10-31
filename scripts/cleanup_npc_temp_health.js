const fs = require('fs');

function cleanupNpcTempHealth() {
    fs.readdir("src/items/alien-archives", "utf-8", async (err, files) => {
        if (err) throw err;

        for (const file of files) {
            console.log(`Loading JSON for file ${file}`);
            let json = fs.readFileSync(`src/items/alien-archives/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            let data = JSON.parse(json);

            data.data.attributes.hp.temp = null;
            data.data.attributes.hp.tempmax = null;

            json = JSON.stringify(data, null, 2);
            fs.writeFileSync(`src/items/alien-archives/${file}`, json);

            console.log(`File ${file} was updated...`);
        }
    });
}

try {
    cleanupNpcTempHealth();
} catch (err) {
    console.log(err);
}