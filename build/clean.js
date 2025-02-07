import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

const name = "sfrpg";
const files = [
    "lang",
    "templates",
    "module",
    "fonts",
    "icons",
    "images",
    "packs",
    "lib",
    "styles",
    `maps`,
    `${name}.js`,
    `${name}.mjs`,
    `${name}.js.map`,
    `${name}.mjs.map`,
    `${name}.css`,
    "module.json",
    "system.json",
    "template.json",
    "README.md",
    "OGL",
    "LICENSE",
    "changelist.md"

];

console.log(chalk.yellow("Files to clean: "), chalk.blueBright(files.join(", ")));

// Attempt to remove the files
try {
    for (const filePath of files) {
        fs.rm(path.join("dist", filePath), { recursive: true, force: true });
    }
    console.log(chalk.green("Clean complete."));
} catch (err) {
    console.error(err);
}
