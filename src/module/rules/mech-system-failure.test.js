import { describe, expect, it } from "vitest";
import { FAILURE_THRESHOLDS, damageState, failuresTriggered } from "./mech-system-failure.js";

/** A mech's Hit Points as the damage hook reads them. */
function hp({ value = 100, previousValue = 120, max = 120, fired = [] } = {}) {
    return { value, previousValue, max, fired };
}

describe("failuresTriggered", () => {
    it("fires the two-thirds failure when damage carries the mech to exactly two-thirds", () => {
        expect(failuresTriggered(hp({ value: 80, previousValue: 81, max: 120 }))).toEqual(["twoThirds"]);
    });

    it("fires nothing while the mech is above two-thirds", () => {
        expect(failuresTriggered(hp({ value: 81, previousValue: 120, max: 120 }))).toEqual([]);
    });

    it("fires both when one hit carries the mech past both thresholds", () => {
        expect(failuresTriggered(hp({ value: 10, previousValue: 120, max: 120 }))).toEqual(["twoThirds", "oneThird"]);
    });

    it("does not fire a threshold already recorded", () => {
        expect(failuresTriggered(hp({ value: 70, previousValue: 80, max: 120, fired: ["twoThirds"] }))).toEqual([]);
    });

    it("fires only the threshold not yet recorded", () => {
        expect(failuresTriggered(hp({ value: 30, previousValue: 80, max: 120, fired: ["twoThirds"] }))).toEqual(["oneThird"]);
    });

    it("fires nothing when the mech is healed rather than damaged", () => {
        expect(failuresTriggered(hp({ value: 60, previousValue: 10, max: 120 }))).toEqual([]);
    });

    it("fires nothing when the Hit Points did not change", () => {
        expect(failuresTriggered(hp({ value: 60, previousValue: 60, max: 120 }))).toEqual([]);
    });

    it("fires nothing for a mech with no maximum Hit Points to measure against", () => {
        expect(failuresTriggered(hp({ value: 0, previousValue: 5, max: 0 }))).toEqual([]);
    });

    it("names both thresholds it can ever fire", () => {
        expect(FAILURE_THRESHOLDS.map(threshold => threshold.id)).toEqual(["twoThirds", "oneThird"]);
    });
});

describe("damageState", () => {
    it("leaves a damaged but standing mech intact", () => {
        expect(damageState({ value: 1, max: 120, overkill: 0 })).toBe("intact");
    });

    it("wrecks a mech at zero Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 0 })).toBe("wrecked");
    });

    it("leaves a wrecked mech wrecked while the damage has not doubled its Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 120 })).toBe("wrecked");
    });

    it("destroys a mech once the damage exceeds twice its Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 121 })).toBe("destroyed");
    });

    it("counts the damage already dealt toward destruction, not the overkill alone", () => {
        expect(damageState({ value: 0, max: 120, overkill: 100 })).toBe("wrecked");
        expect(damageState({ value: 0, max: 120, overkill: 130 })).toBe("destroyed");
    });
});
