//This script replaces the Piloting skill of any Gunners in NPC ships with the new Gunnery Skill.

const fs = require('fs');
const dataPath = "../src/items/starships";
const itemType = "starship";

console.log(`Scanning for ${itemType} items to update the Piloting field of.`);
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
            const oldPiloting = itemData.data.crew.npcData.gunner.skills.pil;
        
            
            if (itemData.type === itemType) {
                const hasPiloting = (!!oldPiloting);
                
                if (hasPiloting) {
                    itemData.data.crew.npcData.gunner.skills.gun = oldPiloting;
                    delete itemData.data.crew.npcData.gunner.skills.pil;
                } 

                if (oldPiloting !== itemData.data.crew.npcData.gunner.skills.pil) {
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
