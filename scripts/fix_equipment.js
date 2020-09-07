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
            let isDirty = false;
            
            // Create container framework            
            let container = {
                contents: [],
                storage: []
            };
            
            if (equipment?.type === "equipment") {
                // Armor slots are now to be removed and replaced with container settings.
                if (equipment.data?.armor && equipment.data?.armor.hasOwnProperty("upgradeSlots")) {
                    let numberArmorSlots = equipment.data.armor.upgradeSlots;
                    delete equipment.data.armor.upgradeSlots;
                    delete equipment.data.armor.upgrades;
                    isDirty = true;
                    
                    container.storage.push({
                        type: "slot",
                        subtype: "armorUpgrade",
                        amount: numberArmorSlots,
                        acceptsType: ["upgrade", "weapon"],
                        affectsEncumbrance: true,
                        weightProperty: "slots"
                    });
                }
                
                // Weapon slots are now to be removed and replaced with container settings.
                if (equipment.data.hasOwnProperty("weaponSlots")) {
                    let numberWeaponSlots = equipment.data.weaponSlots;
                    delete equipment.data.weaponSlots;
                    isDirty = true;
                    
                    container.storage.push({
                        type: "slot",
                        subtype: "weaponSlot",
                        amount: numberWeaponSlots,
                        acceptsType: ["weapon"],
                        affectsEncumbrance: true,
                        weightProperty: ""
                    });
                }
                                
                isDirty = !equipment.data.hasOwnProperty("container");
            }
            
            if (equipment?.type === "weapon") {
                delete equipment.data.fusions;
                
                container.storage.push({
                    type: "slot",
                    subtype: "fusion",
                    amount: equipment.data.level,
                    acceptsType: ["fusion"],
                    affectsEncumbrance: true,
                    weightProperty: "level"
                });
                
                isDirty = !equipment.data.hasOwnProperty("container");
            }
            
            if (equipment?.type === "container") {
                container.storage.push({
                    type: "bulk",
                    subtype: "",
                    amount: equipment.data.storageCapacity || 0,
                    acceptsType: ["weapon", "equipment", "goods", "consumable", "container", "technological", "fusion", "upgrade", "augmentation", "magic"],
                    affectsEncumbrance: equipment.data.contentBulkMultiplier === 0 ? false : true,
                    weightProperty: "bulk"
                });
                
                isDirty = !equipment.data.hasOwnProperty("container");
            }

            if (equipment.data.hasOwnProperty("storageCapacity")) {
                delete equipment.data.storageCapacity;
                isDirty = true;
            }

            if (equipment.data.hasOwnProperty("contentBulkMultiplier")) {
                delete equipment.data.contentBulkMultiplier;
                isDirty = true;
            }

            if (isDirty) {
                equipment.data["container"] = container;
                
                json = JSON.stringify(equipment, null, 2);
                fs.writeFileSync(`${equipmentPath}/${file}`, json);
            }
        }
    });
} catch (err) {
    console.log(err);
}
