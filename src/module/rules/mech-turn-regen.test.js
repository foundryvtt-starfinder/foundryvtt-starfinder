import { describe, expect, it } from "vitest";
import { mechTurnRegen } from "./mech-turn-regen.js";

/** A mech's pools, as the turn handler reads them. */
function mech({ pp = { value: 3, max: 5, regen: 1 }, sp = { value: 4, max: 10 }, tier = 5, round = 2 } = {}) {
    return { pp, sp, tier, round };
}

describe("Power Point regeneration", () => {
    it("regenerates on a turn after the first round", () => {
        expect(mechTurnRegen(mech()).pp).toBe(4);
    });

    it("holds regeneration back through the first round", () => {
        // Combat start sets a mech to its initial Power Points, and round 1 is
        // what that allotment is for.
        expect(mechTurnRegen(mech({ round: 1 })).pp).toBeNull();
    });

    it("does not carry Power Points past the maximum", () => {
        expect(mechTurnRegen(mech({ pp: { value: 4, max: 5, regen: 3 } })).pp).toBe(5);
    });

    it("changes nothing for a mech already at full Power Points", () => {
        expect(mechTurnRegen(mech({ pp: { value: 5, max: 5, regen: 1 } })).pp).toBeNull();
    });

    it("changes nothing for a mech that regenerates none", () => {
        expect(mechTurnRegen(mech({ pp: { value: 1, max: 5, regen: 0 } })).pp).toBeNull();
    });
});

describe("Shield Point regeneration", () => {
    it("regenerates the mech's tier", () => {
        expect(mechTurnRegen(mech({ sp: { value: 4, max: 20 }, tier: 5 })).sp).toBe(9);
    });

    it("regenerates during the first round, unlike Power Points", () => {
        // A mech can be shot before its own turn comes around, so there is damage
        // for the first round's regeneration to answer.
        expect(mechTurnRegen(mech({ sp: { value: 4, max: 20 }, round: 1 })).sp).toBe(9);
    });

    it("does not carry Shield Points past the maximum", () => {
        expect(mechTurnRegen(mech({ sp: { value: 18, max: 20 }, tier: 5 })).sp).toBe(20);
    });

    it("changes nothing for a mech already at full Shield Points", () => {
        expect(mechTurnRegen(mech({ sp: { value: 20, max: 20 } })).sp).toBeNull();
    });

    it("changes nothing for a tier that recovers no shields", () => {
        expect(mechTurnRegen(mech({ sp: { value: 1, max: 20 }, tier: 0 })).sp).toBeNull();
    });
});

describe("mechTurnRegen", () => {
    it("reports both pools at once", () => {
        expect(mechTurnRegen(mech({ pp: { value: 1, max: 5, regen: 2 }, sp: { value: 1, max: 20 }, tier: 3 })))
            .toEqual({ pp: 3, sp: 4 });
    });

    it("changes nothing when there is no mech to read", () => {
        expect(mechTurnRegen()).toEqual({ pp: null, sp: null });
    });
});
