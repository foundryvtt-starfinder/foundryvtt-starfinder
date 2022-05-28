const fs = require('fs');
const dataPath = ".";

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
                    
                if (!fs.existsSync("./Clean")) {
                    fs.mkdir("./Clean", (err) => {
                        if (err) {
                            throw err;
                        };
                    });
                };
                    
                const output = JSON.stringify(toClean, null, 2);
                const name = toClean.name.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map(x => x.toLowerCase()).join('_');

                fs.writeFileSync(`Clean/${name}.json`, output);
                 
                console.log(`Cleaned ${toClean.name}`);
            };
            
        };
    });
    
} catch (err) {
    console.log(err);
};