// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { createDiceLink, linkDiceExpressions } from "./dice-links.js";
import { promoteDiceLinkToBonus } from "./mech-bonus-link.js";

/**
 * A description enriched the way a chat card's is, so the links the promotion
 * has to find are the ones the text editor actually builds.
 */
function description(text) {
    const root = document.createElement("div");
    root.innerHTML = `<p>${text}</p>`;
    linkDiceExpressions(root, createDiceLink);
    return root;
}

describe("promoteDiceLinkToBonus", () => {
    test("carries the action's name and cost on the link it promotes", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        const link = promoteDiceLinkToBonus(root, "1d4", { source: "Aim", ppSpent: 1 });

        expect(link.dataset).toMatchObject({ action: "mechAttackBonus", source: "Aim", ppSpent: "1" });
    });

    test("restricts the bonus to one weapon when the action is printed on a component", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        expect(promoteDiceLinkToBonus(root, "1d4", { itemId: "abc123" }).dataset.itemId).toBe("abc123");
    });

    test("leaves an action that names no component free to arm any weapon's attack", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        expect(promoteDiceLinkToBonus(root, "1d4").dataset.itemId).toBeUndefined();
    });

    test("leaves the formula on the link for the click to roll", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        expect(promoteDiceLinkToBonus(root, "1d4").dataset.formula).toBe("1d4");
    });

    test("takes the inline roll classes off, so the die is not also rolled into chat", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        const link = promoteDiceLinkToBonus(root, "1d4");

        expect(link.classList.contains("enriched-link")).toBe(true);
        expect(link.classList.contains("inline-roll")).toBe(false);
        expect(link.classList.contains("roll")).toBe(false);
    });

    test("drops the plain roll tooltip in favor of one saying what arming does", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        const link = promoteDiceLinkToBonus(root, "1d4", { tooltip: "Arm this bonus" });

        expect(link.dataset.tooltip).toBe("Arm this bonus");
        expect(link.dataset.tooltipText).toBeUndefined();
    });

    test("promotes the link the action declared and not another expression beside it", () => {
        const root = description("Roll 1d4, not 2d6.");

        expect(promoteDiceLinkToBonus(root, "2d6").textContent).toBe("2d6");
    });

    test("leaves the sentence around the link as it was written", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        promoteDiceLinkToBonus(root, "1d4");

        expect(root.textContent).toBe("Roll 1d4 and add the result to the attack roll.");
    });

    test("returns null when the description holds no such expression", () => {
        const root = description("Roll 1d4 and add the result to the attack roll.");

        expect(promoteDiceLinkToBonus(root, "1d6")).toBeNull();
    });

    test("returns null rather than reading through a missing description", () => {
        expect(promoteDiceLinkToBonus(null, "1d4")).toBeNull();
    });
});
