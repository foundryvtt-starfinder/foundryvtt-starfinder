const fs = require('fs');
const dataPath = "src/items/equipment";
const equippableItems = ['container', 'equipment', 'shield', 'weapons'];

console.log(`Scanning the equipment compendium for equippable items to update.`);
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
            
            if (equippableItems.includes(itemData.type)) {
                let isDirty = false;
                
                if (!itemData.data.equippable) {
                    itemData.data.equippable = true;
                    isDirty = true;
                }
                
                if (itemData.data.proficient) {
                    itemData.data.proficient = false;
                    isDirty = true;
                }

                if (isDirty) {
                    console.log(`> ${file}`);
                    const output = JSON.stringify(itemData, null, 2);

                    fs.writeFileSync(`${dataPath}/${file}`, output);
                    
                    count += 1;
                }
            }
        }
        
        console.log(`\nFound, and migrated, ${count} equipment entries.`);
    });
} catch (err) {
    console.log(err);
}
