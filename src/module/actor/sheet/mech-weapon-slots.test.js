import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it } from "vitest";
import { allowedWeaponLevels, droppedSlot, levelRefusal, maxWeaponLevel, mountRefusal, updatedWeaponLevel } from "./mech-weapon-slots.js";

/** A weapon as the sheet sees it: an id, the slots it may go in, its size and its level. */
function weapon({ id = "w1", validSlots = ["frame", "upperLimb"], slotsUsed = 1, levelOverride = null } = {}) {
    return { id, name: "Autocannon", system: { validSlots, slotsUsed, levelOverride } };
}

describe("droppedSlot", () => {
    let document;

    beforeEach(() => {
        // The shape the mech sheet renders: one weapons list per mount, with the
        // weapon rows nested inside it.
        document = new JSDOM(`
            <div class="tab features">
                <ol class="inventory-list">
                    <li class="inventory-header weapons-subheader" data-weapon-slot="frame" id="frame-header"></li>
                    <ol class="item-list weapons-list" data-weapon-slot="frame" id="frame-list">
                        <li class="item empty-slot" id="frame-empty"><span id="frame-empty-text"></span></li>
                    </ol>
                </ol>
                <ol class="inventory-list">
                    <ol class="item-list weapons-list" data-weapon-slot="upperLimb" id="upper-list">
                        <li class="item" data-item-id="w1" id="upper-weapon">
                            <h4 id="upper-weapon-name"></h4>
                        </li>
                    </ol>
                </ol>
                <ol class="item-list" id="unmarked-list">
                    <li class="item" id="loose-row"></li>
                </ol>
            </div>
        `).window.document;
    });

    it("reads the mount from an element nested inside its list", () => {
        expect(droppedSlot(document.getElementById("upper-weapon-name"))).toBe("upperLimb");
    });

    it("reads the mount when the drop lands on an empty mount's placeholder", () => {
        expect(droppedSlot(document.getElementById("frame-empty-text"))).toBe("frame");
    });

    it("reads the mount from the list header", () => {
        expect(droppedSlot(document.getElementById("frame-header"))).toBe("frame");
    });

    it("returns null when the drop landed outside any mount", () => {
        expect(droppedSlot(document.getElementById("loose-row"))).toBeNull();
    });

    it("returns null when there is no target to read", () => {
        expect(droppedSlot(null)).toBeNull();
    });
});

describe("mountRefusal", () => {
    it("allows a weapon into a mount that has room for it", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon(),
            mountedWeapons: [],
            hasComponent: true,
            capacity: 2
        })).toBeNull();
    });

    it("refuses a mount the weapon is not built for", () => {
        expect(mountRefusal({
            slot: "lowerLimb",
            weapon: weapon({ validSlots: ["frame"] }),
            mountedWeapons: [],
            hasComponent: true,
            capacity: 2
        })).toBe("SFRPG.MechSheet.WeaponsLocker.InvalidSlotForWeapon");
    });

    it("refuses a mount whose component the mech does not have", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon(),
            mountedWeapons: [],
            hasComponent: false,
            capacity: 2
        })).toBe("SFRPG.MechSheet.WeaponsLocker.NoComponentForSlot");
    });

    it("refuses a mount whose slots are already spent", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon({ id: "incoming" }),
            mountedWeapons: [weapon({ id: "resident", slotsUsed: 2 })],
            hasComponent: true,
            capacity: 2
        })).toBe("SFRPG.MechSheet.WeaponsLocker.NotEnoughSlots");
    });

    it("counts the slots a multi-slot weapon needs, not one per weapon", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon({ id: "incoming", slotsUsed: 2 }),
            mountedWeapons: [weapon({ id: "resident", slotsUsed: 1 })],
            hasComponent: true,
            capacity: 2
        })).toBe("SFRPG.MechSheet.WeaponsLocker.NotEnoughSlots");
    });

    it("does not count the weapon being moved against its own mount", () => {
        const moving = weapon({ id: "moving", slotsUsed: 2 });

        // The mount is full, and it is full because this weapon is in it. Dropping
        // it back where it was must not be refused for the room it is vacating.
        expect(mountRefusal({
            slot: "frame",
            weapon: moving,
            mountedWeapons: [moving],
            hasComponent: true,
            capacity: 2
        })).toBeNull();
    });

    it("accepts the locker without a component or any capacity", () => {
        expect(mountRefusal({
            slot: "locker",
            weapon: weapon({ validSlots: ["frame"] }),
            mountedWeapons: [weapon({ id: "a" }), weapon({ id: "b" })],
            hasComponent: false,
            capacity: 0
        })).toBeNull();
    });

    it("refuses a destination that is not a weapon mount at all", () => {
        expect(mountRefusal({
            slot: "auxiliary",
            weapon: weapon(),
            mountedWeapons: [],
            hasComponent: true,
            capacity: 4
        })).toBe("SFRPG.MechSheet.WeaponsLocker.UnknownSlot");
    });
});

describe("maxWeaponLevel", () => {
    it("allows one level above the mech's tier", () => {
        expect(maxWeaponLevel(5)).toBe(6);
    });

    it("refuses to read a tier it was not given as though it were high", () => {
        // Waving a weapon through because the tier could not be read would defeat
        // the cap entirely, so an unreadable tier counts as 0.
        expect(maxWeaponLevel(undefined)).toBe(1);
    });
});

describe("levelRefusal", () => {
    it("allows a weapon one level above the mech's tier", () => {
        expect(levelRefusal({ weapon: weapon({ levelOverride: 6 }), tier: 5 })).toBeNull();
    });

    it("refuses a weapon two levels above the mech's tier", () => {
        expect(levelRefusal({ weapon: weapon({ levelOverride: 7 }), tier: 5 }))
            .toBe("SFRPG.MechSheet.WeaponsLocker.LevelTooHigh");
    });

    it("allows a weapon below the mech's tier", () => {
        expect(levelRefusal({ weapon: weapon({ levelOverride: 2 }), tier: 5 })).toBeNull();
    });

    it("allows a weapon that carries no level of its own", () => {
        // Without an override the weapon is resolved as the mech's own tier
        // everywhere else, so it can never be above it.
        expect(levelRefusal({ weapon: weapon(), tier: 5 })).toBeNull();
    });
});

describe("mountRefusal level cap", () => {
    it("refuses a mount for a weapon above the mech's tier + 1", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon({ levelOverride: 7 }),
            hasComponent: true,
            capacity: 2,
            tier: 5
        })).toBe("SFRPG.MechSheet.WeaponsLocker.LevelTooHigh");
    });

    it("mounts a weapon at exactly the mech's tier + 1", () => {
        expect(mountRefusal({
            slot: "frame",
            weapon: weapon({ levelOverride: 6 }),
            hasComponent: true,
            capacity: 2,
            tier: 5
        })).toBeNull();
    });

    it("refuses an over-level weapon even into the locker", () => {
        // The locker is part of the mech, and a mech may not carry a weapon
        // above its ceiling at all.
        expect(mountRefusal({
            slot: "locker",
            weapon: weapon({ levelOverride: 20 }),
            tier: 1
        })).toBe("SFRPG.MechSheet.WeaponsLocker.LevelTooHigh");
    });

    it("still takes a weapon within the cap into the locker", () => {
        expect(mountRefusal({
            slot: "locker",
            weapon: weapon({ levelOverride: 2 }),
            tier: 5
        })).toBeNull();
    });
});

describe("allowedWeaponLevels", () => {
    it("offers every level up to the mech's tier + 1", () => {
        expect(allowedWeaponLevels(5)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("offers level 1 alone for a mech whose tier cannot be read", () => {
        expect(allowedWeaponLevels(undefined)).toEqual([1]);
    });
});

describe("updatedWeaponLevel", () => {
    it("reads a level from the flattened shape a sheet submits", () => {
        // The item sheet posts its form as {"system.levelOverride": 8}, which is
        // what reached _preUpdate unread and let a level 8 weapon onto a tier 5 mech.
        expect(updatedWeaponLevel({ "system.levelOverride": 8, "system.slot": "frame" })).toBe(8);
    });

    it("reads a level from the nested shape code passes to update()", () => {
        expect(updatedWeaponLevel({ system: { levelOverride: 8 } })).toBe(8);
    });

    it("reads a level being cleared back to the mech's tier", () => {
        // Null is a real value here and must not read as "no change".
        expect(updatedWeaponLevel({ "system.levelOverride": null })).toBeNull();
    });

    it("reads nothing from an update that leaves the level alone", () => {
        expect(updatedWeaponLevel({ "system.slot": "frame" })).toBeUndefined();
    });

    it("reads nothing when there is no update to read", () => {
        expect(updatedWeaponLevel(undefined)).toBeUndefined();
    });
});
