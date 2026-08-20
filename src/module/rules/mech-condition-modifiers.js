/**
 * Which conditions reach a mech's attack and damage rolls, and from where.
 *
 * A mech carries conditions of its own, and it is operated by crew who carry
 * their own. Neither set applies wholesale: a mech has no morale to shake, and a
 * pilot strapped into a cockpit is not the thing that gets knocked off-kilter.
 * This table routes each condition to the side it belongs to.
 *
 * Positional and physical conditions belong to the mech. Conditions of a mind or
 * body belong to the operators and travel inward to the mech's rolls.
 *
 * Keys are condition slugs (`system.slug` on the condition's effect item), not
 * file names - `negative_level.json` carries the slug `negative-level`.
 *
 * @type {Readonly<Object<string, {mech: boolean, operator: boolean}>>}
 */
export const MECH_CONDITION_SCOPE = Object.freeze({
    "off-target":     { mech: true,  operator: true },
    "dazzled":        { mech: true,  operator: true },
    "off-kilter":     { mech: true,  operator: false },
    "entangled":      { mech: true,  operator: false },
    "grappled":       { mech: true,  operator: false },
    "pinned":         { mech: true,  operator: false },
    "prone":          { mech: true,  operator: false },
    "flat-footed":    { mech: true,  operator: false },
    "frightened":     { mech: false, operator: true },
    "shaken":         { mech: false, operator: true },
    "sickened":       { mech: false, operator: true },
    "fatigued":       { mech: false, operator: true },
    "exhausted":      { mech: false, operator: true },
    "panicked":       { mech: false, operator: true },
    "negative-level": { mech: false, operator: true }
});

/**
 * The mech's defenses, and the modifier data that reaches each.
 *
 * `saves` covers every save at once; `save` names one through `valueAffected`.
 * A mech's Will save is its operators' rather than its own, and their conditions
 * are already counted in the value it is derived from - so only conditions on
 * the mech itself are applied on top of it here.
 *
 * @type {Readonly<Object<string, {effectTypes: string[], values: string[]}>>}
 */
const DEFENSE_TARGETS = Object.freeze({
    eac:     { effectTypes: ["ac"],            values: ["eac", "both"] },
    kac:     { effectTypes: ["ac"],            values: ["kac", "both"] },
    fort:    { effectTypes: ["save", "saves"], values: ["fort", "highest", "lowest"] },
    reflex:  { effectTypes: ["save", "saves"], values: ["reflex", "highest", "lowest"] },
    will:    { effectTypes: ["save", "saves"], values: ["will", "highest", "lowest"] }
});

/**
 * The condition modifiers that apply to one of a mech's defenses.
 *
 * Only the mech's own conditions count. A mech's armor class is its plating and
 * its saves are the machine's own resilience, so an operator being shaken does
 * not make the mech easier to hit - unlike an attack roll, which the operator
 * is the one making.
 *
 * @param {object} options
 * @param {Array<{slug: string, modifiers: Array}>} [options.mechConditions] Conditions on the mech.
 * @param {"eac"|"kac"|"fort"|"reflex"} options.target Which defense is being computed.
 * @returns {Array<{modifier: object, slug: string, source: "mech"}>} Modifiers to apply.
 */
export function collectMechDefenseModifiers({ mechConditions = [], target }) {
    const defense = DEFENSE_TARGETS[target];
    if (!defense) return [];

    return mechConditions
        .filter(condition => MECH_CONDITION_SCOPE[condition?.slug]?.mech)
        .flatMap(condition => (condition.modifiers ?? [])
            .filter(modifier => modifier?.enabled !== false
                && defense.effectTypes.includes(modifier?.effectType)
                // A modifier for every save names no single one.
                && (modifier.effectType === "saves" || defense.values.includes(modifier.valueAffected)))
            .map(modifier => ({ modifier, slug: condition.slug, source: "mech" })));
}

/**
 * An actor's conditions, as this module addresses them.
 *
 * Conditions are `effect` items carrying a `slug` matching an id in
 * CONFIG.SFRPG.statusEffects. Only the ones the routing table knows about are
 * returned, so an unrelated effect item can never reach a mech.
 *
 * @param {Iterable} items The actor's items.
 * @returns {Array<{slug: string, modifiers: Array}>} One entry per applicable condition.
 */
export function conditionsFromItems(items) {
    if (!items) return [];

    return [...items]
        .filter(item => item.type === "effect" && MECH_CONDITION_SCOPE[item.system?.slug])
        .map(item => ({ slug: item.system.slug, modifiers: item.system.modifiers ?? [] }));
}

/**
 * The modifier effect types a mech weapon roll of this kind accepts.
 *
 * Mech weapons are melee or ranged and nothing else, so the spell and
 * weapon-category effect types a character's weapon can pick up have no mech
 * equivalent and are deliberately absent.
 *
 * @param {"attack"|"damage"} kind Which roll is being made.
 * @param {"melee"|"ranged"} weaponType The mech weapon's type.
 * @returns {string[]} Effect types that apply to this roll.
 */
export function acceptedEffectTypes(kind, weaponType) {
    const specific = weaponType === "melee" ? "melee" : "ranged";
    return kind === "attack"
        ? ["all-attacks", `${specific}-attacks`]
        : ["all-damage", `${specific}-damage`];
}

/**
 * The condition modifiers that apply to one mech weapon roll.
 *
 * Conditions are passed in as `{slug, modifiers}` rather than as actors, so this
 * stays a pure function of the data. Each surviving modifier is returned with
 * the slug and side it came from, which is what lets the chat card say whether
 * the penalty was the mech's or its operator's.
 *
 * @param {object} options
 * @param {Array<{slug: string, modifiers: Array}>} [options.mechConditions] Conditions on the mech.
 * @param {Array<{slug: string, modifiers: Array}>} [options.operatorConditions] Conditions on the operator being counted.
 * @param {"melee"|"ranged"} options.weaponType The mech weapon's type.
 * @param {"attack"|"damage"} options.kind Which roll is being made.
 * @returns {Array<{modifier: object, slug: string, source: "mech"|"operator"}>} Modifiers to apply.
 */
export function collectMechRollModifiers({ mechConditions = [], operatorConditions = [], weaponType, kind }) {
    const accepted = acceptedEffectTypes(kind, weaponType);

    const take = (conditions, source) => conditions
        .filter(condition => MECH_CONDITION_SCOPE[condition?.slug]?.[source])
        .flatMap(condition => (condition.modifiers ?? [])
            .filter(modifier => modifier?.enabled !== false && accepted.includes(modifier?.effectType))
            .map(modifier => ({ modifier, slug: condition.slug, source })));

    return [...take(mechConditions, "mech"), ...take(operatorConditions, "operator")];
}

/**
 * The operator whose conditions count against this roll.
 *
 * An attack is made by one pilot, but which one is chosen inside the roll dialog,
 * after the roll's parts have already been assembled. Rather than restructure
 * that flow, the mech takes the operator the conditions hurt most, which is the
 * same shape as the initiative rule taking the lowest operator's modifier.
 *
 * Ranking counts only modifiers that are plainly numeric. A formula modifier
 * still applies in full once the roll evaluates it - it just does not steer the
 * choice of operator, because its value is not known yet.
 *
 * @param {Array<Array<{slug: string, modifiers: Array}>>} operatorConditionSets One entry per operator.
 * @param {object} options Passed through to {@link collectMechRollModifiers}.
 * @param {"melee"|"ranged"} options.weaponType
 * @param {"attack"|"damage"} options.kind
 * @returns {Array<{slug: string, modifiers: Array}>} The worst-affected operator's conditions, or an empty array.
 */
export function worstAffectedOperator(operatorConditionSets, { weaponType, kind }) {
    let worst = [];
    let worstPenalty = 0;
    let worstCount = 0;

    for (const conditions of operatorConditionSets ?? []) {
        const applied = collectMechRollModifiers({ operatorConditions: conditions, weaponType, kind });
        if (applied.length === 0) continue;

        const penalty = applied.reduce((sum, { modifier }) => {
            const value = Number(modifier.modifier);
            return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        // An operator carrying an applicable condition always beats one carrying
        // none, even when the condition's value is a formula this can't weigh.
        if (worstCount === 0 || penalty < worstPenalty) {
            worstPenalty = penalty;
            worstCount = applied.length;
            worst = conditions;
        }
    }

    return worst;
}
