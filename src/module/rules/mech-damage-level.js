/**
 * Ordered mech weapon damage levels, weakest to strongest.
 * Matches the columns of CONFIG.SFRPG.mechWeaponDamageByTier (Tech Revolution Table 4-5).
 * @type {string[]}
 */
export const DAMAGE_LEVEL_ORDER = ["low", "medium", "high", "extreme"];

/**
 * Work out the damage level a mech weapon rolls at once an override is applied.
 *
 * An override either steps the weapon up the damage track by a number of steps
 * ({@link steps}) or sets an absolute level ({@link level}). Steps beyond extreme
 * can't raise the level any further, so each surplus step becomes +1 damage per
 * damage die rolled instead - this is what Devastating Hit does to a weapon that
 * already deals extreme damage.
 *
 * @param {string} baseLevel The weapon's own damage level.
 * @param {{steps?: number, level?: string}|null} override The override to apply, if any.
 * @returns {{level: string, bonusPerDie: number}} The level to roll at, and any flat bonus per damage die.
 */
export function resolveDamageLevel(baseLevel, override) {
    if (!override) return { level: baseLevel, bonusPerDie: 0 };

    if (override.level) return { level: override.level, bonusPerDie: 0 };

    const steps = override.steps ?? 0;
    const baseIndex = DAMAGE_LEVEL_ORDER.indexOf(baseLevel);
    if (baseIndex < 0) return { level: baseLevel, bonusPerDie: 0 };

    const maxIndex = DAMAGE_LEVEL_ORDER.length - 1;
    const targetIndex = baseIndex + steps;

    return {
        level: DAMAGE_LEVEL_ORDER[Math.min(targetIndex, maxIndex)],
        bonusPerDie: Math.max(targetIndex - maxIndex, 0)
    };
}

/**
 * Add a flat bonus to a damage formula worth {@link bonusPerDie} per damage die rolled.
 *
 * A weapon already dealing extreme damage can't step any higher, so Devastating Hit
 * adds 1 damage for every die instead - 10d12 becomes 10d12 + 10.
 *
 * @param {string} formula A damage formula in NdM form, as stored in CONFIG.SFRPG.mechWeaponDamageByTier.
 * @param {number} bonusPerDie Extra damage per die rolled.
 * @returns {string} The formula with the flat bonus appended, or the original formula if there is no bonus to add.
 */
export function applyPerDieBonus(formula, bonusPerDie) {
    if (!bonusPerDie) return formula;

    const match = /^(\d+)d(\d+)$/.exec(formula.trim());
    if (!match) return formula;

    return `${formula} + ${Number(match[1]) * bonusPerDie}`;
}
