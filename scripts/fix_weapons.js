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
            
            let equipment = JSON.parse(json);

            if (!["weapon"].includes(equipment?.type ?? "")) continue;

            // Weapons that have their activation type set to something
            // other than none are causing display issues on an actor's 
            // inventory tab.
            equipment.data.activation.type = "none";
            equipment.data.activation.cost = null;

            // Weapon proficiency should be handled by the actor.
            equipment.data.proficient = false;

            json = JSON.stringify(equipment, null, 2);

            fs.writeFileSync(`${equipmentPath}/${file}`, json);
        }
    });
} catch (err) {
    console.log(err);
}
