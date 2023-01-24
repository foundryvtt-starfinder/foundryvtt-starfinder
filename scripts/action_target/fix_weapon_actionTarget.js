const fs = require('fs');
const dataPath = "src/items/equipment";
const itemType = "weapon";

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

            if (itemData.type === itemType) {
                const oldActionTarget = itemData.data.actionTarget;

                const hasForceProperty = itemData.data.properties?.force || false;
                const isGrenade = itemData.data.weaponType === "grenade";
                let hasKineticDamage = false;

                for (const damagePart of itemData.data.damage.parts) {
                    const isKineticDamage = (damagePart.types?.bludgeoning || damagePart.types?.piercing || damagePart.types?.slashing);
                    if (isKineticDamage) {
                        hasKineticDamage = true;
                        break;
                    }
                }

                if (isGrenade) {
                    itemData.data.actionTarget = "";
                } else if (hasKineticDamage && !hasForceProperty) {
                    itemData.data.actionTarget = "kac";
                } else {
                    itemData.data.actionTarget = "eac";
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
