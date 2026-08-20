import { describe, expect, test } from "vitest";
import { actionAttackBonus, armedOverrideBanners } from "./mech-attack-bonus.js";

describe("actionAttackBonus", () => {
    test("reads the formula an action declares", () => {
        expect(actionAttackBonus({ armsAttackBonus: { formula: "1d4" } })).toEqual({ formula: "1d4" });
    });

    test("accepts dice plus a flat bonus", () => {
        expect(actionAttackBonus({ armsAttackBonus: { formula: "2d6 + 3" } })).toEqual({ formula: "2d6 + 3" });
    });

    test("accepts a flat bonus on its own", () => {
        expect(actionAttackBonus({ armsAttackBonus: { formula: "2" } })).toEqual({ formula: "2" });
    });

    test("trims a formula written with surrounding spaces", () => {
        expect(actionAttackBonus({ armsAttackBonus: { formula: "  1d4  " } })).toEqual({ formula: "1d4" });
    });

    test("refuses a formula that reads an actor's data rather than rolling dice", () => {
        // The bonus is rolled from a chat card with no roll data behind it, so a
        // formula naming @mech.tier would evaluate to nothing.
        expect(actionAttackBonus({ armsAttackBonus: { formula: "@mech.details.tier" } })).toBeNull();
    });

    test("refuses a formula that is not a formula at all", () => {
        expect(actionAttackBonus({ armsAttackBonus: { formula: "one die" } })).toBeNull();
    });

    test("returns null for an action declaring no bonus", () => {
        expect(actionAttackBonus({ ppCost: 1 })).toBeNull();
    });

    test("returns null rather than reading through a missing action", () => {
        expect(actionAttackBonus(undefined)).toBeNull();
    });
});

describe("armedOverrideBanners", () => {
    test("returns nothing when neither override is armed", () => {
        expect(armedOverrideBanners({})).toEqual([]);
    });

    test("reports an armed damage level override", () => {
        expect(armedOverrideBanners({ damageLevelOverride: { source: "Devastating Hit", ppSpent: 3 } }))
            .toEqual([{ kind: "damage", source: "Devastating Hit", ppSpent: 3, value: null }]);
    });

    test("reports an armed attack bonus with the value that was rolled", () => {
        expect(armedOverrideBanners({ attackBonusOverride: { source: "Aim", ppSpent: 1, value: 3 } }))
            .toEqual([{ kind: "attack", source: "Aim", ppSpent: 1, value: 3 }]);
    });

    test("reports both when both are armed, damage first", () => {
        const banners = armedOverrideBanners({
            damageLevelOverride: { source: "Devastating Hit", ppSpent: 3 },
            attackBonusOverride: { source: "Aim", ppSpent: 1, value: 2 }
        });

        expect(banners.map(banner => banner.kind)).toEqual(["damage", "attack"]);
    });

    test("reports a free override as costing nothing rather than as undefined", () => {
        expect(armedOverrideBanners({ damageLevelOverride: { source: "Charged Barrel" } })[0].ppSpent).toBe(0);
    });

    test("returns nothing rather than reading through missing flags", () => {
        expect(armedOverrideBanners()).toEqual([]);
    });
});
