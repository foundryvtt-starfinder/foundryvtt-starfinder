// This script updates the items in the compendiums to use the new set of default icons

const fs = require('fs');

const pathPrefix = "src/items/";
const actorPaths = [
    "alien-archives"
    // "characters",
    // "creature-companions",
    // "hazards",
    // "starships",
    // "vehicles"
];

const bookFolders = {
    CRB: "",
    AA1: "eQ1s3ipd6I4FFpkE",
    AA2: "zL0DrhX9UYBabnNW",
    AA3: "gTJQVURiWQz4rGgw",
    AA4: "oDeSIpQmKhLBZHHW",
    PW: "HzU4pi7xh9CI5TF0",
    AR: "af7TYUjpUOU3JuYa",
    COM: "yBi3Y24LuqDnsyFf",
    NS: "4KsRiTAyvQiqaHaG",
    SOM: "ULireRzWKtpO8vps",
    GEM: "cSxXsFcYwauRfg5c",
    TR: "QjHOY0haH5LbaXPx",
    GM: "DW2aiSzqWFHal07T",
    DC: "27OOZYr7D15MOSLt",
    IS: "6rftrA1XMoEcWYk9",
    PoC: "HQsnz6BTQQb8oDzl",
    EN: "JpZCMOCFFtkbIc8U",
    DS: "EnqryaZYMw8p30UF",
    SS: "9BuZE9kmfLaQlmXF",
    MG: "fSWKQHAPPtkqPxid"
};

const apNumberLookup = {
    deadSuns:            [1, 2, 3, 4, 5, 6],
    aeonThrone:          [7, 8, 9],
    signalOfScreams:     [10, 11, 12],
    dawnOfFlame:         [13, 14, 15, 16, 17, 18],
    attackOfTheSwarm:    [19, 20, 21, 22, 23, 24],
    threefoldConspiracy: [25, 26, 27, 28, 29, 30],
    devastationArk:      [31, 32, 33],
    flyFreeOrDie:        [34, 35, 36, 37, 38, 39],
    horizonsOfTheVast:   [40, 41, 42, 43, 44, 45],
    driftCrashers:       [46, 47, 48],
    driftHackers:        [49, 50, 51]
};

const apFolders = {
    deadSuns:            "EnqryaZYMw8p30UF",
    aeonThrone:          "g2AMAT6kXtQ77BWu",
    signalOfScreams:     "CoMuSu7bsiUGFVas",
    dawnOfFlame:         "0514IAIl7MKiiE5w",
    attackOfTheSwarm:    "6ND7QPXmoGl6zL0n",
    threefoldConspiracy: "bKBiqjrKWNpw4c6D",
    devastationArk:      "OQ6WpwgozVk0pfbr",
    flyFreeOrDie:        "i7hAUZpyngSltKPf",
    horizonsOfTheVast:   "lseP1NMlLWuNTJ0v",
    driftCrashers:       "yIoTogLMO2UBi3V4",
    driftHackers:        "vraLS2BLuJPvhKod"
};

const adventureFolders = {
    "SA:FC":  "vssDMIyQE5wqP9kd",
    "SA:SSH": "KARlqIvwk9QwLP6l",
    "SA:SC":  "3420h75AI13S6XCf",
    "SA:SH":  "LlwOazZ9ixRJnEqY",
    "SA:SW":  "FpBcRB9jAZYZZdQb",
    "SA:HH":  "PG1dgjiVHx6tfBSZ",
    "SA:OSP": "7JcB2wNcG4p9GNMW",
    "SA:JD":  "msVs78sbx7Tq8wLm",
    "SA:LL":  "WeG0R9FvPOiwv1Ve",
    "SA:DD":  "DYuzrOHDv9hP6K5D",
    "SA:RR":  "G97gbnIche7l8bNr",
    "SA:DCF": "XUWIKtBDcRVW5jTy"
};

console.log(`Starting script`);

for (const currentPath of actorPaths) {
    const folderPath = pathPrefix + currentPath;
    console.log(`Checking items in folder: ${folderPath}`);

    const files = fs.readdirSync(folderPath).filter(e => e !== '_folders.json');
    for (const file of files) {
        const fname = folderPath + '/' + file;
        // console.debug(`Opening up the ${fname} file.`);
        const json = fs.readFileSync(fname);
        const actor = JSON.parse(json);
        const [changed, folderString] = findFolder(actor);
        if (changed) {
            actor.folder = folderString;
            fs.writeFileSync(fname, JSON.stringify(actor, null, 2));
        }
    }
}

function findFolder(actor) {
    if (!actor.folder) {
        const source = actor.system?.details?.source?.split(" ");
        // console.debug(source);
        if (source?.length) {
            const sourceBookString = source[0];
            // console.debug(sourceBookString);
            if (sourceBookString === "AP") {
                const apNumberString = source[1].replace("#", "");
                const apNumber = Number(apNumberString);
                for (const [apName, apNumbers] of Object.entries(apNumberLookup)) {
                    // console.debug(apName, apNumbers, apNumber);
                    if (apNumbers.includes(apNumber)) {
                        // console.log(`${actor.name} to folder ${apFolders[apName]}`);
                        return [true, apFolders[apName]];
                    }
                }
                console.log(`In Actor ${actor.name}, couldn't find Adventure Path #${apNumberString} (eval: ${apNumber})`);
                return [false, ""];
            } else if (sourceBookString in bookFolders) {
                // console.log(`${actor.name} to folder ${bookFolders[sourceBookString]}`);
                return [true, bookFolders[sourceBookString]];
            } else if (sourceBookString in adventureFolders) {
                // console.log(`${actor.name} to folder ${adventureFolders[sourceBookString]}`);
                return [true, adventureFolders[sourceBookString]];
            }
        }
    } else {
        console.log(`Actor ${actor.name} already has a folder.`);
        return [false, ""];
    }
    console.log(`----- Actor ${actor.name} didn't get a folder assigned -----`);
    return [false, ""];
}
