const fs = require('fs');

const dataPaths = [
    "../../src/items/feats",
    "../../src/items/class-features",
    "../../src/items/racial-features",
    "../../src/items/archetype-features",
    "../../src/items/universal-creature-rules"
];

// Add a category field to feats depending on their source compendium

try {
    for (const path of dataPaths) {
        fs.readdir(path, 'utf8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });

                const feat = JSON.parse(json);
                if (feat.type !== "feat") continue;

                feat.system.details = {};
                const details = feat.system.details;
                if (path.endsWith("feats")) {
                    details.category = "feat";
                    if (feat.name.includes("(Combat)")) details.combat = true;
                } else if (path.endsWith("class-features")) {
                    details.category = "classFeature";
                } else if (path.endsWith("racial-features")) {
                    details.category = "speciesFeature";
                } else if (path.endsWith("archetype-features")) {
                    details.category = "archetypeFeature";
                } else if (path.endsWith("universal-creature-rules")) {
                    details.category = "universalCreatureRule";
                }

                if (feat.name.includes("(Ex)")) details.specialAbilityType = "ex";
                else if (feat.name.includes("(Su)")) details.specialAbilityType = "su";
                else if (feat.name.includes("(Sp)")) details.specialAbilityType = "sp";

                const output = JSON.stringify(feat, null, 2);

                fs.writeFileSync(`${path}/${file}`, output);
                console.log(`Migrated ${feat.name}`);

            }
        });

    }
} catch (err) {
    console.log(err);
}
