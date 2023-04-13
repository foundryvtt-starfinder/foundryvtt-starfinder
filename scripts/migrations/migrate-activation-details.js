const fs = require('fs');

const dataPaths = [
    "../../src/items/feats",
    "../../src/items/class-features",
    "../../src/items/racial-features",
    "../../src/items/archetype-features",
    "../../src/items/universal-creature-rules",
    "../../src/items/spells",
    "../../src/items/equipment"
];

// Migrate features and spells to use calculated values for range, area and duration

try {
    for (const path of dataPaths) {
        fs.readdir(path, 'utf8', (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const json = fs.readFileSync(`${path}/${file}`, {
                    encoding: 'utf8',
                    flag: 'r+'
                });
                let dirty = false;

                const item = JSON.parse(json);
                // Migrate range
                const range = item?.system?.range;
                if (range) {
                    if (range?.additional?.includes("5 ft")
                        && range?.per?.includes("2 levels")
                        && range?.units?.includes("ft")
                        && range?.value === 25) {
                        range.units = "close";
                        delete range.additional;
                        delete range.per;
                        delete range.value;
                        dirty = true;
                    } else if (range?.additional?.includes("10 ft")
                        && range?.per?.includes("level")
                        && range?.units?.includes("ft")
                        && range?.value === 100) {
                        range.units = "medium";
                        delete range.additional;
                        delete range.per;
                        delete range.value;
                        dirty = true;
                    } else if (range?.additional?.includes("40 ft")
                        && range?.per?.includes("level")
                        && range?.units?.includes("ft")
                        && range?.value === 400) {
                        range.units = "long";
                        delete range.additional;
                        delete range.per;
                        delete range.value;
                        dirty = true;
                    }

                    const duration = item?.system?.duration;

                    // Make sure existing data is accurate
                    if (duration?.value?.includes("(D)") && !item?.system?.dismissible) {
                        item.system.dismissible = true;
                        dirty = true;
                    }

                    let durationRegex = duration?.value?.match(/^(\d+) (round|minute|hour|day)[s]?(\/)?(\d*)? ?(level[s]?)?/);
                    let seeText = duration?.value?.includes("see text");
                    if (durationRegex && !seeText) {
                        const [whole,
                            amount,
                            unit,
                            slash,
                            scaling,
                            level] = durationRegex;
                        let formula = "";
                        if (slash) {
                            formula = amount >  1 ? `@details.cl.value*${amount}` : `@details.cl.value`;
                            if (scaling > 0) formula = `floor(${formula}/${scaling})`;
                        } else {
                            formula = amount;
                        }
                        const classMatch = duration?.value?.match(/per (biohacker|envoy|evolutionist|mechanic|mystic|nanocyte|operative|precog|solarian|soldier|technomancer|vanguard|witchwarper|character) level/i);
                        if (classMatch?.[1] && classMatch[1] !== "character") {
                            formula = `${formula}*@classes.${classMatch[1].toLowerCase()}.levels`;
                        } else if (classMatch?.[1]) {
                            formula = `${formula}*@details.level.value`;
                        }
                        duration.value = formula;
                        duration.units = unit;
                        dirty = true;
                    }

                    if (duration?.value === "instantaneous") {
                        duration.units = "instantaneous";
                        duration.value = "";
                        dirty = true;
                    }

                    const area = item?.system.area;
                    if (area?.shape === "shapable") {
                        area.shape = "cube";
                        area.shapable = true;
                        dirty = true;
                    }

                }

                if (dirty) {
                    const output = JSON.stringify(item, null, 2);

                    fs.writeFileSync(`${path}/${file}`, output);
                    console.log(`Migrated ${item.name}`);
                }

            }
        });

    }
} catch (err) {
    console.log(err);
}
