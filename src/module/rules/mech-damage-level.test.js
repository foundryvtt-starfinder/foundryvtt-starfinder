import { describe, expect, test } from "vitest";
import { applyPerDieBonus, resolveDamageLevel } from "./mech-damage-level.js";

describe("resolveDamageLevel", () => {
    test("returns the base level unchanged when there is no override", () => {
        expect(resolveDamageLevel("medium", null)).toEqual({ level: "medium", bonusPerDie: 0 });
    });

    test("steps low up to medium", () => {
        expect(resolveDamageLevel("low", { steps: 1 })).toEqual({ level: "medium", bonusPerDie: 0 });
    });

    test("steps medium up to high", () => {
        expect(resolveDamageLevel("medium", { steps: 1 })).toEqual({ level: "high", bonusPerDie: 0 });
    });

    test("steps high up to extreme", () => {
        expect(resolveDamageLevel("high", { steps: 1 })).toEqual({ level: "extreme", bonusPerDie: 0 });
    });

    test("stepping past extreme stays extreme and grants a per-die bonus instead", () => {
        expect(resolveDamageLevel("extreme", { steps: 1 })).toEqual({ level: "extreme", bonusPerDie: 1 });
    });

    test("a two-step override from high clamps at extreme and grants one per-die bonus", () => {
        expect(resolveDamageLevel("high", { steps: 2 })).toEqual({ level: "extreme", bonusPerDie: 1 });
    });

    test("an absolute level override ignores the base level", () => {
        expect(resolveDamageLevel("medium", { level: "extreme" })).toEqual({ level: "extreme", bonusPerDie: 0 });
    });

    test("an absolute override below the base level still applies", () => {
        expect(resolveDamageLevel("high", { level: "medium" })).toEqual({ level: "medium", bonusPerDie: 0 });
    });
});

describe("applyPerDieBonus", () => {
    test("returns the formula untouched when there is no bonus", () => {
        expect(applyPerDieBonus("6d6", 0)).toBe("6d6");
    });

    test("adds the die count as a flat bonus", () => {
        expect(applyPerDieBonus("10d12", 1)).toBe("10d12 + 10");
    });

    test("scales the flat bonus by the per-die amount", () => {
        expect(applyPerDieBonus("5d10", 2)).toBe("5d10 + 10");
    });

    test("handles a single die", () => {
        expect(applyPerDieBonus("1d12", 1)).toBe("1d12 + 1");
    });

    test("leaves a formula it cannot parse alone", () => {
        expect(applyPerDieBonus("", 1)).toBe("");
    });
});
