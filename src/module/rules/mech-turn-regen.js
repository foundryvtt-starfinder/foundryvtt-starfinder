/**
 * What a mech regains at the end of one of its turns.
 *
 * Power Points and Shield Points both come back during a fight, and both do so
 * on the same terms, but they draw on different numbers, so this returns them
 * together rather than leaving each caller to work them out.
 *
 * Values are returned only when they change. Null means "leave it alone", which
 * keeps the caller from writing an update that changes nothing and reporting a
 * regeneration that did not happen.
 *
 * @param {object} options
 * @param {{value: number, max: number, regen: number}} [options.pp] The mech's Power Points.
 * @param {{value: number, max: number}} [options.sp] The mech's Shield Points.
 * @param {number} [options.tier] The mech's tier, which is what its shields recover per turn.
 * @returns {{pp: number|null, sp: number|null}} The new values, or null for each that does not change.
 */
export function mechTurnRegen({ pp = {}, sp = {}, tier = 0 } = {}) {
    return {
        pp: regeneratedPowerPoints(pp),
        sp: regeneratedShieldPoints(sp, tier)
    };
}

/**
 * Whether the combatant whose turn just ended is due its regeneration.
 *
 * Regeneration belongs to the end of a turn, and a mech gets one turn per round,
 * so a round it has already regenerated in is done with. That matters because the
 * GM can walk the initiative order in either direction: stepping back and forward
 * again passes the same end of turn a second time, and the mech must not collect
 * twice for it.
 *
 * @param {object} options
 * @param {number} [options.direction] Which way the combat moved. Only a forward step ends a turn.
 * @param {boolean} [options.isNewTurn] Whether the update changed whose turn it is.
 * @param {number} [options.round] The round the ending turn belongs to.
 * @param {number|null} [options.lastRegenRound] The round this combatant last regenerated in.
 * @returns {boolean} True when the regeneration should be applied.
 */
export function shouldRegenOnTurnEnd({ direction = 0, isNewTurn = false, round = 0, lastRegenRound = null } = {}) {
    if (!isNewTurn) return false;
    if (direction <= 0) return false;
    if (lastRegenRound === round) return false;

    return true;
}

/**
 * The Power Points a mech has after its turn ends.
 *
 * @param {{value: number, max: number, regen: number}} pp The mech's Power Points.
 * @returns {number|null} The new value, or null when it does not change.
 */
function regeneratedPowerPoints(pp) {
    const regen = pp.regen || 0;
    if (regen <= 0) return null;
    if (pp.value >= pp.max) return null;

    return Math.min(pp.value + regen, pp.max);
}

/**
 * The Shield Points a mech has after its turn ends.
 *
 * @param {{value: number, max: number}} sp The mech's Shield Points.
 * @param {number} tier The mech's tier, which is what its shields recover.
 * @returns {number|null} The new value, or null when it does not change.
 */
function regeneratedShieldPoints(sp, tier) {
    const regen = Number(tier) || 0;
    if (regen <= 0) return null;
    if (sp.value >= sp.max) return null;

    return Math.min(sp.value + regen, sp.max);
}
