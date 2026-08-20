import { describe, expect, it } from "vitest";
import { mechShieldRefills } from "./mech-shield-reset.js";

let nextId = 0;

/** An actor as the collector reads it: a type, a uuid and a shield pool. */
function mech({ value = 0, max = 10, uuid = `Actor.mech${nextId++}` } = {}) {
    return { type: "mech", uuid, system: { attributes: { sp: { value, max } } } };
}

describe("mechShieldRefills", () => {
    it("refills a mech that spent shields, up to its maximum", () => {
        const damaged = mech({ value: 3, max: 12 });

        expect(mechShieldRefills([damaged])).toEqual([{ actor: damaged, sp: 12 }]);
    });

    it("leaves a mech already at full alone", () => {
        expect(mechShieldRefills([mech({ value: 12, max: 12 })])).toEqual([]);
    });

    it("ignores an actor that is not a mech", () => {
        // A character carries sp too, and combat start must not refill it -
        // Stamina is spent by Resolve on a rest, not handed back each encounter.
        const character = { type: "character", uuid: "Actor.pc", system: { attributes: { sp: { value: 0, max: 20 } } } };

        expect(mechShieldRefills([character])).toEqual([]);
    });

    it("ignores a mech that has no shield generator at all", () => {
        expect(mechShieldRefills([mech({ value: 0, max: 0 })])).toEqual([]);
    });

    it("ignores a mech whose shield data is missing rather than reading through it", () => {
        const noShields = { type: "mech", uuid: "Actor.bare", system: { attributes: {} } };

        expect(mechShieldRefills([noShields])).toEqual([]);
    });

    it("refills each mech that needs it and skips the ones that do not", () => {
        const damaged = mech({ value: 1, max: 10 });
        const full = mech({ value: 10, max: 10 });
        const alsoDamaged = mech({ value: 4, max: 8 });

        expect(mechShieldRefills([damaged, full, alsoDamaged]))
            .toEqual([{ actor: damaged, sp: 10 }, { actor: alsoDamaged, sp: 8 }]);
    });

    it("refills two unlinked tokens of the same mech separately", () => {
        // Each unlinked token has its own synthetic actor, so both need updating.
        const first = { type: "mech", uuid: "Scene.s1.Token.t1.Actor.mech", system: { attributes: { sp: { value: 0, max: 6 } } } };
        const second = { type: "mech", uuid: "Scene.s1.Token.t2.Actor.mech", system: { attributes: { sp: { value: 2, max: 6 } } } };

        expect(mechShieldRefills([first, second]).map(refill => refill.actor)).toEqual([first, second]);
    });

    it("refills a linked mech once when it holds two places in the tracker", () => {
        const twice = mech({ value: 0, max: 6, uuid: "Actor.linked" });

        expect(mechShieldRefills([twice, twice])).toHaveLength(1);
    });

    it("returns nothing when the combat has no actors to read", () => {
        expect(mechShieldRefills(undefined)).toEqual([]);
    });
});
