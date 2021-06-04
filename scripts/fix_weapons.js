const fs = require('fs');
const equipmentPath = "../src/items/equipment";

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

            if (equipment.type == "weapon") {
                var i = 0;
                var container = equipment.data?.container;

                for(const s in container){
                    container.storage = container.storage.filter(function(a){return a.subtype != "weaponManufacturer"});
                    container.storage.push({
                        type: "slot",
                        subtype: "weaponManufacturer",
                        amount: 1,
                        acceptsType: ["weaponManufacturer"],
                        affectsEncumbrance: true,
                        weightProperty: ""
                    });
                }
            }
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
