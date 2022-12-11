//This script deletes _id, flags, sort and effects from exported JSONs, and cleans up the file names to match existing JSONs, useful if you're overriting existing items. Copy this script into the folder with your JSONs, then open CMD in that folder (type "cmd" in the Windows Explorer address bar) and type "node item_cleaner.js"

const fs = require('fs');
const dataPath = ".";

let sanitize = null;
try {
    sanitize = require("sanitize-filename");
} catch (err) {   
}   

try {
    fs.readdir(dataPath, 'utf8', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            if (file.split('.').pop() === "json") {
                const json = fs.readFileSync(`${dataPath}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });
                
                    const toClean = JSON.parse(json);
                    
                    try {
                        delete toClean.flags;
                    } catch (err) {
                        console.log(err)
                    };
                    try {
                        delete toClean._id;
                    } catch (err) {
                        console.log(err)
                    };
                    try {
                        delete toClean.sort;
                    } catch (err) {
                        console.log(err)
                    };
                    try {
                        delete toClean.effects;
                    } catch (err) {
                        console.log(err)
                    };
                    
                if (!fs.existsSync("./Clean")) {
                    fs.mkdir("./Clean", (err) => {
                        if (err) {
                            throw err;
                        };
                    });
                };
                    
                const output = JSON.stringify(toClean, null, 2);
                let filename = toClean.name;
                if (sanitize) {
                     filename = sanitize(filename);
                }
                filename = filename.replace(/[\s]/g, "_");
                filename = filename.replace(/[,;]/g, "");
                filename = filename.toLowerCase();


                fs.writeFileSync(`Clean/${filename}.json`, output);
                 
                console.log(`Cleaned ${toClean.name}`);
            };
            
        };
        console.log(`\nFinished cleaning; cleaned files are in the Clean folder.`)
    });
    
} catch (err) {
    console.log(err);
};