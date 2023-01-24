const fs = require('fs');
const compendiumRootPath = "src/items";

console.log(`Scanning the items in the compendium to update the image from png to webp.`);
let count = 0;

function needsReplace(imagePath) {
    const fileTypes = [".png", ".PNG", ".jpg", ".JPG", ".jpeg", ".JPEG"];
    for (const fileType of fileTypes) {
        if (imagePath?.endsWith(fileType)) {
            if (imagePath?.includes("sfrpg")) {
                return fileType;
            } else {
                console.log(`Found non-system ${fileType}: ${imagePath}`);
            }
        }
    }
    return null;
}

try {
    fs.readdir(compendiumRootPath, 'utf-8', (err, folders) => {
        if (err) throw err;

        for (const compendiumFolder of folders) {
            const compendiumPath = compendiumRootPath + "/" + compendiumFolder;
            const files = fs.readdirSync(compendiumPath);
            for (const file of files) {
                const json = fs.readFileSync(`${compendiumPath}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });

                const itemData = JSON.parse(json);
                let isDirty = false;

                const imageType = needsReplace(itemData.img);
                if (imageType) {
                    itemData.img = itemData.img.replace(imageType, ".webp");
                    isDirty = true;
                }

                const fullBodyImageType = needsReplace(itemData.data?.details?.biography?.fullBodyImage);
                if (fullBodyImageType) {
                    itemData.data.details.biography.fullBodyImage = itemData.data.details.biography.fullBodyImage.replace(fullBodyImageType, ".webp");
                    isDirty = true;
                }

                if (itemData.data?.combatTracker?.visualization?.length > 0) {
                    for (const visualization of itemData.data.combatTracker.visualization) {
                        const visualizationImageType = needsReplace(visualization.image);
                        if (visualizationImageType) {
                            visualization.image = visualization.image.replace(visualizationImageType, ".webp");
                            isDirty = true;
                        }
                    }
                }

                if (itemData.items?.length > 0) {
                    for (const item of itemData.items) {
                        if (item.img) {
                            const itemImageType = needsReplace(item.img);
                            if (itemImageType) {
                                item.img = item.img.replace(itemImageType, ".webp");
                                isDirty = true;
                            }
                        } else {
                            item.img = "icons/svg/mystery-man.svg";
                        }
                    }
                }

                let jsonOutput = JSON.stringify(itemData, null, 2);
                if (jsonOutput.includes(".png") || jsonOutput.includes(".PNG")) {
                    jsonOutput = jsonOutput.replace(/(.png)/gi, ".webp");
                    isDirty = true;
                }

                if (isDirty) {
                    fs.writeFileSync(`${compendiumPath}/${file}`, jsonOutput);

                    count += 1;
                }
            }
        }

        console.log(`Found, and migrated, ${count} entries.`);
    });

} catch (err) {
    console.log(err);
}
