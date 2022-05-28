const fs = require('fs');
const dataPath = "src/items/alien-archives";
const itemType = "weapon";

console.log(`Scanning the equipment for ${itemType} items to update the actionTarget field of.`);
let count = 0;
let alienCount = 0;

try {
    fs.readdir(dataPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            const json = fs.readFileSync(`${dataPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });
            
            const alien = JSON.parse(json);
            const alienWeapons = (alien.items).filter(i => i.type === "weapon");
            
            for (let weapons of alienWeapons) {
                
                const oldActionTarget = weapons.data.actionTarget;
                
                const hasForceProperty = weapons.data.properties?.force || false;
                const isGrenade = weapons.data.weaponType === "grenade";
                let hasKineticDamage = false;
                
                for (const damagePart of weapons.data.damage.parts) {
                    const isKineticDamage = (damagePart.types?.bludgeoning || damagePart.types?.piercing || damagePart.types?.slashing);
                    if (isKineticDamage) {
                        hasKineticDamage = true;
                        break;
                    }
                }
                
                if (isGrenade) {
                    weapons.data.actionTarget = "";
                } else if (hasKineticDamage && !hasForceProperty) {
                    weapons.data.actionTarget = "kac";
                } else {
                    weapons.data.actionTarget = "eac";
                }

                if (oldActionTarget !== weapons.data.actionTarget) {
                    const output = JSON.stringify(alien, null, 2);

                    fs.writeFileSync(`${dataPath}/${file}`, output);
                    
                    count += 1;
                }
            }
        alienCount += 1;
        }
        
        console.log(`Found, and migrated, ${count} ${itemType} weapons in ${alienCount} aliens.`);
    });
    
} catch (err) {
    console.log(err);
}
