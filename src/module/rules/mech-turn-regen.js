/**
 * What a mech regains at the start of one of its turns.
 *
 * Power Points and Shield Points both come back during a fight, but they answer
 * to different rules, so this returns them together rather than leaving each
 * caller to work them out.
 *
 * Values are returned only when they change. Null means "leave it alone", which
 * keeps the caller from writing an update that changes nothing and reporting a
 * regeneration that did not happen.
 *
 * @param {object} options
 * @param {{value: number, max: number, regen: number}} [options.pp] The mech's Power Points.
 * @param {{value: number, max: number}} [options.sp] The mech's Shield Points.
 * @param {number} [options.tier] The mech's tier, which is what its shields recover per turn.
 * @param {number} [options.round] The combat round this turn belongs to.
 * @returns {{pp: number|null, sp: number|null}} The new values, or null for each that does not change.
 */
export function mechTurnRegen({ pp = {}, sp = {}, tier = 0, round = 0 } = {}) {
    return {
        pp: regeneratedPowerPoints(pp, round),
        sp: regeneratedShieldPoints(sp, tier)
    };
}

/**
 * The Power Points a mech has after its turn begins.
 *
 * Combat starting sets a mech to its initial Power Points, and the first round is
 * what that allotment is for. Regenerating during it would hand the mech points
 * it was never meant to open with, so regeneration begins in the round after.
 *
 * @param {{value: number, max: number, regen: number}} pp The mech's Power Points.
 * @param {number} round The combat round.
 * @returns {number|null} The new value, or null when it does not change.
 */
function regeneratedPowerPoints(pp, round) {
    if (round <= 1) return null;

    const regen = pp.regen || 0;
    if (regen <= 0) return null;
    if (pp.value >= pp.max) return null;

    return Math.min(pp.value + regen, pp.max);
}

/**
 * The Shield Points a mech has after its turn begins.
 *
 * Shields recover the mech's tier per turn from the first round onward, unlike
 * Power Points - a mech can be shot before its own turn comes around, so there is
 * damage for the first round's regeneration to answer.
 *
 * @param {{value: number, max: number}} sp The mech's Shield Points.
 * @param {number} tier The mech's tier.
 * @returns {number|null} The new value, or null when it does not change.
 */
function regeneratedShieldPoints(sp, tier) {
    const regen = Number(tier) || 0;
    if (regen <= 0) return null;
    if (sp.value >= sp.max) return null;

    return Math.min(sp.value + regen, sp.max);
}
