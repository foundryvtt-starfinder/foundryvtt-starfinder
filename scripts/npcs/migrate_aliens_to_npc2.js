const fs = require('fs');
const dataPath = "src/items/alien-archives";

console.log(`Scanning the alien archive for old style NPC entries.`);
let count = 0;

try {
    fs.readdir(dataPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            const json = fs.readFileSync(`${dataPath}/${file}`, {
                encoding: 'utf8',
                flag: 'r+'
            });

            const alienData = JSON.parse(json);

            if (alienData.type === "npc") {
                alienData.type = "npc2";

                for (const [abl, ability] of Object.entries(alienData.data.abilities)) {
                    ability.base = ability.mod;
                }

                for (const [skl, skill] of Object.entries(alienData.data.skills)) {
                    if (skill.enabled) {
                        skill.ranks = skill.mod;
                    }
                }

                alienData.data.attributes.eac.base = alienData.data.attributes.eac.value;
                alienData.data.attributes.kac.base = alienData.data.attributes.kac.value;
                alienData.data.attributes.init.value = alienData.data.attributes.init.total;

                alienData.data.attributes.fort.base = alienData.data.attributes.fort.bonus;
                alienData.data.attributes.reflex.base = alienData.data.attributes.reflex.bonus;
                alienData.data.attributes.will.base = alienData.data.attributes.will.bonus;

                const output = JSON.stringify(alienData, null, 2);

                fs.writeFileSync(`${dataPath}/${file}`, output);

                count += 1;
            }
        }

        console.log(`Found, and migrated, ${count} alien archive entries.`);
    });
} catch (err) {
    console.log(err);
}
