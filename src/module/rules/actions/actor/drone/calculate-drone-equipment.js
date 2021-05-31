export default function (engine) {
    engine.closures.add("calculateDroneEquipment", (fact, context) => {
        const data = fact.data;

        data.attributes.armorSlots.current = 0;
        if (fact.armorUpgrades) {
            data.attributes.armorSlots.current = fact.armorUpgrades.length;
        }

        data.attributes.weaponMounts.melee.current = 0;
        data.attributes.weaponMounts.ranged.current = 0;
        if (fact.weapons) {
            for (let weapon of fact.weapons) {
                const weaponData = weapon.data.data;

                let mountCost = 1;
                if (weaponData.properties.two) {
                    mountCost = 2;
                }

                switch (weaponData.actionType) {
                    default:
                        break;
                    case "mwak":
                        data.attributes.weaponMounts.melee.current += mountCost;
                        break;
                    case "rwak":
                        data.attributes.weaponMounts.ranged.current += mountCost;
                        break;
                }
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}