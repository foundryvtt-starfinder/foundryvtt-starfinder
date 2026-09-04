/**
 * The Hit Point fractions at which a mech suffers a system failure.
 *
 * The printed text says "two-thirds its remaining Hit Points", which is either
 * always true or never reachable read literally. It is read here as a fraction
 * of maximum Hit Points, which is the only reading that produces two failures
 * over a mech's life.
 *
 * @type {ReadonlyArray<{id: string, fraction: number}>}
 */
export const FAILURE_THRESHOLDS = Object.freeze([
    Object.freeze({ id: "twoThirds", fraction: 2 / 3 }),
    Object.freeze({ id: "oneThird", fraction: 1 / 3 })
]);

/**
 * Which system failures a change in Hit Points has brought on.
 *
 * Only damage triggers a failure - a mech healed back above a threshold and
 * damaged again does not suffer a second one, which is what the recorded list
 * is for. A single hit large enough to carry a mech past both thresholds
 * triggers both, in the order they were crossed.
 *
 * @param {object} options
 * @param {number} options.value The mech's Hit Points after the change.
 * @param {number} options.previousValue The Hit Points before it.
 * @param {number} options.max The mech's maximum Hit Points.
 * @param {string[]} [options.fired] Thresholds already suffered this encounter.
 * @returns {string[]} Ids of the thresholds newly crossed, worst last.
 */
export function failuresTriggered({ value = 0, previousValue = 0, max = 0, fired = [] } = {}) {
    if (max <= 0) return [];
    if (value >= previousValue) return [];

    return FAILURE_THRESHOLDS
        .filter(threshold => !fired.includes(threshold.id))
        .filter(threshold => value <= max * threshold.fraction)
        .map(threshold => threshold.id);
}

/**
 * Whether a mech is still fighting, wrecked, or gone for good.
 *
 * Foundry clamps Hit Points at zero, so the damage dealt past that point is
 * counted separately and passed in here. A mech is destroyed once everything it
 * has taken adds up to more than twice its maximum Hit Points.
 *
 * @param {object} options
 * @param {number} options.value The mech's current Hit Points.
 * @param {number} options.max The mech's maximum Hit Points.
 * @param {number} [options.overkill] Damage dealt past zero Hit Points.
 * @returns {"intact"|"wrecked"|"destroyed"} The mech's state.
 */
export function damageState({ value = 0, max = 0, overkill = 0 } = {}) {
    const taken = (max - value) + overkill;
    if (max > 0 && taken > max * 2) return "destroyed";
    if (value <= 0) return "wrecked";

    return "intact";
}
