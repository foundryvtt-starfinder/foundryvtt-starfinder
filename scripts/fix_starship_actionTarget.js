const fs = require('fs');
const dataPath = "src/items/starship-components";
const itemType = "starshipWeapon";

console.log(`Scanning the equipment for ${itemType} items to update the actionTarget field of.`);
let count = 0;

try {
    fs.readdir(dataPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            const json = fs.readFileSync(`${dataPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });
            
            const itemData = JSON.parse(json);
            const oldActionTarget = itemData.data.actionTarget;
            
            if (itemData.type === itemType) {
                const isTracking = (itemData.data.weaponType === "tracking") || (itemData.data.weaponType === "ecm");
                
                
                if (isTracking) {
                    itemData.data.actionTarget = "tl";
                } else {
                    itemData.data.actionTarget = "ac";
                } 

                if (oldActionTarget !== itemData.data.actionTarget) {
                    const output = JSON.stringify(itemData, null, 2);

                    fs.writeFileSync(`${dataPath}/${file}`, output);
                    
                    count += 1;
                }
            }
        }

        console.log(`Found, and migrated, ${count} ${itemType} entries.`);
    });
    
} catch (err) {
    console.log(err);
}
