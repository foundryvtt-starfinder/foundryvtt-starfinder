/**
 * What Replenish restores.
 *
 * The ability grants a die of Shield Points, and another die at tier 5 and every
 * 5 tiers after that, so the dice a mech rolls depend on its tier. Nothing here
 * touches Foundry: the caller rolls the formula and brings the total back.
 */

/**
 * The dice a mech of this tier rolls for Replenish.
 *
 * @param {number} tier The mech's tier.
 * @param {object} [shape] What the ability grants, as the action declares it.
 * @param {number} [shape.die] The size of each die.
 * @param {number} [shape.base] Dice rolled before any tier is counted.
 * @param {number} [shape.perTiers] Tiers between each additional die.
 * @returns {string} A roll formula, e.g. "2d8".
 */
export function replenishFormula(tier, { die = 8, base = 1, perTiers = 5 } = {}) {
    const tiers = Math.max(Number(tier) || 0, 0);
    const count = base + Math.floor(tiers / perTiers);

    return `${count}d${die}`;
}

/**
 * The Shield Points a mech has after Replenish is rolled for it.
 *
 * A roll that would carry the mech past its maximum restores only the difference,
 * so the amount reported is what the mech actually gained rather than what the
 * dice showed. A mech already at or above its maximum gains nothing.
 *
 * @param {{value: number, max: number}} sp The mech's Shield Points.
 * @param {number} rolled The total rolled.
 * @returns {{value: number, gained: number}} The new value and what it went up by.
 */
export function replenishedShieldPoints(sp = {}, rolled = 0) {
    const current = Number(sp.value) || 0;
    const max = Number(sp.max) || 0;
    const total = Math.max(Number(rolled) || 0, 0);

    if (current >= max) return { value: current, gained: 0 };

    const value = Math.min(current + total, max);

    return { value, gained: value - current };
}
