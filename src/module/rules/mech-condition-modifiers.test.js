import { describe, expect, it } from "vitest";
import {
    acceptedEffectTypes,
    collectMechDefenseModifiers,
    collectMechRollModifiers,
    conditionsFromItems,
    MECH_CONDITION_SCOPE,
    worstAffectedOperator
} from "./mech-condition-modifiers.js";

/** A condition as the collector takes it: a slug and the modifiers it carries. */
function condition(slug, ...modifiers) {
    return { slug, modifiers };
}

/** A modifier in the shape the condition items store. */
function mod(effectType, modifier, extra = {}) {
    return { effectType, modifier, modifierType: "constant", type: "untyped", enabled: true, ...extra };
}

/** Slugs of the modifiers a collection returned, in order. */
function slugs(collected) {
    return collected.map(entry => entry.slug);
}

describe("acceptedEffectTypes", () => {
    it("accepts the melee-specific effect type for a melee weapon and not the ranged one", () => {
        const accepted = acceptedEffectTypes("attack", "melee");
        expect(accepted).toContain("melee-attacks");
        expect(accepted).not.toContain("ranged-attacks");
    });

    it("accepts the ranged-specific effect type for a ranged weapon", () => {
        expect(acceptedEffectTypes("attack", "ranged")).toContain("ranged-attacks");
    });

    it("separates damage effect types from attack effect types", () => {
        const damage = acceptedEffectTypes("damage", "melee");
        expect(damage).toContain("melee-damage");
        expect(damage).not.toContain("melee-attacks");
    });
});

describe("collectMechRollModifiers", () => {
    it("keeps a condition the table routes to the mech", () => {
        const collected = collectMechRollModifiers({
            mechConditions: [condition("off-target", mod("all-attacks", -2))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(slugs(collected)).toEqual(["off-target"]);
        expect(collected[0].source).toBe("mech");
    });

    it("drops a mech's own condition that the table routes only to operators", () => {
        // A mech has no morale to shake, so shaken on the mech itself is inert.
        const collected = collectMechRollModifiers({
            mechConditions: [condition("shaken", mod("all-attacks", -2))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(collected).toEqual([]);
    });

    it("keeps that same condition when it is the operator carrying it", () => {
        const collected = collectMechRollModifiers({
            operatorConditions: [condition("shaken", mod("all-attacks", -2))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(slugs(collected)).toEqual(["shaken"]);
        expect(collected[0].source).toBe("operator");
    });

    it("drops an operator's condition that the table routes only to the mech", () => {
        const collected = collectMechRollModifiers({
            operatorConditions: [condition("off-kilter", mod("all-attacks", -2))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(collected).toEqual([]);
    });

    it("applies a melee-only condition to a melee weapon and not to a ranged one", () => {
        const prone = [condition("prone", mod("melee-attacks", -4, { modifierType: "formula" }))];

        expect(slugs(collectMechRollModifiers({
            mechConditions: prone, weaponType: "melee", kind: "attack"
        }))).toEqual(["prone"]);

        expect(collectMechRollModifiers({
            mechConditions: prone, weaponType: "ranged", kind: "attack"
        })).toEqual([]);
    });

    it("leaves damage modifiers out of an attack roll", () => {
        const collected = collectMechRollModifiers({
            operatorConditions: [condition("sickened", mod("melee-damage", -2))],
            weaponType: "melee",
            kind: "attack"
        });

        expect(collected).toEqual([]);
    });

    it("collects the damage half of a condition that penalizes both", () => {
        const sickened = [condition("sickened", mod("all-attacks", -2), mod("melee-damage", -2))];

        const collected = collectMechRollModifiers({
            operatorConditions: sickened, weaponType: "melee", kind: "damage"
        });

        expect(collected).toHaveLength(1);
        expect(collected[0].modifier.effectType).toBe("melee-damage");
    });

    it("ignores a disabled modifier", () => {
        const collected = collectMechRollModifiers({
            mechConditions: [condition("off-target", mod("all-attacks", -2, { enabled: false }))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(collected).toEqual([]);
    });

    it("returns both sides when the mech and its operator are each affected", () => {
        const collected = collectMechRollModifiers({
            mechConditions: [condition("off-target", mod("all-attacks", -2))],
            operatorConditions: [condition("shaken", mod("all-attacks", -2))],
            weaponType: "ranged",
            kind: "attack"
        });

        // Untyped penalties stack, so the same condition on both sides is counted
        // twice by design - the stacking rules are applied downstream, not here.
        expect(collected.map(entry => entry.source)).toEqual(["mech", "operator"]);
    });

    it("ignores an effect item that is not a condition the table knows", () => {
        const collected = collectMechRollModifiers({
            mechConditions: [condition("some-homebrew-buff", mod("all-attacks", 4))],
            weaponType: "ranged",
            kind: "attack"
        });

        expect(collected).toEqual([]);
    });
});

describe("worstAffectedOperator", () => {
    const context = { weaponType: "ranged", kind: "attack" };

    it("picks the operator whose conditions cost the most", () => {
        const mild = [condition("fatigued", mod("all-attacks", -1))];
        const severe = [condition("exhausted", mod("all-attacks", -3))];

        expect(worstAffectedOperator([mild, severe], context)).toBe(severe);
        // Order must not decide it.
        expect(worstAffectedOperator([severe, mild], context)).toBe(severe);
    });

    it("ignores an operator whose conditions do not reach this roll", () => {
        const irrelevant = [condition("sickened", mod("melee-damage", -2))];
        const relevant = [condition("fatigued", mod("all-attacks", -1))];

        expect(worstAffectedOperator([irrelevant, relevant], context)).toBe(relevant);
    });

    it("picks an operator carrying a formula condition over one carrying nothing", () => {
        // A negative level is worth a number this cannot weigh before the roll,
        // so it ranks as zero - but it must still beat an unaffected operator.
        const unaffected = [];
        const formula = [condition("negative-level", mod("all-attacks", "-(@resources.NegativeLevels.Number.value)", { modifierType: "formula" }))];

        expect(worstAffectedOperator([unaffected, formula], context)).toBe(formula);
    });

    it("returns nothing when no operator is affected", () => {
        expect(worstAffectedOperator([[], []], context)).toEqual([]);
    });

    it("returns nothing when there are no operators at all", () => {
        expect(worstAffectedOperator(undefined, context)).toEqual([]);
    });
});

describe("MECH_CONDITION_SCOPE", () => {
    it("routes every condition it lists to at least one side", () => {
        // An entry routed to neither side is dead weight that silently does nothing.
        const orphans = Object.entries(MECH_CONDITION_SCOPE)
            .filter(([, scope]) => !scope.mech && !scope.operator)
            .map(([slug]) => slug);

        expect(orphans).toEqual([]);
    });
});

describe("collectMechDefenseModifiers", () => {
    it("applies an AC penalty marked as affecting both to EAC and to KAC", () => {
        const entangled = [condition("entangled", mod("ac", -2, { valueAffected: "both" }))];

        expect(slugs(collectMechDefenseModifiers({ mechConditions: entangled, target: "eac" }))).toEqual(["entangled"]);
        expect(slugs(collectMechDefenseModifiers({ mechConditions: entangled, target: "kac" }))).toEqual(["entangled"]);
    });

    it("keeps an EAC-only penalty out of KAC", () => {
        const eacOnly = [condition("entangled", mod("ac", -2, { valueAffected: "eac" }))];

        expect(collectMechDefenseModifiers({ mechConditions: eacOnly, target: "kac" })).toEqual([]);
    });

    it("applies a Reflex-only penalty to Reflex and not to Fortitude", () => {
        const pinned = [condition("pinned", mod("save", -4, { valueAffected: "reflex" }))];

        expect(slugs(collectMechDefenseModifiers({ mechConditions: pinned, target: "reflex" }))).toEqual(["pinned"]);
        expect(collectMechDefenseModifiers({ mechConditions: pinned, target: "fort" })).toEqual([]);
    });

    it("applies a penalty to every save without it naming one", () => {
        // `saves` carries no valueAffected, so it must not be filtered out by one.
        const frightened = [condition("frightened", mod("saves", -2, { valueAffected: "" }))];
        const routedToMech = [condition("entangled", mod("saves", -2, { valueAffected: "" }))];

        expect(collectMechDefenseModifiers({ mechConditions: frightened, target: "fort" })).toEqual([]);
        expect(slugs(collectMechDefenseModifiers({ mechConditions: routedToMech, target: "fort" }))).toEqual(["entangled"]);
    });

    it("drops a condition the table does not route to the mech", () => {
        // Exhausted lowers a creature's AC. A mech is not a creature.
        const exhausted = [condition("exhausted", mod("ac", -3, { valueAffected: "both" }))];

        expect(collectMechDefenseModifiers({ mechConditions: exhausted, target: "eac" })).toEqual([]);
    });

    it("leaves attack modifiers out of a defense", () => {
        const offTarget = [condition("off-target", mod("all-attacks", -2))];

        expect(collectMechDefenseModifiers({ mechConditions: offTarget, target: "eac" })).toEqual([]);
    });

    it("applies a Will-only penalty to Will and not to Fortitude", () => {
        // A mech's Will save comes from its operators, but a condition on the mech
        // still adjusts the value it ends up rolling.
        const willOnly = [condition("flat-footed", mod("save", -2, { valueAffected: "will" }))];

        expect(slugs(collectMechDefenseModifiers({ mechConditions: willOnly, target: "will" }))).toEqual(["flat-footed"]);
        expect(collectMechDefenseModifiers({ mechConditions: willOnly, target: "fort" })).toEqual([]);
    });

    it("returns nothing for a target that is not one of the mech's defenses", () => {
        const entangled = [condition("entangled", mod("ac", -2, { valueAffected: "both" }))];

        expect(collectMechDefenseModifiers({ mechConditions: entangled, target: "cmd" })).toEqual([]);
    });
});

describe("conditionsFromItems", () => {
    const effect = (slug, ...modifiers) => ({ type: "effect", system: { slug, modifiers } });

    it("reads a condition the routing table knows", () => {
        const read = conditionsFromItems([effect("off-target", mod("all-attacks", -2))]);

        expect(read).toEqual([{ slug: "off-target", modifiers: [mod("all-attacks", -2)] }]);
    });

    it("ignores an effect item that is not a routed condition", () => {
        expect(conditionsFromItems([effect("some-homebrew-buff", mod("all-attacks", 4))])).toEqual([]);
    });

    it("ignores an item that is not an effect", () => {
        const weapon = { type: "weapon", system: { slug: "off-target", modifiers: [mod("all-attacks", -2)] } };

        expect(conditionsFromItems([weapon])).toEqual([]);
    });

    it("returns nothing when the actor has no items to read", () => {
        expect(conditionsFromItems(undefined)).toEqual([]);
    });
});
