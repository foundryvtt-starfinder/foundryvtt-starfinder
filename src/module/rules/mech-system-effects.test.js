import { describe, expect, it } from "vitest";
import {
    SLOT_COMPONENT,
    auxiliaryFailureChance,
    effectiveStatus,
    effectiveSystems,
    hardnessRate,
    maneuverPenalty,
    movementRate,
    overcomeActions,
    regenerationRate,
    weaponPenalties,
    weaponUsable
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

describe("weaponPenalties", () => {
    it("penalizes an upper-limb weapon when the upper limbs are malfunctioning", () => {
        expect(weaponPenalties({ upperLimbs: "malfunctioning" }, "upperLimb"))
            .toEqual([{ component: "upperLimbs", value: -2 }]);
    });

    it("leaves a frame weapon alone when it is the limbs that are hurt", () => {
        expect(weaponPenalties({ upperLimbs: "malfunctioning" }, "frame")).toEqual([]);
    });

    it("penalizes a lower-limb weapon when the lower limbs are malfunctioning", () => {
        expect(weaponPenalties({ lowerLimbs: "malfunctioning" }, "lowerLimb"))
            .toEqual([{ component: "lowerLimbs", value: -2 }]);
    });

    it("penalizes a frame weapon when the frame is malfunctioning", () => {
        expect(weaponPenalties({ frame: "malfunctioning" }, "frame"))
            .toEqual([{ component: "frame", value: -2 }]);
    });

    it("gives no penalty for an inoperable mount, which cannot fire at all", () => {
        expect(weaponPenalties({ frame: "inoperable" }, "frame")).toEqual([]);
    });

    it("gives no penalty for a weapon in the locker, which no component mounts", () => {
        expect(weaponPenalties({ frame: "malfunctioning" }, "locker")).toEqual([]);
    });

    it("maps every mount slot to the component that carries it", () => {
        expect(SLOT_COMPONENT).toEqual({
            upperLimb: "upperLimbs",
            lowerLimb: "lowerLimbs",
            frame: "frame"
        });
    });
});

describe("weaponUsable", () => {
    it("lets a weapon on a working mount fire", () => {
        expect(weaponUsable({ frame: "nominal" }, "frame")).toBe(true);
    });

    it("lets a weapon on a malfunctioning mount fire at a penalty", () => {
        expect(weaponUsable({ frame: "malfunctioning" }, "frame")).toBe(true);
    });

    it("stops a weapon on an inoperable mount firing", () => {
        expect(weaponUsable({ frame: "inoperable" }, "frame")).toBe(false);
    });

    it("lets a weapon in the locker fire whatever the mech's state", () => {
        expect(weaponUsable({ frame: "inoperable" }, "locker")).toBe(true);
    });
});

describe("maneuverPenalty", () => {
    it("penalizes combat maneuvers when the upper limbs are malfunctioning", () => {
        expect(maneuverPenalty({ upperLimbs: "malfunctioning" })).toBe(-2);
    });

    it("does not penalize maneuvers for damage elsewhere", () => {
        expect(maneuverPenalty({ frame: "inoperable" })).toBe(0);
    });
});

describe("overcomeActions", () => {
    it("offers nothing to a mech with no failed component", () => {
        expect(overcomeActions({ frame: "nominal", powerCore: "nominal" })).toEqual([]);
    });

    it("offers the 2 PP action for a malfunctioning component", () => {
        expect(overcomeActions({ upperLimbs: "malfunctioning" })).toEqual([
            {
                component: "upperLimbs",
                status: "malfunctioning",
                ppCost: 2,
                override: "ignored"
            }
        ]);
    });

    it("offers the 4 PP action for an inoperable component", () => {
        expect(overcomeActions({ powerCore: "inoperable" })).toEqual([
            {
                component: "powerCore",
                status: "inoperable",
                ppCost: 4,
                override: "downgraded"
            }
        ]);
    });

    it("offers one action for each failed component", () => {
        const actions = overcomeActions({
            upperLimbs: "malfunctioning",
            frame: "nominal",
            powerCore: "inoperable"
        });

        expect(actions.map(action => action.component)).toEqual(["upperLimbs", "powerCore"]);
    });

    it("stops offering a component the mech has already bought an override for", () => {
        const actions = overcomeActions(
            { powerCore: "malfunctioning", cockpit: "inoperable" },
            { powerCore: "downgraded" }
        );

        expect(actions.map(action => action.component)).toEqual(["cockpit"]);
    });
});
