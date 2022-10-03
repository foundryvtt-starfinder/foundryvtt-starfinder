import fs from 'fs';
import path from 'path';

async function migrateItemsToV10DataModel() {
    console.log(`> Starting v10 data model migration...`);
    const itemFoldersToUpdate = [
        'src/items/alien-archives',
        'src/items/archetypes',
        'src/items/characters',
        'src/items/class-features',
        'src/items/classes',
        'src/items/conditions',
        'src/items/equipment',
        'src/items/feats',
        'src/items/hazards',
        'src/items/races',
        'src/items/racial-features',
        'src/items/spells',
        'src/items/starship-actions',
        'src/items/starship-components',
        'src/items/starships',
        'src/items/themes',
        'src/items/universal-creature-rules',
        'src/items/vehicles'
    ];

    for (const folder of itemFoldersToUpdate) {
        console.log(`-> Updating files in ${folder}...`);
        fs.readdir(folder, 'utf-8', async (err, files) =>{
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(path.join(folder, file), {encoding: 'utf-8', flag: 'r+'});

                console.log(`--> Updating ${file} to use the v10 data model...`);
                const data = JSON.parse(json);
                const system = data.data;
                delete data.data;
                data.system = system;

                if (data.items && data.items.length > 0) {
                    for (const item of data.items) {
                        const itemSystem = item.data;
                        delete item.data;
                        item.system = itemSystem;
                    }
                }

                fs.writeFileSync(path.join(folder, file), JSON.stringify(data, null, 2));
                console.log(`--> ${file} has been updated`);
            }
        });
        console.log(`-> Finished updating files in ${folder}...`);
    }

    console.log(`> Finished with v10 data model migration...`);
}


try {
    await migrateItemsToV10DataModel();
} catch (err) { 
    console.error(err);
}