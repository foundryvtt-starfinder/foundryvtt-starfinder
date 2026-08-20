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

/**
 * Whether an armed damage level override applies to the weapon rolling damage.
 *
 * A general action like Devastating Hit is declared before a target is chosen and
 * applies to whatever fires next, so it arms an override with no itemId. An
 * ability printed on one weapon - Charged Extreme Projectile reconfigures the
 * mech's torso around that specific barrel - arms one carrying the id of the item
 * it came from, and firing anything else leaves it armed rather than spending it
 * on the wrong weapon.
 *
 * @param {{itemId?: string}|null|undefined} override The armed override, if any.
 * @param {string} itemId Id of the mech weapon about to roll damage.
 * @returns {boolean} True if the override should be applied to this roll.
 */
export function overrideAppliesTo(override, itemId) {
    if (!override) return false;
    if (!override.itemId) return true;

    return override.itemId === itemId;
}

/**
 * The damage level override a mech component's action declares, if any.
 *
 * An action sets an absolute level rather than stepping up the track, because an
 * ability that reads "dealing extreme damage" says what it deals outright - it is
 * not worth one step from wherever the weapon started.
 *
 * An unrecognized level is refused rather than armed. Arming it would spend the
 * Power Points on an override that no damage table row answers to, leaving the
 * flag set and the roll unchanged.
 *
 * @param {{damageLevel?: string}|null|undefined} action One entry from a component's actions array.
 * @returns {{level: string}|null} The override to arm, or null if the action declares none.
 */
export function actionDamageOverride(action) {
    const level = action?.damageLevel;
    if (!level || !DAMAGE_LEVEL_ORDER.includes(level)) return null;

    return { level };
}
