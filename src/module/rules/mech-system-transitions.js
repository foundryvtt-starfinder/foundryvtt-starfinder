/**
 * The effects that fire once, at the moment a component's status changes.
 *
 * Nothing here rolls. Each function either names a formula for the Foundry layer
 * to put on a card as a button, or reads a result that came back from one.
 */

/** What a power core costs its mech each time it fails further. */
const POWER_CORE_LOSS = "1d4";

/**
 * The Power Points a mech loses when its power core fails further.
 *
 * @param {string} status The status the core has just taken on.
 * @returns {string|null} The formula to roll, or null when nothing is lost.
 */
export function powerCoreLoss(status) {
    if (status === "malfunctioning" || status === "inoperable") return POWER_CORE_LOSS;

    return null;
}

/**
 * How many operators a cockpit failure hurts.
 *
 * @param {number} operatorCount How many operators are aboard.
 * @param {string} status The status the cockpit has just taken on.
 * @returns {number} The number of operators affected.
 */
export function cockpitVictimCount(operatorCount, status) {
    const aboard = Math.max(Number(operatorCount) || 0, 0);
    if (status === "inoperable") return aboard;
    if (status === "malfunctioning") return Math.ceil(aboard / 2);

    return 0;
}

/**
 * The bludgeoning damage a cockpit failure deals to one operator.
 *
 * A mech with no tier recorded still rolls a die rather than nothing, so a half
 * built mech in a test encounter behaves like every other.
 *
 * @param {number} tier The mech's tier.
 * @returns {string} The damage formula.
 */
export function cockpitDamage(tier) {
    return `${Math.max(Number(tier) || 0, 1)}d8`;
}

/**
 * The Reflex DC to halve a cockpit failure's damage.
 *
 * @param {number} tier The mech's tier.
 * @returns {number} The save DC.
 */
export function cockpitSaveDC(tier) {
    return 15 + Math.floor(Math.max(Number(tier) || 0, 0) / 2);
}

/**
 * The die that picks which auxiliary system stops working.
 *
 * A mech with one auxiliary system still gets a die rather than a silent choice,
 * so every random outcome on the card reads the same way.
 *
 * @param {number} count How many auxiliary systems the mech carries.
 * @returns {string|null} The formula to roll, or null when there is nothing to pick from.
 */
export function auxiliarySelection(count) {
    const systems = Math.max(Number(count) || 0, 0);
    if (systems < 1) return null;

    return `1d${systems}`;
}

/**
 * The auxiliary system a selection roll names.
 *
 * @param {Array} systems The mech's auxiliary systems, in the order the die counts them.
 * @param {number} roll The result of {@link auxiliarySelection}'s die.
 * @returns {object|null} The system that stops working, or null for a roll it cannot name.
 */
export function auxiliaryToDisable(systems, roll) {
    const index = Number(roll) - 1;
    if (!Number.isInteger(index) || index < 0) return null;

    return systems?.[index] ?? null;
}

/**
 * Whether a percentage check came up as a failure.
 *
 * The die is a d100 and the chance is the share of its faces that fail, so a
 * 25% chance fails on 1 through 25. A chance of 0 fails on nothing, since no
 * face of a d100 is below 1.
 *
 * @param {number} roll The d100 result.
 * @param {number} chance The chance in a hundred of failing.
 * @returns {boolean} True when the system did not work.
 */
export function chanceFailed(roll, chance) {
    return Number(roll) <= Number(chance);
}
