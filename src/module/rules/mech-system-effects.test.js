import { describe, expect, it } from "vitest";
import {
    auxiliaryFailureChance,
    effectiveStatus,
    effectiveSystems,
    hardnessRate,
    movementRate,
    regenerationRate
} from "./mech-system-effects.js";

describe("effectiveStatus", () => {
    it("leaves a component with no override as it stands", () => {
        expect(effectiveStatus("malfunctioning", null)).toBe("malfunctioning");
    });

    it("clears a malfunctioning component the mech paid 2 PP to ignore", () => {
        expect(effectiveStatus("malfunctioning", "ignored")).toBe("nominal");
    });

    it("treats an inoperable component the mech paid 4 PP for as malfunctioning", () => {
        expect(effectiveStatus("inoperable", "downgraded")).toBe("malfunctioning");
    });

    it("does not let the cheaper action clear an inoperable component", () => {
        expect(effectiveStatus("inoperable", "ignored")).toBe("malfunctioning");
    });

    it("cannot improve a component that is already working", () => {
        expect(effectiveStatus("nominal", "downgraded")).toBe("nominal");
    });
});

describe("effectiveSystems", () => {
    it("applies each override to its own component and no other", () => {
        const systems = {
            upperLimbs: { value: "malfunctioning" },
            powerCore: { value: "inoperable" },
            frame: { value: "malfunctioning" }
        };

        expect(effectiveSystems(systems, { upperLimbs: "ignored" })).toEqual({
            upperLimbs: "nominal",
            powerCore: "inoperable",
            frame: "malfunctioning"
        });
    });

    it("reads a mech with no overrides at all", () => {
        expect(effectiveSystems({ frame: { value: "inoperable" } })).toEqual({ frame: "inoperable" });
    });
});

describe("rates", () => {
    it("leaves a working power core regenerating in full", () => {
        expect(regenerationRate("nominal")).toBe(1);
    });

    it("halves regeneration for a malfunctioning power core", () => {
        expect(regenerationRate("malfunctioning")).toBe(0.5);
    });

    it("stops regeneration for an inoperable power core", () => {
        expect(regenerationRate("inoperable")).toBe(0);
    });

    it("halves movement for malfunctioning lower limbs and stops it when they are inoperable", () => {
        expect(movementRate("nominal")).toBe(1);
        expect(movementRate("malfunctioning")).toBe(0.5);
        expect(movementRate("inoperable")).toBe(0);
    });

    it("halves hardness for a malfunctioning frame and removes it when the frame is inoperable", () => {
        expect(hardnessRate("nominal")).toBe(1);
        expect(hardnessRate("malfunctioning")).toBe(0.5);
        expect(hardnessRate("inoperable")).toBe(0);
    });
});

describe("auxiliaryFailureChance", () => {
    it("never fails a working auxiliary system", () => {
        expect(auxiliaryFailureChance("nominal")).toBe(0);
    });

    it("fails a malfunctioning auxiliary system one time in four", () => {
        expect(auxiliaryFailureChance("malfunctioning")).toBe(25);
    });

    it("fails an inoperable auxiliary system half the time", () => {
        expect(auxiliaryFailureChance("inoperable")).toBe(50);
    });
});
