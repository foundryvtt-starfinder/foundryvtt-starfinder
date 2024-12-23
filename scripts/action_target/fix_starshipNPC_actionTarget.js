const fs = require('fs');
const dataPath = "src/items/starships";
const itemType = "starshipWeapon";

console.log(`Scanning the equipment for ${itemType} items to update the actionTarget field of.`);
let count = 0;
let starshipCount = 0;

try {
    fs.readdir(dataPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            const json = fs.readFileSync(`${dataPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            const starship = JSON.parse(json);
            const starshipWeapons = (starship.items).filter(i => i.type === "starshipWeapon");

            for (let weapons of starshipWeapons) {

                const oldActionTarget = weapons.data.actionTarget;

                if (weapons.type === itemType) {
                    const isTracking = (weapons.data.weaponType === "tracking") || (weapons.data.weaponType === "ecm");

                    if (isTracking) {
                        weapons.data.actionTarget = "tl";
                    } else {
                        weapons.data.actionTarget = "ac";
                    }
                }

                if (oldActionTarget !== weapons.data.actionTarget) {
                    const output = JSON.stringify(starship, null, 2);

                    fs.writeFileSync(`${dataPath}/${file}`, output);

                    count += 1;
                }
            }
            starshipCount += 1;
        }

        console.log(`Found, and migrated, ${count} ${itemType} weapons in ${starshipCount} starships.`);
    });

} catch (err) {
    console.log(err);
}
