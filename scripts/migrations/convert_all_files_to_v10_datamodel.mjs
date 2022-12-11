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

                if (data.data) {
                    const system = data.data;
                    delete data.data;
                    data.system = system;
                }

                if (data.items && data.items.length > 0) {
                    for (const item of data.items) {
                        if (item.data) {
                            const itemSystem = item.data;
                            delete item.data;
                            item.system = itemSystem;
                        }
                    }
                }

                if (data.token) {
                    const token = data.token
                    delete data.token
                    data.prototypeToken = token;
                }

                if (data.prototypeToken) {
                    const prototypeToken = data.prototypeToken;
                    prototypeToken.sight = {
                        angle: 360,
                        attenuation: 0.1,
                        brightness: 1,
                        color: null,
                        contrast: 0,
                        enabled: false,
                        range: 0,
                        saturation: 0,
                        visionMode: "basic"
                    };
                    delete prototypeToken.lightAlpha
                    delete prototypeToken.lightAngle
                    delete prototypeToken.lightColor
                    delete prototypeToken.sightAngle
                    delete prototypeToken.tint
                    delete prototypeToken.vision
                    delete prototypeToken.dimSight
                    delete prototypeToken.brightSight
                    delete prototypeToken.dimLight
                    delete prototypeToken.brightLight
                    delete prototypeToken.lightAnimation

                    prototypeToken.bar1 = {
                        attribute: "attributes.hp"
                    }

                    prototypeToken.displayBars = 20;
                    prototypeToken.displayName = 20;

                    prototypeToken.texture = {
                        offsetX: 0,
                        offsetY: 0,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        src: prototypeToken.img,
                        tint: null,
                    }

                    delete prototypeToken.img

                    prototypeToken.light = {
                        alpha: 0.5,
                        angle: 360,
                        animation: {
                            intensity: 5,
                            reverse: false,
                            speed: 5,
                            type: null
                        },
                        attenuation: 0.5,
                        bright: 0,
                        color: null,
                        coloration: 1,
                        contrast: 0,
                        darkness: {
                            max: 1,
                            min: 0
                        },
                        dim: 0,
                        luminosity: 0.5,
                        saturation: 0,
                        shadows: 0
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