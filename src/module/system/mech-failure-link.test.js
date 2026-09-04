// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { SPENT_CLASS, failureRecipients, spendFailureLink, transitionButtons } from "./mech-failure-link.js";

/** A failure card as it is stored, with its 1d20 still unrolled. */
function card(action = "mechFailureRoll") {
    return `<div class="mech-failure"><p>Roll for the component: `
        + `<a class="enriched-link" data-action="${action}" data-formula="1d20">1d20</a></p></div>`;
}

describe("spendFailureLink", () => {
    it("unbinds the link, so a reload does not hand the roll back", () => {
        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(card(), "mechFailureRoll");

        expect(spent.querySelector("a[data-action]")).toBeNull();
    });

    it("marks the link spent, so it greys out for everyone rendering the card", () => {
        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(card(), "mechFailureRoll");

        expect(spent.querySelector(`a.${SPENT_CLASS}`)).not.toBeNull();
    });

    // The other action is written first, so a selector that matched any action
    // rather than the named one would spend that button instead of this one.
    it("leaves a different button on the card still clickable", () => {
        const both = '<div class="mech-failure">'
            + '<p><a data-action="mechCockpitSave" data-formula="1d20">Reflex</a></p>'
            + '<p><a data-action="mechFailureRoll" data-formula="1d20">1d20</a></p></div>';

        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(both, "mechFailureRoll");

        expect(spent.querySelector('a[data-action="mechCockpitSave"]')).not.toBeNull();
        expect(spent.querySelector('a[data-action="mechFailureRoll"]')).toBeNull();
    });

    it("spends only the one button pressed when a card carries several of a kind", () => {
        const two = '<div><a data-action="mechCockpitSave" data-index="0">A</a>'
            + '<a data-action="mechCockpitSave" data-index="1">B</a></div>';

        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(two, "mechCockpitSave", "1");

        expect(spent.querySelector('a[data-index="0"]').dataset.action).toBe("mechCockpitSave");
        expect(spent.querySelector('a[data-index="1"]').dataset.action).toBeUndefined();
    });

    // The caller writes to the message only when this returns something different,
    // so a card with no such link has to come back as the same string rather than a
    // re-serialized copy. The unclosed tag makes the difference visible.
    it("returns a card holding no such link unchanged", () => {
        const content = "<p>Nothing to roll here.";

        expect(spendFailureLink(content, "mechFailureRoll")).toBe(content);
    });
});

describe("failureRecipients", () => {
    function world(owners) {
        const users = [
            { id: "gm", isGM: true },
            { id: "pilot", isGM: false },
            { id: "bystander", isGM: false }
        ];
        const actor = { testUserPermission: (user) => owners.includes(user.id) };
        return { users, actor };
    }

    it("tells the GM, who is running the fight", () => {
        const { users, actor } = world([]);

        expect(failureRecipients(users, actor)).toContain("gm");
    });

    it("tells the mech's owner, whose mech is coming apart", () => {
        const { users, actor } = world(["pilot"]);

        expect(failureRecipients(users, actor)).toContain("pilot");
    });

    it("leaves out a player with no claim on the mech", () => {
        const { users, actor } = world(["pilot"]);

        expect(failureRecipients(users, actor)).not.toContain("bystander");
    });

    it("names each recipient once, so the whisper list holds no duplicates", () => {
        const { users, actor } = world(["gm", "pilot"]);
        const recipients = failureRecipients(users, actor);

        expect(recipients).toEqual([...new Set(recipients)]);
    });
});

describe("transitionButtons", () => {
    const mech = { tier: 4, operatorCount: 3, auxiliaryCount: 2 };

    it("offers no button for a component whose failure costs nothing extra", () => {
        expect(transitionButtons({ component: "upperLimbs", status: "malfunctioning", ...mech })).toEqual([]);
    });

    it("offers the Power Point loss when the core fails", () => {
        expect(transitionButtons({ component: "powerCore", status: "malfunctioning", ...mech }))
            .toEqual([{ action: "mechPowerCoreLoss", formula: "1d4", index: 0 }]);
    });

    it("offers no Power Point loss for a core that is still working", () => {
        expect(transitionButtons({ component: "powerCore", status: "nominal", ...mech })).toEqual([]);
    });

    it("offers one save per affected operator when the cockpit malfunctions", () => {
        expect(transitionButtons({ component: "cockpit", status: "malfunctioning", ...mech })).toEqual([
            { action: "mechCockpitSave", formula: "4d8", index: 0 },
            { action: "mechCockpitSave", formula: "4d8", index: 1 }
        ]);
    });

    it("offers a save for every operator when the cockpit is inoperable", () => {
        expect(transitionButtons({ component: "cockpit", status: "inoperable", ...mech })).toHaveLength(3);
    });

    it("offers the selection roll only when the auxiliary component becomes inoperable", () => {
        expect(transitionButtons({ component: "auxSystem", status: "malfunctioning", ...mech })).toEqual([]);
        expect(transitionButtons({ component: "auxSystem", status: "inoperable", ...mech }))
            .toEqual([{ action: "mechAuxiliaryPick", formula: "1d2", index: 0 }]);
    });

    it("offers no selection roll to a mech carrying no auxiliary systems", () => {
        expect(transitionButtons({ component: "auxSystem", status: "inoperable", ...mech, auxiliaryCount: 0 }))
            .toEqual([]);
    });
});
