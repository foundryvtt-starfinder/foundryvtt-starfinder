/**
 * Which mechs in a combat need their Shield Points refilled, and to what.
 *
 * Shields come back on their own at a mech's tier per turn, but only while a
 * combat is running - see the onAfterUpdateCombat hook. Nothing restores them
 * between encounters, so without this the next fight starts wherever the last
 * one left off, and a badly mauled mech spends its opening turns climbing back.
 * Combat starting fills them.
 *
 * Actors are returned rather than ids because an unlinked token carries its own
 * synthetic actor. Two copies of the same mech on the canvas are two actors to
 * update, and updating the base actor would leave both tokens untouched.
 *
 * @param {Iterable} actors The actors in the combat, one per combatant.
 * @returns {Array<{actor: object, sp: number}>} One entry per mech needing a refill, with the value to set.
 */
export function mechShieldRefills(actors) {
    if (!actors) return [];

    // Keyed by actor so a linked mech holding two places in the tracker is
    // refilled once, while two unlinked tokens are refilled separately.
    const refills = new Map();

    for (const actor of actors) {
        if (actor?.type !== "mech") continue;

        const sp = actor.system?.attributes?.sp;
        if (!sp) continue;
        // Covers a mech at full and a mech with no shield generator at all.
        if (sp.value >= sp.max) continue;

        refills.set(actor.uuid ?? actor, { actor, sp: sp.max });
    }

    return [...refills.values()];
}
