// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { diceExpressions, linkDiceExpressions } from "./dice-links.js";

/** A div holding the given markup, as the enricher hands one over. */
function content(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div;
}

/** A stand-in for the roll link, carrying the formula it was built from. */
function link(formula, text) {
    const a = document.createElement("a");
    a.className = "inline-roll";
    a.dataset.formula = formula;
    a.textContent = text;
    return a;
}

/** The formulas of every link in an element, in document order. */
function formulas(root) {
    return [...root.querySelectorAll("a.inline-roll")].map(a => a.dataset.formula);
}

describe("diceExpressions", () => {
    it("finds an expression written in the middle of a sentence", () => {
        expect(diceExpressions("Creatures in the area take 2d6 acid damage."))
            .toEqual([{ text: "2d6", formula: "2d6", index: 27 }]);
    });

    it("takes the spaces out of a modifier without changing what the reader sees", () => {
        const [found] = diceExpressions("Sickened for 1d4 + 1 rounds.");

        expect(found.text).toBe("1d4 + 1");
        expect(found.formula).toBe("1d4+1");
    });

    it("lowercases a die written with a capital D without changing what the reader sees", () => {
        const [found] = diceExpressions("deals 1D8 damage");

        expect(found.text).toBe("1D8");
        expect(found.formula).toBe("1d8");
    });

    it("reads two expressions added together as two expressions", () => {
        // Reading the +1 of 1d4+1d6 as a modifier would leave a stray d6 behind.
        expect(diceExpressions("1d4+1d6").map(found => found.formula)).toEqual(["1d4", "1d6"]);
    });

    it("ignores a number pair that is part of a longer word", () => {
        expect(diceExpressions("model x1d4 chassis")).toEqual([]);
    });

    it("ignores the tail of a version number", () => {
        expect(diceExpressions("version 3.1d4 of the rules")).toEqual([]);
    });

    it("ignores an expression whose multiplier it would have to cut off", () => {
        // Linking 1d4 out of 1d4x10 would roll a tenth of what is written.
        expect(diceExpressions("worth 1d4x10 credits")).toEqual([]);
    });

    it("ignores a d that is not followed by a die size", () => {
        expect(diceExpressions("printed on a 3d printer")).toEqual([]);
    });

    it("ignores a die size that has no count in front of it", () => {
        expect(diceExpressions("roll d20 to hit")).toEqual([]);
    });
});

describe("linkDiceExpressions", () => {
    it("replaces the expression and leaves the words around it in place", () => {
        const root = content("<p>Creatures take 2d6 acid damage.</p>");

        linkDiceExpressions(root, link);

        expect(formulas(root)).toEqual(["2d6"]);
        expect(root.textContent).toBe("Creatures take 2d6 acid damage.");
    });

    it("links both expressions in one run of text", () => {
        const root = content("<p>Deals 1d6 fire and 2d8 cold.</p>");

        linkDiceExpressions(root, link);

        expect(formulas(root)).toEqual(["1d6", "2d8"]);
    });

    it("links expressions that are in different elements", () => {
        const root = content("<p>Deals <strong>1d6</strong> fire and 2d8 cold.</p>");

        linkDiceExpressions(root, link);

        expect(formulas(root)).toEqual(["1d6", "2d8"]);
    });

    it("leaves an expression that is already a roll link alone", () => {
        const root = content('<p>Sickened for <a class="inline-roll" data-formula="1d4+1">1d4+1</a> rounds.</p>');

        expect(formulas(root)).toEqual(["1d4+1"]);

        linkDiceExpressions(root, link);

        expect(formulas(root)).toEqual(["1d4+1"]);
    });

    it("leaves an expression quoted in a code block alone", () => {
        const root = content("<p>Enter <code>2d6</code> to roll it.</p>");

        linkDiceExpressions(root, link);

        expect(formulas(root)).toEqual([]);
    });

    it("leaves the expression as written when the caller declines to build a link", () => {
        const root = content("<p>Creatures take 2d6 acid damage.</p>");

        linkDiceExpressions(root, () => null);

        expect(root.innerHTML).toBe("<p>Creatures take 2d6 acid damage.</p>");
    });
});
