const fs = require('fs');
const equipmentPath = "src/items/equipment";

try {
    fs.readdir(equipmentPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            let json = fs.readFileSync(`${equipmentPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            const equipment = JSON.parse(json);

            if (!["upgrade"].includes(equipment?.type ?? "")) continue;

            // Upgrades should have a value for allowedArmorType only
            // armorType should be deleted if it's present
            const allowedArmorType = equipment.system.allowedArmorType;
            const armorType = equipment.system.armorType;

            if (allowedArmorType) {
                if (armorType) {
                    delete equipment.system.armorType;
                }
            } else if (armorType) {
                equipment.system.allowedArmorType = armorType;
                delete equipment.system.armorType;
            }

            json = JSON.stringify(equipment, null, 2);

            fs.writeFileSync(`${equipmentPath}/${file}`, json);
        }
    });
} catch (err) {
    console.log(err);
}
