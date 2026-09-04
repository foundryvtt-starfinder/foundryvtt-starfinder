/**
 * How an override improves a component's status.
 *
 * A mech buys these at the beginning of its turn: 2 Power Points to ignore a
 * malfunctioning component, 4 to treat an inoperable one as merely
 * malfunctioning. Each moves the component one step better and no further, so
 * the cheaper action cannot clear an inoperable component by itself.
 *
 * @type {Readonly<Object<string, Object<string, string>>>}
 */
const OVERRIDE_RESULT = Object.freeze({
    ignored: Object.freeze({ malfunctioning: "nominal", inoperable: "malfunctioning" }),
    downgraded: Object.freeze({ malfunctioning: "nominal", inoperable: "malfunctioning" })
});

/** What each status does to a rate, worst to best. */
const RATES = Object.freeze({ nominal: 1, malfunctioning: 0.5, inoperable: 0 });

/**
 * A component's status once any override the mech has bought is applied.
 *
 * @param {string} status The stored status.
 * @param {string|null} [override] "ignored" or "downgraded", if one is held.
 * @returns {string} The status the mech's rolls and rates should read.
 */
export function effectiveStatus(status, override = null) {
    return OVERRIDE_RESULT[override]?.[status] ?? status;
}

/**
 * Every component's effective status, keyed the way the data model keys them.
 *
 * @param {Object<string, {value: string}>} [systems] The mech's stored statuses.
 * @param {Object<string, string>} [overrides] The overrides it currently holds.
 * @returns {Object<string, string>} Component key to effective status.
 */
export function effectiveSystems(systems = {}, overrides = {}) {
    return Object.fromEntries(
        Object.entries(systems).map(([component, system]) => [component, effectiveStatus(system?.value, overrides?.[component] ?? null)])
    );
}

/**
 * What fraction of its Shield and Power Point regeneration a mech gets.
 *
 * @param {string} status The power core's effective status.
 * @returns {number} 1, 0.5 or 0.
 */
export function regenerationRate(status) {
    return RATES[status] ?? 1;
}

/**
 * What fraction of its own speeds a mech moves at.
 *
 * Speeds provided by an auxiliary system are not the lower limbs' to slow, and
 * are excluded by the caller rather than here.
 *
 * @param {string} status The lower limbs' effective status.
 * @returns {number} 1, 0.5 or 0.
 */
export function movementRate(status) {
    return RATES[status] ?? 1;
}

/**
 * What fraction of its hardness a mech keeps.
 *
 * @param {string} status The frame's effective status.
 * @returns {number} 1, 0.5 or 0.
 */
export function hardnessRate(status) {
    return RATES[status] ?? 1;
}

/**
 * The chance in a hundred that an auxiliary system fails to work.
 *
 * @param {string} status The auxiliary component's effective status.
 * @returns {number} 0, 25 or 50.
 */
export function auxiliaryFailureChance(status) {
    if (status === "malfunctioning") return 25;
    if (status === "inoperable") return 50;

    return 0;
}
