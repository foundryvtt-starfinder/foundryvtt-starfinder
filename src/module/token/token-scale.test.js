import { describe, expect, test } from "vitest";
import { baseSquaresForFrame, scaledTokenSize, snapResolution } from "./token-scale.js";
import { tokenSizes } from "./token-sizes.js";

describe("scaledTokenSize on a 5 ft grid", () => {
    test("leaves a token at the squares it was drawn at", () => {
        for (const squares of [1, 2, 3, 4, 6]) {
            expect(scaledTokenSize(squares, 5)).toBe(squares);
        }
    });

    test("leaves a mech at the squares it was drawn at", () => {
        for (const squares of [3, 4, 6]) {
            expect(scaledTokenSize(squares, 5, { isMech: true })).toBe(squares);
        }
    });
});

describe("scaledTokenSize for mechs on a 10 ft grid", () => {
    test("a Huge mech's 15 ft space rounds down to one square", () => {
        expect(scaledTokenSize(tokenSizes.huge, 10, { isMech: true })).toBe(1);
    });

    test("a Gargantuan mech's 20 ft space is two squares", () => {
        expect(scaledTokenSize(tokenSizes.gargantuan, 10, { isMech: true })).toBe(2);
    });

    test("a Colossal mech's 30 ft space is three squares", () => {
        expect(scaledTokenSize(tokenSizes.colossal, 10, { isMech: true })).toBe(3);
    });
});

describe("scaledTokenSize for mechs on other grids", () => {
    test("a Huge mech fills a single 15 ft square", () => {
        expect(scaledTokenSize(tokenSizes.huge, 15, { isMech: true })).toBe(1);
    });

    test("a Gargantuan mech's 20 ft space rounds down to a single 15 ft square", () => {
        expect(scaledTokenSize(tokenSizes.gargantuan, 15, { isMech: true })).toBe(1);
    });

    test("a mech never shrinks below one square", () => {
        expect(scaledTokenSize(tokenSizes.huge, 40, { isMech: true })).toBe(1);
    });
});

describe("scaledTokenSize for everything that is not a mech", () => {
    test("a one square token takes half a 10 ft square", () => {
        expect(scaledTokenSize(1, 10)).toBe(0.5);
    });

    test("a three square token takes one and a half 10 ft squares", () => {
        expect(scaledTokenSize(3, 10)).toBe(1.5);
    });

    test("a six square token takes two 15 ft squares", () => {
        expect(scaledTokenSize(6, 15)).toBe(2);
    });

    test("a token drawn taller than it is wide keeps each side to its own scale", () => {
        expect(scaledTokenSize(2, 10)).toBe(1);
        expect(scaledTokenSize(3, 10)).toBe(1.5);
    });
});

describe("scaledTokenSize when the scene gives it nothing to scale by", () => {
    test("a gridless scene leaves the token at the squares it was drawn at", () => {
        expect(scaledTokenSize(3, 0)).toBe(3);
    });

    test("a missing grid distance leaves the token at the squares it was drawn at", () => {
        expect(scaledTokenSize(3, undefined)).toBe(3);
    });
});

describe("baseSquaresForFrame", () => {
    test("takes the size from the mech frame the actor has equipped", () => {
        const mech = {
            items: [
                { type: "mechWeapon", system: { size: "medium" } },
                { type: "mechFrame", system: { size: "colossal" } }
            ]
        };
        expect(baseSquaresForFrame(mech)).toBe(tokenSizes.colossal);
    });

    test("an actor with no frame has no frame size to go by", () => {
        expect(baseSquaresForFrame({ items: [] })).toBe(null);
    });

    test("a frame with no size has no frame size to go by", () => {
        expect(baseSquaresForFrame({ items: [{ type: "mechFrame", system: {} }] })).toBe(null);
    });

    test("a frame whose size is not one the system knows has no frame size to go by", () => {
        expect(baseSquaresForFrame({ items: [{ type: "mechFrame", system: { size: "titanic" } }] })).toBe(null);
    });

    test("an actor that carries no items at all has no frame size to go by", () => {
        expect(baseSquaresForFrame({})).toBe(null);
    });
});

describe("snapResolution", () => {
    test("a fractional token on a 15 ft grid snaps in thirds, the 5 ft steps it moves in", () => {
        expect(snapResolution(1 / 3, 15)).toBe(3);
    });

    test("a fractional token on a 10 ft grid snaps in halves", () => {
        expect(snapResolution(0.5, 10)).toBe(2);
    });

    test("a token larger than a square but not a whole number of them still snaps in 5 ft steps", () => {
        expect(snapResolution(1.5, 10)).toBe(2);
    });

    test("a token that fills whole squares is left to Foundry's own snapping", () => {
        expect(snapResolution(1, 15)).toBe(null);
        expect(snapResolution(3, 10)).toBe(null);
    });

    test("a 5 ft grid needs no finer steps than Foundry already takes", () => {
        expect(snapResolution(1 / 3, 5)).toBe(null);
    });

    test("a grid whose squares are not a whole number of 5 ft steps is left alone", () => {
        expect(snapResolution(0.5, 7)).toBe(null);
    });

    test("a scene with no grid distance is left alone", () => {
        expect(snapResolution(0.5, 0)).toBe(null);
    });
});
