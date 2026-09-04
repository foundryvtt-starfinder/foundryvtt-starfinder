import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The rules modules decide; the Foundry layer rolls. A rules module reaching for
 * Roll would put a random outcome behind the player's back, which is what the
 * mech failure cards exist to avoid - and it would make the module untestable
 * without Foundry loaded.
 */
const RULES_DIR = dirname(fileURLToPath(import.meta.url));

/** Foundry globals a pure rules module has no business touching. */
const FORBIDDEN = [
    /\bnew Roll\b/,
    /\bnew foundry\.dice\.Roll\b/,
    /\bRoll\.create\b/,
    /\bRoll\.simulate\b/,
    /\bMath\.random\b/,
    /\bgame\./,
    /\bCONFIG\./,
    /\bChatMessage\b/,
    /\bui\.notifications\b/
];

/**
 * A module's code with its comments taken out.
 *
 * A doc comment naming CONFIG.SFRPG.mechPPActions is documentation of where a
 * value comes from, not a dependency on it, and several of these modules
 * rightly do that. Only what runs is checked.
 *
 * @param {string} source The module's text.
 * @returns {string} The same text with block and line comments removed.
 */
function code(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
}

function ruleModules() {
    return readdirSync(RULES_DIR)
        .filter(name => name.endsWith(".js") && !name.endsWith(".test.js"));
}

describe("rules modules", () => {
    it("has rules modules to check", () => {
        expect(ruleModules().length).toBeGreaterThan(0);
    });

    for (const name of ruleModules()) {
        it(`${name} decides without rolling or reaching into Foundry`, () => {
            const source = code(readFileSync(join(RULES_DIR, name), "utf8"));
            const found = FORBIDDEN.filter(pattern => pattern.test(source)).map(String);

            expect(found).toEqual([]);
        });
    }
});
