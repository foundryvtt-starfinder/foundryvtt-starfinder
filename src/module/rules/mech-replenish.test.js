import { describe, expect, it } from "vitest";
import { replenishFormula, replenishedShieldPoints } from "./mech-replenish.js";

describe("replenishFormula", () => {
    it("rolls one die below the first tier step", () => {
        expect(replenishFormula(0)).toBe("1d8");
        expect(replenishFormula(4)).toBe("1d8");
    });

    it("adds a die at the tier the ability names", () => {
        expect(replenishFormula(5)).toBe("2d8");
        expect(replenishFormula(9)).toBe("2d8");
    });

    it("keeps adding a die every step after that", () => {
        expect(replenishFormula(10)).toBe("3d8");
        expect(replenishFormula(20)).toBe("5d8");
    });

    it("reads the dice from the action rather than assuming them", () => {
        expect(replenishFormula(6, { die: 6, base: 2, perTiers: 3 })).toBe("4d6");
    });

    it("rolls the base dice for a mech with no tier to read", () => {
        expect(replenishFormula(undefined)).toBe("1d8");
    });
});

describe("replenishedShieldPoints", () => {
    it("adds the roll to a mech with room for all of it", () => {
        expect(replenishedShieldPoints({ value: 4, max: 20 }, 7)).toEqual({ value: 11, gained: 7 });
    });

    it("restores only the difference when the roll would carry it past the maximum", () => {
        expect(replenishedShieldPoints({ value: 17, max: 20 }, 7)).toEqual({ value: 20, gained: 3 });
    });

    it("gains nothing for a mech already at its maximum", () => {
        expect(replenishedShieldPoints({ value: 20, max: 20 }, 7)).toEqual({ value: 20, gained: 0 });
    });

    it("leaves a mech somehow above its maximum where it is", () => {
        expect(replenishedShieldPoints({ value: 24, max: 20 }, 7)).toEqual({ value: 24, gained: 0 });
    });
});
