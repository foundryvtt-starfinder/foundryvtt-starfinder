// This script updates the items in the compendiums to use the new set of default icons

const fs = require('fs');
const path = require('path');

const pathPrefix = "src/items/";
const actorPaths = [
    "alien-archives",
    "characters",
    "creature-companions",
    "hazards",
    "starships",
    "vehicles"
];

const itemPaths = [
    "archetype-features",
    "archetypes",
    "class-features",
    "classes",
    "effects",
    "equipment",
    "feats",
    "races",
    "racial-features",
    "spells",
    "starship-actions",
    "starship-components",
    "theme-features",
    "themes",
    "universal-creature-rules"
];

const foundryDefaultIcons = {
    "actor": "icons/svg/mystery-man.svg",
    "item": "icons/svg/item-bag.svg",
    "old": "icons/svg/cowled.svg"
};

const defaultActorIcons = {
    "character": "astronaut-helmet.svg",
    "drone": "delivery-drone.svg",
    "hazard": "mantrap.svg",
    "npc": "alien-stare.svg",
    "npc2": "alien-stare.svg",
    "starship": "starfighter.svg",
    "vehicle": "bus.svg"
};

const defaultItemIcons = {
    "archetypes": "toggles.svg",
    "class": "id-card.svg",
    "race": "dna2.svg",
    "theme": "plane-pilot.svg",

    "actorResource": "pie-chart.svg",
    "feat": "achievement.svg",
    "spell": "spell-book.svg",
    "effect": "stopwatch.svg",

    "asi": "upgrade.svg",

    "chassis": "robot-golem.svg",
    "mod": "auto-repair.svg",

    "starshipAblativeArmor": "metal-plate.svg",
    "starshipAction": "crosshair.svg",
    "starshipArmor": "metal-scales.svg",
    "starshipComputer": "server-rack.svg",
    "starshipCrewQuarter": "bunk-beds.svg",
    "starshipDefensiveCountermeasure": "bubble-field.svg",
    "starshipDriftEngine": "star-gate.svg",
    "starshipExpansionBay": "cardboard-box-closed.svg",
    "starshipFortifiedHull": "steel-door.svg",
    "starshipFrame": "hexagonal-nut.svg",
    "starshipOtherSystem": "gears.svg",
    "starshipPowerCore": "power-generator.svg",
    "starshipReinforcedBulkhead": "metal-scales-plus.svg",
    "starshipSecuritySystem": "cctv-camera.svg",
    "starshipSensor": "radar-dish.svg",
    "starshipShield": "forward-field.svg",
    "starshipSpecialAbility": "cpu.svg",
    "starshipThruster": "rocket-thruster.svg",
    "starshipWeapon": "strafe.svg",

    "vehicleAttack": "reticule.svg",
    "vehicleSystem": "gear-stick.svg",

    "ammunition": "bullets.svg",
    "augmentation": "vr-headset.svg",
    "consumable": "beer-bottle.svg",
    "container": "briefcase.svg",
    "equipment": "kevlar-vest.svg",
    "fusion": "lightning-spanner.svg",
    "goods": "hand-truck.svg",
    "hybrid": "energise.svg",
    "magic": "magick-trick.svg",
    "shield": "energy-shield.svg",
    "technological": "processor.svg",
    "upgrade": "armor-upgrade.svg",
    "weapon": "bolter-gun.svg",
    "weaponAccessory": "gun-stock.svg"
};

console.log(`Starting script`);

for (const currentPath of itemPaths) {
    const folderPath = pathPrefix + currentPath;
    console.log(`Checking items in folder: ${folderPath}`);

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const fname = folderPath + '/' + file;
        // console.log(`Opening up the ${fname} file.`);
        const json = fs.readFileSync(fname);
        const itemData = JSON.parse(json);
        const newItemData = iconReplace(defaultItemIcons, itemData);
        if (newItemData[0]) {
            fs.writeFileSync(fname, JSON.stringify(newItemData[1], null, 2));
        }
    }
}

for (const currentPath of actorPaths) {
    const folderPath = pathPrefix + currentPath;
    console.log(`Checking items in folder: ${folderPath}`);

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const fname = folderPath + '/' + file;
        // console.log(`Opening up the ${fname} file.`);
        const json = fs.readFileSync(fname);
        const actorData = JSON.parse(json);
        const newActorData = actorIconReplace(defaultActorIcons, actorData);
        if (newActorData[0]) {
            fs.writeFileSync(fname, JSON.stringify(newActorData[1], null, 2));
        }
    }
}

function iconReplace(defaultIconsObject, data, docType = "", iconType = "") {
    // If the item has a type that's found in the icon list and it's icon is an old default icon, update it
    // console.log(data.img);
    if (Object.keys(defaultIconsObject).includes(data.type) || Object.keys(defaultIconsObject).includes(docType)) {
        // If a prototype token, use one image path
        if (iconType === "prototypeToken") {
            if (Object.values(foundryDefaultIcons).includes(data.texture.src)) {
                const newImg = 'systems/sfrpg/icons/default/' + defaultIconsObject[docType];
                console.log(`Original image ${data.texture.src}, new image ${newImg}`);
                data.texture.src = newImg;
                return [true, data];
            }
        }
        // If anything else, use another image path
        else {
            if (Object.values(foundryDefaultIcons).includes(data.img)) {
                const newImg = 'systems/sfrpg/icons/default/' + defaultIconsObject[data.type];
                // console.log(`Original image ${data.img}, new image ${newImg}`);
                data.img = newImg;
                return [true, data];
            }
        }
    }
    return [false, data];
}

function actorIconReplace(defaultIconsObject, actorData) {
    let changed = false;

    // Check the actor's prototype token image
    const newPrototypeTokenData = iconReplace(defaultIconsObject, actorData.prototypeToken, actorData.type, 'prototypeToken');
    if (newPrototypeTokenData[0]) {
        actorData.prototypeToken = newPrototypeTokenData[1];
        changed = true;
    }

    // Re-icon all of the actor's items
    for (itemData of actorData.items) {
        const newItemData = iconReplace(defaultItemIcons, itemData);
        if (newItemData[0]) {
            itemData = newItemData[1];
            changed = true;
        }
    }

    // Check the actor's image itself
    const newActorData = iconReplace(defaultIconsObject, actorData);
    if (newActorData[0]) {
        actorData = newActorData[1];
        changed = true;
    }

    // Return the new actor data
    return [changed, actorData];
}
