import fs from "fs-extra";
import { duplicate, JSONstringifyOrder, mergeDeep } from "./util.js";

console.log(`Opening localization files`);

const langSourceDir = "static/lang";
const files = fs.readdirSync(langSourceDir);

// First we sort the JSON keys alphabetically
console.log(`Sorting keys`);
for (const filePath of files) {
    console.log(`> ${filePath}`);
    const fileRaw = await fs.readFile(langSourceDir + "/" + filePath);
    const fileJson = JSON.parse(fileRaw);

    const outRaw = JSONstringifyOrder(fileJson, 4);
    fs.writeFile(langSourceDir + "/" + filePath, outRaw);
}
console.log(``);

// Get original file data
const englishFilePath = `${langSourceDir}/en.json`;
const englishRaw = fs.readFileSync(englishFilePath);
const englishJson = JSON.parse(englishRaw);

// Then we ensure all languages are in sync with English
console.log(`Ensuring language files are in sync with English`);
for (const filePath of files) {
    const isEnglish = filePath.includes("en.json");
    if (isEnglish) {
        continue;
    }

    console.log(`> ${filePath}`);

    const languageRaw = await fs.readFile(langSourceDir + "/" + filePath);
    const languageJson = JSON.parse(languageRaw);

    const copiedJson = duplicate(englishJson);
    mergeDeep(copiedJson, languageJson);

    const outRaw = JSONstringifyOrder(copiedJson, 4);
    fs.writeFile(langSourceDir + "/" + filePath, outRaw);
}
