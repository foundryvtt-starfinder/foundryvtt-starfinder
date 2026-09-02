import { describe, expect, it } from "vitest";
import { mechTurnRegen, shouldRegenOnTurnEnd } from "./mech-turn-regen.js";

/** A mech's pools, as the turn handler reads them. */
function mech({ pp = { value: 3, max: 5, regen: 1 }, sp = { value: 4, max: 10 }, tier = 5 } = {}) {
    return { pp, sp, tier };
}

/** A turn ending with a forward step, which is when regeneration is due. */
function turnEnd({ direction = 1, isNewTurn = true, round = 2, lastRegenRound = null } = {}) {
    return { direction, isNewTurn, round, lastRegenRound };
}

describe("Power Point regeneration", () => {
    it("regenerates the mech's Power Point regen", () => {
        expect(mechTurnRegen(mech()).pp).toBe(4);
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

describe("shouldRegenOnTurnEnd", () => {
    it("regenerates when a turn ends", () => {
        expect(shouldRegenOnTurnEnd(turnEnd())).toBe(true);
    });

    it("regenerates in the first round", () => {
        expect(shouldRegenOnTurnEnd(turnEnd({ round: 1 }))).toBe(true);
    });

    it("skips a round this combatant has already regenerated in", () => {
        expect(shouldRegenOnTurnEnd(turnEnd({ round: 4, lastRegenRound: 4 }))).toBe(false);
    });

    it("regenerates again once the combat reaches a later round", () => {
        expect(shouldRegenOnTurnEnd(turnEnd({ round: 5, lastRegenRound: 4 }))).toBe(true);
    });

    it("skips a step backwards through the initiative order", () => {
        expect(shouldRegenOnTurnEnd(turnEnd({ direction: -1 }))).toBe(false);
    });

    it("skips an update that ends no turn", () => {
        expect(shouldRegenOnTurnEnd(turnEnd({ isNewTurn: false }))).toBe(false);
    });

    it("skips the start of a combat, which has no direction to move in", () => {
        expect(shouldRegenOnTurnEnd({ isNewTurn: true, round: 1 })).toBe(false);
    });
});
