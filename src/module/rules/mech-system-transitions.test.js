import { describe, expect, it } from "vitest";
import {
    auxiliarySelection,
    auxiliaryToDisable,
    chanceFailed,
    cockpitDamage,
    cockpitSaveDC,
    cockpitVictimCount,
    powerCoreLoss
} from "./mech-system-transitions.js";

describe("powerCoreLoss", () => {
    it("costs Power Points when the core first malfunctions", () => {
        expect(powerCoreLoss("malfunctioning")).toBe("1d4");
    });

    it("costs Power Points again when the core becomes inoperable", () => {
        expect(powerCoreLoss("inoperable")).toBe("1d4");
    });

    it("costs nothing for a core still working", () => {
        expect(powerCoreLoss("nominal")).toBeNull();
    });
});

describe("cockpitVictimCount", () => {
    it("hits half the operators, rounded up, when the cockpit malfunctions", () => {
        expect(cockpitVictimCount(3, "malfunctioning")).toBe(2);
    });

    it("rounds up from an even crew too", () => {
        expect(cockpitVictimCount(4, "malfunctioning")).toBe(2);
    });

    it("hits every operator when the cockpit is inoperable", () => {
        expect(cockpitVictimCount(3, "inoperable")).toBe(3);
    });

    it("hits nobody when the cockpit is working", () => {
        expect(cockpitVictimCount(3, "nominal")).toBe(0);
    });

    it("hits nobody in an empty cockpit", () => {
        expect(cockpitVictimCount(0, "inoperable")).toBe(0);
    });
});

describe("cockpit damage and save", () => {
    it("rolls a die per tier", () => {
        expect(cockpitDamage(4)).toBe("4d8");
    });

    it("rolls one die for a tier 1 mech", () => {
        expect(cockpitDamage(1)).toBe("1d8");
    });

    it("still rolls a die for a mech with no tier recorded", () => {
        expect(cockpitDamage(0)).toBe("1d8");
    });

    it("sets the save at 15 plus half the tier", () => {
        expect(cockpitSaveDC(6)).toBe(18);
    });

    it("rounds the half tier down", () => {
        expect(cockpitSaveDC(5)).toBe(17);
    });
});

describe("auxiliarySelection", () => {
    it("sizes the die to the systems on offer", () => {
        expect(auxiliarySelection(3)).toBe("1d3");
    });

    it("still rolls a die for a mech carrying one system", () => {
        expect(auxiliarySelection(1)).toBe("1d1");
    });

    it("offers no roll when the mech carries no auxiliary systems", () => {
        expect(auxiliarySelection(0)).toBeNull();
    });
});

describe("auxiliaryToDisable", () => {
    const systems = [{ id: "a" }, { id: "b" }, { id: "c" }];

    it("takes the first system on a 1", () => {
        expect(auxiliaryToDisable(systems, 1)).toEqual({ id: "a" });
    });

    it("takes the last system on the top face", () => {
        expect(auxiliaryToDisable(systems, 3)).toEqual({ id: "c" });
    });

    it("takes nothing for a roll off the end of the list", () => {
        expect(auxiliaryToDisable(systems, 4)).toBeNull();
    });

    it("takes nothing from an empty list", () => {
        expect(auxiliaryToDisable([], 1)).toBeNull();
    });
});

describe("chanceFailed", () => {
    it("fails on a roll at the chance", () => {
        expect(chanceFailed(25, 25)).toBe(true);
    });

    it("succeeds on the roll just past it", () => {
        expect(chanceFailed(26, 25)).toBe(false);
    });

    it("fails on the low half against a 50% chance", () => {
        expect(chanceFailed(50, 50)).toBe(true);
        expect(chanceFailed(51, 50)).toBe(false);
    });

    it("never fails when there is no chance to", () => {
        expect(chanceFailed(1, 0)).toBe(false);
    });
});
