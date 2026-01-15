import fs from "fs-extra";
import path from "path";
import isObject from "../src/module/utils/is-object.js";

export function duplicate(data) {
    return JSON.parse(JSON.stringify(data));
}

export async function measureTime(func) {
    const t0 = performance.now();
    await func();
    const t1 = performance.now();

    const timeMs = t1 - t0;
    const timeS = (timeMs / 1000).toFixed(2);

    console.log(`Completed in ${timeS} seconds.`);
}

export function getManifest() {
    const json = {};

    if (fs.existsSync('static')) {
        json.root = 'static';
    } else {
        json.root = 'dist';
    }

    const systemPath = path.join(json.root, 'system.json');

    if (fs.existsSync(systemPath)) {
        json.file = fs.readJSONSync(systemPath);
        json.name = 'system.json';
    } else {
        return null;
    }

    return json;
}

/**
 * Sorts the keys in a JSON object, which should make it easier to find data keys.
 */
export function JSONstringifyOrder( obj, space, sortingMode = "default" ) {
    const allKeys = [];
    const seen = {};
    JSON.stringify(obj, function(key, value) {
        if (!(key in seen)) {
            allKeys.push(key);
            seen[key] = null;
        }
        return value;
    });
    allKeys.sort();

    if (sortingMode === "item") {
        // Ensure name is after _id, and type is after name.
        const idIndex = allKeys.indexOf("_id");

        const nameIndex = allKeys.indexOf("name");
        if (nameIndex > -1) {
            allKeys.splice(nameIndex, 1);
            allKeys.splice(idIndex + 1, 0, "name");
        }

        const typeIndex = allKeys.indexOf("type");
        if (typeIndex > -1) {
            allKeys.splice(typeIndex, 1);
            allKeys.splice(idIndex + 2, 0, "type");
        }
    }

    return JSON.stringify(obj, allKeys, space);
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}
