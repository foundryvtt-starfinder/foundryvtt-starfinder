const fs = require('fs');
const dataPaths = [
    "src/items/starships",
    "src/items/vehicles"
];

console.log(`Removing actor data from linked crew.`);
let count = 0;

try {
    for (const dataPath of dataPaths) {
        const files = fs.readdirSync(dataPath);
        for (const file of files) {
            for (const file of files) {
                const json = fs.readFileSync(`${dataPath}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });
                
                const itemData = JSON.parse(json);
                let isDirty = false;
                
                if (itemData.data.crew) {
                    for (const [key, crewData] of Object.entries(itemData.data.crew)) {
                        if (crewData.actorIds?.length > 0) {
                            crewData.actorIds = [];
                            isDirty = true;
                        }
                        
                        if (crewData.actors?.length > 0) {
                            delete crewData.actors;
                            isDirty = true;
                        }
                    }
                }

                if (isDirty) {
                    const output = JSON.stringify(itemData, null, 2);
                    fs.writeFileSync(`${dataPath}/${file}`, output);
                    
                    count += 1;
                }
            }
        }
    }
    console.log(`Found, and migrated, ${count} entries.`);
} catch (err) {
    console.log(err);
}
