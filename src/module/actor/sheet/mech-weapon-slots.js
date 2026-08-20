/**
 * Slot resolution for weapons mounted on a mech.
 *
 * The mech sheet shows one Mounted Weapons list per component that has weapon
 * slots, plus the weapons locker. Dragging a weapon from one of those lists onto
 * another moves it, so two questions have to be answerable: which list the drop
 * landed on, and whether that destination will take the weapon.
 *
 * Both are pure functions rather than sheet methods so they can be tested
 * without a sheet, an actor or a running Foundry.
 */

/** Mech component type providing each mountable weapon slot. */
export const SLOT_COMPONENT_TYPES = {
    frame: "mechFrame",
    upperLimb: "mechUpperLimb",
    lowerLimb: "mechLowerLimb"
};

/** The locker holds unmounted weapons. It has no component and no capacity. */
export const LOCKER_SLOT = "locker";

/**
 * The mounted weapons list a drop landed on.
 *
 * @param {EventTarget} target The drop event's target
 * @returns {string|null} The slot, or null when the drop was not on a weapons list
 */
export function droppedSlot(target) {
    if (!target?.closest) return null;
    return target.closest("[data-weapon-slot]")?.dataset?.weaponSlot ?? null;
}

/**
 * The highest level of weapon a mech of this tier may mount.
 *
 * A mech may carry weapons one level above its own tier and no higher. A tier it
 * cannot read counts as 0, so an unknown mech refuses an upgraded weapon rather
 * than waving it through.
 *
 * @param {number} tier The mech's tier.
 * @returns {number} The highest weapon level the mech may mount.
 */
export function maxWeaponLevel(tier) {
    return (Number(tier) || 0) + 1;
}

/**
 * Why a weapon is too high a level for a mech.
 *
 * Only a weapon carrying an explicit levelOverride can breach the cap. A weapon
 * without one is treated as the mech's own tier everywhere the system resolves an
 * effective level, so it tracks the tier and is always within reach of it.
 *
 * @param {object} options
 * @param {object} options.weapon The weapon, as an item or item data
 * @param {number} options.tier The tier of the mech it would be mounted on
 * @returns {string|null} A localization key for the refusal, or null when the level is allowed
 */
export function levelRefusal({ weapon, tier }) {
    const level = weapon?.system?.levelOverride;
    if (!level) return null;

    return level > maxWeaponLevel(tier) ? "SFRPG.MechSheet.WeaponsLocker.LevelTooHigh" : null;
}

/**
 * Why a weapon cannot go in a slot.
 *
 * The weapon is excluded from the slots already spent, so re-dropping a weapon
 * into the slot it is already in is not refused for its own size.
 *
 * @param {object} options
 * @param {string} options.slot Destination slot
 * @param {object} options.weapon The weapon being moved, as an item or item data
 * @param {Array} [options.mountedWeapons] Weapons currently in the destination slot
 * @param {boolean} [options.hasComponent] Whether the mech has the component providing the slot
 * @param {number} [options.capacity] Weapon slots the component provides
 * @param {number} [options.tier] Tier of the mech the weapon would be mounted on
 * @returns {string|null} A localization key for the refusal, or null when the move is allowed
 */
export function mountRefusal({ slot, weapon, mountedWeapons = [], hasComponent = false, capacity = 0, tier = 0 }) {
    if (slot === LOCKER_SLOT) return null;

    if (!(slot in SLOT_COMPONENT_TYPES)) return "SFRPG.MechSheet.WeaponsLocker.UnknownSlot";

    const validSlots = weapon?.system?.validSlots ?? [];
    if (!validSlots.includes(slot)) return "SFRPG.MechSheet.WeaponsLocker.InvalidSlotForWeapon";

    // The locker is already allowed above, so an over-level weapon may sit there.
    // Only mounting it is refused.
    const tooHigh = levelRefusal({ weapon, tier });
    if (tooHigh) return tooHigh;

    if (!hasComponent) return "SFRPG.MechSheet.WeaponsLocker.NoComponentForSlot";

    const slotsUsed = (item) => item?.system?.slotsUsed || 1;
    const spent = mountedWeapons
        .filter(mounted => mounted !== weapon && mounted?.id !== weapon?.id)
        .reduce((sum, mounted) => sum + slotsUsed(mounted), 0);

    if (spent + slotsUsed(weapon) > capacity) return "SFRPG.MechSheet.WeaponsLocker.NotEnoughSlots";

    return null;
}
