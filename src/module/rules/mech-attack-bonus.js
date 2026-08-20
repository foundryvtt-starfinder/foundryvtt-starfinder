/**
 * A formula an action may arm as a bonus to a mech's next attack roll: dice, a
 * flat number, or dice plus a flat number.
 *
 * Anything else is refused rather than armed, for the same reason an unrecognized
 * damage level is - arming it would spend the Power Points on a bonus that no
 * roll can evaluate, leaving the flag set and the attack unchanged.
 * @type {RegExp}
 */
const BONUS_FORMULA = /^(?:\d{1,3}d\d{1,3}(?:\s*\+\s*\d{1,3})?|\d{1,3})$/;

/**
 * The attack bonus a mech action declares, if any.
 *
 * Aim reads "roll 1d4 and add the result as an insight bonus to the attack roll",
 * so the action carries the formula and the roll happens when the player commits
 * to it - see CONFIG.SFRPG.mechPPActions.
 *
 * @param {{armsAttackBonus?: {formula?: string}}|null|undefined} action A mech action, from the PP table or a component.
 * @returns {{formula: string}|null} The bonus to arm, or null if the action declares none.
 */
export function actionAttackBonus(action) {
    const formula = action?.armsAttackBonus?.formula;
    if (typeof formula !== "string") return null;

    const trimmed = formula.trim();
    if (!BONUS_FORMULA.test(trimmed)) return null;

    return { formula: trimmed };
}

/**
 * The armed overrides a mech's Actions tab should show a banner for.
 *
 * Aim and Devastating Hit change different rolls, so both can be armed at once
 * and the sheet has to show either or both. Damage comes first because it is the
 * one that has always been there, and a banner that moves when a second one is
 * armed is harder to read than one that stays put.
 *
 * @param {Object} flags The mech's armed overrides.
 * @param {{source?: string, ppSpent?: number}|null} [flags.damageLevelOverride] An armed damage level override.
 * @param {{source?: string, ppSpent?: number, value?: number}|null} [flags.attackBonusOverride] An armed attack bonus.
 * @returns {Array<{kind: string, source: string, ppSpent: number, value: number|null}>} One entry per armed override.
 */
export function armedOverrideBanners({ damageLevelOverride, attackBonusOverride } = {}) {
    const banners = [];

    if (damageLevelOverride) {
        banners.push({
            kind: "damage",
            source: damageLevelOverride.source,
            ppSpent: damageLevelOverride.ppSpent || 0,
            value: null
        });
    }

    if (attackBonusOverride) {
        banners.push({
            kind: "attack",
            source: attackBonusOverride.source,
            ppSpent: attackBonusOverride.ppSpent || 0,
            value: attackBonusOverride.value ?? 0
        });
    }

    return banners;
}
