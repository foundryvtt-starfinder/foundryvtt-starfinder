# Mech Damage and System Failure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a Starfinder mech a working damage track — wrecked, destroyed, and the two Hit Point thresholds that inflict system failures — with the penalties each failed component imposes applied automatically and the Power Point actions that overcome them offered on the sheet.

**Architecture:** Pure rules modules under `src/module/rules/` decide everything; a thin Foundry layer reads documents, posts cards and writes updates. Every random outcome is a button on a whispered chat card, built with the existing `promoteDiceLink` helper — no rules module calls `Roll`.

**Tech Stack:** Foundry VTT v14 (system id `sfrpg`), ES modules, Vite build, vitest with jsdom for DOM tests, eslint.

**Spec:** `docs/superpowers/specs/2026-09-03-mech-damage-system-failure-design.md`

## Global Constraints

- US spelling in every identifier, comment, string and commit message.
- Commit messages, PR bodies and code comments carry no tooling attribution of any kind.
- Every test written or modified must be proven able to fail: mutate the code under test, run the test, confirm it fails for the right reason, revert. One mutation at a time.
- Never leave a test failing. `npm test` must be green before every commit.
- `npm run lint` must report no new errors.
- Rules modules take plain data and return plain data. They must not import from Foundry, must not reference `game`, `CONFIG`, `Roll`, `ChatMessage` or `ui`, and must not roll dice.
- Status keys are exactly `nominal`, `malfunctioning`, `inoperable` — the keys already in `CONFIG.SFRPG.mechSystemStatus`.
- Component keys are exactly `upperLimbs`, `lowerLimbs`, `frame`, `auxSystem`, `powerCore`, `cockpit` — matching `system.attributes.systems` in `src/module/data/actor/mech.mjs`.
- Weapon slot keys are `frame`, `upperLimb`, `lowerLimb`, `locker` — `system.slot` on a `mechWeapon` item.
- After the last task, run `npm run build` and copy `dist/sfrpg.js`, `dist/sfrpg.js.map`, `dist/sfrpg.css` and `dist/lang/*.json` into `C:\Users\jeff_\AppData\Local\FoundryVTT\Data\systems\sfrpg\`. Never copy `packs/`.

---

## File Structure

**New rules modules (pure, unit tested, no Foundry):**

| File | Responsibility |
| --- | --- |
| `src/module/rules/mech-system-failure.js` | When a failure happens, which component it hits, and how a status steps. Also the wrecked/destroyed state. |
| `src/module/rules/mech-system-effects.js` | What a failed component does while it holds: attack penalties, movement, hardness, regeneration, activation chance, and the overcoming actions to offer. |
| `src/module/rules/mech-system-transitions.js` | The one-off effects that fire at the moment a status changes: Power Point loss, cockpit victims, damage and DC formulas, the auxiliary system selected. |

**New Foundry layer:**

| File | Responsibility |
| --- | --- |
| `src/module/system/mech-failure-card.js` | Building the failure card's HTML and the promoted buttons on it. |
| `src/module/system/mech-failure-link.js` | The click handlers for every button on a failure card, and the spent-state write. |

**Modified:**

| File | Change |
| --- | --- |
| `src/module/data/actor/mech.mjs` | Add the `cockpit` status field. |
| `src/module/config.js` | Add the cockpit label to the systems list used by the sheet. |
| `src/module/actor/mixins/actor-damage.js` | A `mech` branch accumulating overkill. |
| `src/module/actor/mixins/actor-mech.js` | `useOvercomeAction`, and clearing overrides. |
| `src/module/item/item.js` | System-failure penalties on mech attack rolls; refusing to roll an unusable weapon. |
| `src/module/rules/actions/actor/mech/calculate-mech-components.js` | Movement and hardness rates. |
| `src/module/actor/sheet/mech.js` | Overcome actions, failure tags, unusable weapon marks. |
| `src/sfrpg.js` | The `updateActor` hook, the click handler registrations, clearing overrides at turn start, and the power core's throttle on end-of-turn regeneration. |
| `static/templates/actors/mech-sheet-full.hbs` | The cockpit dropdown, the failure tags, the wrecked/destroyed banner, the overcome action list. |
| `static/templates/chat/mech-failure-card.hbs` | New card template. |
| `static/lang/*.json` (all seven) | Every new string. |
| `changelist.md` | The 14.1.2 entry. |

---

## Task 1: Failure thresholds and the damage state

**Files:**
- Create: `src/module/rules/mech-system-failure.js`
- Test: `src/module/rules/mech-system-failure.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `FAILURE_THRESHOLDS` (array of `{id: string, fraction: number}`), `failuresTriggered({value, previousValue, max, fired}) -> string[]`, `damageState({value, max, overkill}) -> "intact"|"wrecked"|"destroyed"`.

- [ ] **Step 1: Write the failing test**

Create `src/module/rules/mech-system-failure.test.js`:

```js
import { describe, expect, it } from "vitest";
import { FAILURE_THRESHOLDS, damageState, failuresTriggered } from "./mech-system-failure.js";

/** A mech's Hit Points as the damage hook reads them. */
function hp({ value = 100, previousValue = 120, max = 120, fired = [] } = {}) {
    return { value, previousValue, max, fired };
}

describe("failuresTriggered", () => {
    it("fires the two-thirds failure when damage carries the mech to exactly two-thirds", () => {
        expect(failuresTriggered(hp({ value: 80, previousValue: 81, max: 120 }))).toEqual(["twoThirds"]);
    });

    it("fires nothing while the mech is above two-thirds", () => {
        expect(failuresTriggered(hp({ value: 81, previousValue: 120, max: 120 }))).toEqual([]);
    });

    it("fires both when one hit carries the mech past both thresholds", () => {
        expect(failuresTriggered(hp({ value: 10, previousValue: 120, max: 120 }))).toEqual(["twoThirds", "oneThird"]);
    });

    it("does not fire a threshold already recorded", () => {
        expect(failuresTriggered(hp({ value: 70, previousValue: 80, max: 120, fired: ["twoThirds"] }))).toEqual([]);
    });

    it("fires only the threshold not yet recorded", () => {
        expect(failuresTriggered(hp({ value: 30, previousValue: 80, max: 120, fired: ["twoThirds"] }))).toEqual(["oneThird"]);
    });

    it("fires nothing when the mech is healed rather than damaged", () => {
        expect(failuresTriggered(hp({ value: 60, previousValue: 10, max: 120 }))).toEqual([]);
    });

    it("fires nothing when the Hit Points did not change", () => {
        expect(failuresTriggered(hp({ value: 60, previousValue: 60, max: 120 }))).toEqual([]);
    });

    it("fires nothing for a mech with no maximum Hit Points to measure against", () => {
        expect(failuresTriggered(hp({ value: 0, previousValue: 0, max: 0 }))).toEqual([]);
    });

    it("names both thresholds it can ever fire", () => {
        expect(FAILURE_THRESHOLDS.map(threshold => threshold.id)).toEqual(["twoThirds", "oneThird"]);
    });
});

describe("damageState", () => {
    it("leaves a damaged but standing mech intact", () => {
        expect(damageState({ value: 1, max: 120, overkill: 0 })).toBe("intact");
    });

    it("wrecks a mech at zero Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 0 })).toBe("wrecked");
    });

    it("leaves a wrecked mech wrecked while the damage has not doubled its Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 120 })).toBe("wrecked");
    });

    it("destroys a mech once the damage exceeds twice its Hit Points", () => {
        expect(damageState({ value: 0, max: 120, overkill: 121 })).toBe("destroyed");
    });

    it("counts the damage already dealt toward destruction, not the overkill alone", () => {
        expect(damageState({ value: 0, max: 120, overkill: 100 })).toBe("wrecked");
        expect(damageState({ value: 0, max: 120, overkill: 130 })).toBe("destroyed");
    });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/module/rules/mech-system-failure.test.js`
Expected: FAIL — cannot resolve `./mech-system-failure.js`.

- [ ] **Step 3: Write the implementation**

Create `src/module/rules/mech-system-failure.js`:

```js
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/module/rules/mech-system-failure.test.js`
Expected: PASS, 14 tests.

- [ ] **Step 5: Mutation-check every test**

For each mutation below, apply it, run the file, confirm the named test fails, then revert before the next one.

| Mutation | Test that must fail |
| --- | --- |
| `value <= max * threshold.fraction` to `value < max * threshold.fraction` | exactly two-thirds |
| `2 / 3` to `1 / 2` | above two-thirds |
| Drop the `.filter(... !fired.includes ...)` line | already recorded |
| `value >= previousValue` to `value > previousValue` | Hit Points did not change |
| Remove the `value >= previousValue` line | healed rather than damaged |
| Remove the `max <= 0` line | no maximum Hit Points |
| `taken > max * 2` to `taken >= max * 2` | damage has not doubled |
| `(max - value) + overkill` to `overkill` | counts the damage already dealt |
| Swap the two entries in `FAILURE_THRESHOLDS` | names both thresholds; past both thresholds |

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/module/rules/mech-system-failure.js src/module/rules/mech-system-failure.test.js
git commit -m "Work out when a mech suffers a system failure"
```

---

## Task 2: The component table and status stepping

**Files:**
- Modify: `src/module/rules/mech-system-failure.js`
- Test: `src/module/rules/mech-system-failure.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `COMPONENT_TABLE` (array of `{max: number, component: string}`), `componentForRoll(roll) -> string|null`, `nextStatus(status) -> string`, `isFailed(status) -> boolean`.

- [ ] **Step 1: Write the failing tests**

Append to `src/module/rules/mech-system-failure.test.js`:

```js
import { componentForRoll, isFailed, nextStatus } from "./mech-system-failure.js";

describe("componentForRoll", () => {
    /** The whole printed table, face by face, so no row can drift. */
    const faces = {
        1: "upperLimbs", 2: "upperLimbs", 3: "upperLimbs", 4: "upperLimbs", 5: "upperLimbs",
        6: "lowerLimbs", 7: "lowerLimbs", 8: "lowerLimbs", 9: "lowerLimbs", 10: "lowerLimbs",
        11: "frame", 12: "frame", 13: "frame",
        14: "auxSystem", 15: "auxSystem", 16: "auxSystem",
        17: "powerCore", 18: "powerCore",
        19: "cockpit", 20: "cockpit"
    };

    for (const [roll, component] of Object.entries(faces)) {
        it(`gives ${component} on a ${roll}`, () => {
            expect(componentForRoll(Number(roll))).toBe(component);
        });
    }

    it("gives nothing for a roll off the table", () => {
        expect(componentForRoll(21)).toBeNull();
        expect(componentForRoll(0)).toBeNull();
    });
});

describe("nextStatus", () => {
    it("takes a working component to malfunctioning", () => {
        expect(nextStatus("nominal")).toBe("malfunctioning");
    });

    it("takes a malfunctioning component to inoperable", () => {
        expect(nextStatus("malfunctioning")).toBe("inoperable");
    });

    it("absorbs a failure on a component already inoperable", () => {
        expect(nextStatus("inoperable")).toBe("inoperable");
    });

    it("treats an unrecognized status as working", () => {
        expect(nextStatus(undefined)).toBe("malfunctioning");
    });
});

describe("isFailed", () => {
    it("counts a malfunctioning component as failed", () => {
        expect(isFailed("malfunctioning")).toBe(true);
    });

    it("counts an inoperable component as failed", () => {
        expect(isFailed("inoperable")).toBe(true);
    });

    it("does not count a working component as failed", () => {
        expect(isFailed("nominal")).toBe(false);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/module/rules/mech-system-failure.test.js`
Expected: FAIL — `componentForRoll is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/module/rules/mech-system-failure.js`:

```js
/**
 * The 1d20 system failure table, as rows ending at each face.
 *
 * @type {ReadonlyArray<{max: number, component: string}>}
 */
export const COMPONENT_TABLE = Object.freeze([
    Object.freeze({ max: 5, component: "upperLimbs" }),
    Object.freeze({ max: 10, component: "lowerLimbs" }),
    Object.freeze({ max: 13, component: "frame" }),
    Object.freeze({ max: 16, component: "auxSystem" }),
    Object.freeze({ max: 18, component: "powerCore" }),
    Object.freeze({ max: 20, component: "cockpit" })
]);

/** The statuses a component moves through, in order. */
const STATUS_ORDER = ["nominal", "malfunctioning", "inoperable"];

/**
 * The component a system failure roll hits.
 *
 * @param {number} roll The result of the 1d20.
 * @returns {string|null} The component key, or null for a roll off the table.
 */
export function componentForRoll(roll) {
    const face = Number(roll);
    if (!Number.isFinite(face) || face < 1) return null;

    return COMPONENT_TABLE.find(row => face <= row.max)?.component ?? null;
}

/**
 * The status a component takes on when it suffers a failure.
 *
 * A component already inoperable has nothing worse to become, so the failure is
 * absorbed rather than passed on to another component.
 *
 * @param {string} status The component's current status.
 * @returns {string} The status it takes on.
 */
export function nextStatus(status) {
    const index = STATUS_ORDER.indexOf(status);
    const from = index < 0 ? 0 : index;

    return STATUS_ORDER[Math.min(from + 1, STATUS_ORDER.length - 1)];
}

/**
 * Whether a component is carrying a system failure condition.
 *
 * @param {string} status The component's status.
 * @returns {boolean} True when it is malfunctioning or inoperable.
 */
export function isFailed(status) {
    return status === "malfunctioning" || status === "inoperable";
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/module/rules/mech-system-failure.test.js`
Expected: PASS, 43 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `{ max: 5, component: "upperLimbs" }` to `max: 4` | gives upperLimbs on a 5 |
| `{ max: 10, ... }` to `max: 11` | gives frame on an 11 |
| `{ max: 13, ... }` to `max: 12` | gives frame on a 13 |
| `{ max: 16, ... }` to `max: 15` | gives auxSystem on a 16 |
| `{ max: 18, ... }` to `max: 17` | gives powerCore on an 18 |
| `face < 1` to `face < 0` | roll off the table |
| Remove the `face <= row.max` condition, returning the first row | gives lowerLimbs on a 6 |
| `Math.min(from + 1, ...)` to `from + 1` | absorbs a failure |
| `index < 0 ? 0 : index` to `index` | unrecognized status |
| `status === "malfunctioning" \|\| status === "inoperable"` drop the second clause | counts an inoperable component as failed |

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/module/rules/mech-system-failure.js src/module/rules/mech-system-failure.test.js
git commit -m "Read the system failure table and step a component's status"
```

---

## Task 3: Effective status and the rates a failure changes

**Files:**
- Create: `src/module/rules/mech-system-effects.js`
- Test: `src/module/rules/mech-system-effects.test.js`

**Interfaces:**
- Consumes: `isFailed` from `mech-system-failure.js`.
- Produces: `effectiveStatus(status, override) -> string`, `effectiveSystems(systems, overrides) -> Object<string,string>`, `regenerationRate(status) -> number`, `movementRate(status) -> number`, `hardnessRate(status) -> number`, `auxiliaryFailureChance(status) -> number`.

- [ ] **Step 1: Write the failing test**

Create `src/module/rules/mech-system-effects.test.js`:

```js
import { describe, expect, it } from "vitest";
import {
    auxiliaryFailureChance,
    effectiveStatus,
    effectiveSystems,
    hardnessRate,
    movementRate,
    regenerationRate
} from "./mech-system-effects.js";

describe("effectiveStatus", () => {
    it("leaves a component with no override as it stands", () => {
        expect(effectiveStatus("malfunctioning", null)).toBe("malfunctioning");
    });

    it("clears a malfunctioning component the mech paid 2 PP to ignore", () => {
        expect(effectiveStatus("malfunctioning", "ignored")).toBe("nominal");
    });

    it("treats an inoperable component the mech paid 4 PP for as malfunctioning", () => {
        expect(effectiveStatus("inoperable", "downgraded")).toBe("malfunctioning");
    });

    it("does not let the cheaper action clear an inoperable component", () => {
        expect(effectiveStatus("inoperable", "ignored")).toBe("malfunctioning");
    });

    it("cannot improve a component that is already working", () => {
        expect(effectiveStatus("nominal", "downgraded")).toBe("nominal");
    });
});

describe("effectiveSystems", () => {
    it("applies each override to its own component and no other", () => {
        const systems = {
            upperLimbs: { value: "malfunctioning" },
            powerCore: { value: "inoperable" },
            frame: { value: "malfunctioning" }
        };

        expect(effectiveSystems(systems, { upperLimbs: "ignored" })).toEqual({
            upperLimbs: "nominal",
            powerCore: "inoperable",
            frame: "malfunctioning"
        });
    });

    it("reads a mech with no overrides at all", () => {
        expect(effectiveSystems({ frame: { value: "inoperable" } })).toEqual({ frame: "inoperable" });
    });
});

describe("rates", () => {
    it("leaves a working power core regenerating in full", () => {
        expect(regenerationRate("nominal")).toBe(1);
    });

    it("halves regeneration for a malfunctioning power core", () => {
        expect(regenerationRate("malfunctioning")).toBe(0.5);
    });

    it("stops regeneration for an inoperable power core", () => {
        expect(regenerationRate("inoperable")).toBe(0);
    });

    it("halves movement for malfunctioning lower limbs and stops it when they are inoperable", () => {
        expect(movementRate("nominal")).toBe(1);
        expect(movementRate("malfunctioning")).toBe(0.5);
        expect(movementRate("inoperable")).toBe(0);
    });

    it("halves hardness for a malfunctioning frame and removes it when the frame is inoperable", () => {
        expect(hardnessRate("nominal")).toBe(1);
        expect(hardnessRate("malfunctioning")).toBe(0.5);
        expect(hardnessRate("inoperable")).toBe(0);
    });
});

describe("auxiliaryFailureChance", () => {
    it("never fails a working auxiliary system", () => {
        expect(auxiliaryFailureChance("nominal")).toBe(0);
    });

    it("fails a malfunctioning auxiliary system one time in four", () => {
        expect(auxiliaryFailureChance("malfunctioning")).toBe(25);
    });

    it("fails an inoperable auxiliary system half the time", () => {
        expect(auxiliaryFailureChance("inoperable")).toBe(50);
    });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/module/rules/mech-system-effects.test.js`
Expected: FAIL — cannot resolve `./mech-system-effects.js`.

- [ ] **Step 3: Write the implementation**

Create `src/module/rules/mech-system-effects.js`:

```js
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
        Object.entries(systems).map(([component, system]) =>
            [component, effectiveStatus(system?.value, overrides?.[component] ?? null)])
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/module/rules/mech-system-effects.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `ignored: { malfunctioning: "nominal", ... }` to `malfunctioning: "malfunctioning"` | clears a malfunctioning component |
| `ignored: { ..., inoperable: "malfunctioning" }` to `inoperable: "nominal"` | does not let the cheaper action clear |
| `downgraded: { ..., inoperable: "malfunctioning" }` to `inoperable: "nominal"` | treats an inoperable component as malfunctioning |
| `?? status` to `?? "nominal"` | leaves a component with no override |
| Add `nominal: "nominal"` under `downgraded` and return it unconditionally | cannot improve a component already working |
| `overrides?.[component]` to a fixed `"ignored"` | applies each override to its own component |
| `malfunctioning: 0.5` to `0.25` in `RATES` | halves regeneration |
| `inoperable: 0` to `0.5` in `RATES` | stops regeneration |
| `nominal: 1` to `0.5` in `RATES` | halves movement (its `nominal` case) |
| `return 25` to `return 50` in `auxiliaryFailureChance` | fails one time in four |
| `if (status === "inoperable") return 50` removed | fails half the time |

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/module/rules/mech-system-effects.js src/module/rules/mech-system-effects.test.js
git commit -m "Work out what a failed mech component costs while it holds"
```

---

## Task 4: Attack penalties, unusable weapons, and the overcoming actions

**Files:**
- Modify: `src/module/rules/mech-system-effects.js`
- Test: `src/module/rules/mech-system-effects.test.js`

**Interfaces:**
- Consumes: `effectiveSystems` from Task 3, `isFailed` from Task 2.
- Produces: `SLOT_COMPONENT` (Object mapping weapon slot to component), `weaponPenalties(statuses, slot) -> Array<{component: string, value: number}>`, `weaponUsable(statuses, slot) -> boolean`, `maneuverPenalty(statuses) -> number`, `overcomeActions(statuses) -> Array<{component: string, status: string, ppCost: number, override: string}>`.

- [ ] **Step 1: Write the failing tests**

Append to `src/module/rules/mech-system-effects.test.js`:

```js
import { SLOT_COMPONENT, maneuverPenalty, overcomeActions, weaponPenalties, weaponUsable } from "./mech-system-effects.js";

describe("weaponPenalties", () => {
    it("penalizes an upper-limb weapon when the upper limbs are malfunctioning", () => {
        expect(weaponPenalties({ upperLimbs: "malfunctioning" }, "upperLimb"))
            .toEqual([{ component: "upperLimbs", value: -2 }]);
    });

    it("leaves a frame weapon alone when it is the limbs that are hurt", () => {
        expect(weaponPenalties({ upperLimbs: "malfunctioning" }, "frame")).toEqual([]);
    });

    it("penalizes a lower-limb weapon when the lower limbs are malfunctioning", () => {
        expect(weaponPenalties({ lowerLimbs: "malfunctioning" }, "lowerLimb"))
            .toEqual([{ component: "lowerLimbs", value: -2 }]);
    });

    it("penalizes a frame weapon when the frame is malfunctioning", () => {
        expect(weaponPenalties({ frame: "malfunctioning" }, "frame"))
            .toEqual([{ component: "frame", value: -2 }]);
    });

    it("gives no penalty for an inoperable mount, which cannot fire at all", () => {
        expect(weaponPenalties({ frame: "inoperable" }, "frame")).toEqual([]);
    });

    it("gives no penalty for a weapon in the locker, which no component mounts", () => {
        expect(weaponPenalties({ frame: "malfunctioning" }, "locker")).toEqual([]);
    });

    it("maps every mount slot to the component that carries it", () => {
        expect(SLOT_COMPONENT).toEqual({
            upperLimb: "upperLimbs",
            lowerLimb: "lowerLimbs",
            frame: "frame"
        });
    });
});

describe("weaponUsable", () => {
    it("lets a weapon on a working mount fire", () => {
        expect(weaponUsable({ frame: "nominal" }, "frame")).toBe(true);
    });

    it("lets a weapon on a malfunctioning mount fire at a penalty", () => {
        expect(weaponUsable({ frame: "malfunctioning" }, "frame")).toBe(true);
    });

    it("stops a weapon on an inoperable mount firing", () => {
        expect(weaponUsable({ frame: "inoperable" }, "frame")).toBe(false);
    });

    it("lets a weapon in the locker fire whatever the mech's state", () => {
        expect(weaponUsable({ frame: "inoperable" }, "locker")).toBe(true);
    });
});

describe("maneuverPenalty", () => {
    it("penalizes combat maneuvers when the upper limbs are malfunctioning", () => {
        expect(maneuverPenalty({ upperLimbs: "malfunctioning" })).toBe(-2);
    });

    it("does not penalize maneuvers for damage elsewhere", () => {
        expect(maneuverPenalty({ frame: "inoperable" })).toBe(0);
    });
});

describe("overcomeActions", () => {
    it("offers nothing to a mech with no failed component", () => {
        expect(overcomeActions({ frame: "nominal", powerCore: "nominal" })).toEqual([]);
    });

    it("offers the 2 PP action for a malfunctioning component", () => {
        expect(overcomeActions({ upperLimbs: "malfunctioning" })).toEqual([
            { component: "upperLimbs", status: "malfunctioning", ppCost: 2, override: "ignored" }
        ]);
    });

    it("offers the 4 PP action for an inoperable component", () => {
        expect(overcomeActions({ powerCore: "inoperable" })).toEqual([
            { component: "powerCore", status: "inoperable", ppCost: 4, override: "downgraded" }
        ]);
    });

    it("offers one action for each failed component", () => {
        const actions = overcomeActions({
            upperLimbs: "malfunctioning",
            frame: "nominal",
            powerCore: "inoperable"
        });

        expect(actions.map(action => action.component)).toEqual(["upperLimbs", "powerCore"]);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/module/rules/mech-system-effects.test.js`
Expected: FAIL — `weaponPenalties is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/module/rules/mech-system-effects.js`, adding the import at the top of the file:

```js
import { isFailed } from "./mech-system-failure.js";

/**
 * Which component carries each weapon mount.
 *
 * The locker is not a mount - a weapon stowed there is not attached to anything
 * that can be damaged - so it is deliberately absent.
 *
 * @type {Readonly<Object<string, string>>}
 */
export const SLOT_COMPONENT = Object.freeze({
    upperLimb: "upperLimbs",
    lowerLimb: "lowerLimbs",
    frame: "frame"
});

/** The penalty a malfunctioning component puts on the rolls it touches. */
const FAILURE_PENALTY = -2;

/**
 * The attack penalties a weapon picks up from the mount it is on.
 *
 * An inoperable mount gives no penalty because its weapons cannot be fired at
 * all - see {@link weaponUsable}.
 *
 * @param {Object<string, string>} statuses Effective status by component.
 * @param {string} slot The weapon's mount.
 * @returns {Array<{component: string, value: number}>} The penalties to apply.
 */
export function weaponPenalties(statuses = {}, slot) {
    const component = SLOT_COMPONENT[slot];
    if (!component) return [];
    if (statuses[component] !== "malfunctioning") return [];

    return [{ component, value: FAILURE_PENALTY }];
}

/**
 * Whether a weapon on this mount can be fired.
 *
 * @param {Object<string, string>} statuses Effective status by component.
 * @param {string} slot The weapon's mount.
 * @returns {boolean} False only when the mount is inoperable.
 */
export function weaponUsable(statuses = {}, slot) {
    const component = SLOT_COMPONENT[slot];
    if (!component) return true;

    return statuses[component] !== "inoperable";
}

/**
 * The penalty on a combat maneuver that does not use a mech weapon.
 *
 * @param {Object<string, string>} statuses Effective status by component.
 * @returns {number} -2 when the upper limbs are malfunctioning, 0 otherwise.
 */
export function maneuverPenalty(statuses = {}) {
    return statuses.upperLimbs === "malfunctioning" ? FAILURE_PENALTY : 0;
}

/** What each failed status costs to overcome, and what buying it grants. */
const OVERCOME_BY_STATUS = Object.freeze({
    malfunctioning: Object.freeze({ ppCost: 2, override: "ignored" }),
    inoperable: Object.freeze({ ppCost: 4, override: "downgraded" })
});

/**
 * The Power Point actions to offer for the failures this mech is carrying.
 *
 * One per failed component, and none at all for a mech in working order. The
 * statuses passed in are the effective ones, so a component already overcome
 * this turn is not offered a second time.
 *
 * @param {Object<string, string>} statuses Effective status by component.
 * @returns {Array<{component: string, status: string, ppCost: number, override: string}>} The actions to show.
 */
export function overcomeActions(statuses = {}) {
    return Object.entries(statuses)
        .filter(([, status]) => isFailed(status))
        .map(([component, status]) => ({ component, status, ...OVERCOME_BY_STATUS[status] }));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/module/rules/mech-system-effects.test.js`
Expected: PASS, 30 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `upperLimb: "upperLimbs"` to `upperLimb: "frame"` in `SLOT_COMPONENT` | penalizes an upper-limb weapon; maps every mount slot |
| Add `locker: "frame"` to `SLOT_COMPONENT` | weapon in the locker (both tests) |
| `FAILURE_PENALTY = -2` to `-1` | penalizes an upper-limb weapon |
| `!== "malfunctioning"` to `!== "nominal"` | penalizes an upper-limb weapon |
| Change the check to `isFailed(statuses[component])` | no penalty for an inoperable mount |
| `!component` early return removed in `weaponPenalties` | weapon in the locker |
| `!== "inoperable"` to `!== "malfunctioning"` in `weaponUsable` | lets a weapon on a malfunctioning mount fire |
| `!component` early return removed in `weaponUsable` | weapon in the locker fires |
| `statuses.upperLimbs` to `statuses.frame` in `maneuverPenalty` | penalizes combat maneuvers |
| `ppCost: 2` to `4` | offers the 2 PP action |
| `override: "downgraded"` to `"ignored"` | offers the 4 PP action |
| `.filter(([, status]) => isFailed(status))` removed | offers nothing to a working mech; one for each failed component |

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/module/rules/mech-system-effects.js src/module/rules/mech-system-effects.test.js
git commit -m "Work out the attack penalties and overcoming actions a failure brings"
```

---

## Task 5: The one-off effects at a status change

**Files:**
- Create: `src/module/rules/mech-system-transitions.js`
- Test: `src/module/rules/mech-system-transitions.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `powerCoreLoss(status) -> string|null`, `cockpitVictimCount(operatorCount, status) -> number`, `cockpitDamage(tier) -> string`, `cockpitSaveDC(tier) -> number`, `auxiliarySelection(count) -> string|null`, `auxiliaryToDisable(systems, roll) -> object|null`, `chanceFailed(roll, chance) -> boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/module/rules/mech-system-transitions.test.js`:

```js
import { describe, expect, it } from "vitest";
import {
    auxiliarySelection,
    auxiliaryToDisable,
    chanceFailed,
    cockpitDamage,
    cockpitSaveDC,
    cockpitVictimCount,
    powerCoreLoss
} from "./mech-system-transitions.js";

describe("powerCoreLoss", () => {
    it("costs Power Points when the core first malfunctions", () => {
        expect(powerCoreLoss("malfunctioning")).toBe("1d4");
    });

    it("costs Power Points again when the core becomes inoperable", () => {
        expect(powerCoreLoss("inoperable")).toBe("1d4");
    });

    it("costs nothing for a core still working", () => {
        expect(powerCoreLoss("nominal")).toBeNull();
    });
});

describe("cockpitVictimCount", () => {
    it("hits half the operators, rounded up, when the cockpit malfunctions", () => {
        expect(cockpitVictimCount(3, "malfunctioning")).toBe(2);
    });

    it("rounds up from an even crew too", () => {
        expect(cockpitVictimCount(4, "malfunctioning")).toBe(2);
    });

    it("hits every operator when the cockpit is inoperable", () => {
        expect(cockpitVictimCount(3, "inoperable")).toBe(3);
    });

    it("hits nobody when the cockpit is working", () => {
        expect(cockpitVictimCount(3, "nominal")).toBe(0);
    });

    it("hits nobody in an empty cockpit", () => {
        expect(cockpitVictimCount(0, "inoperable")).toBe(0);
    });
});

describe("cockpit damage and save", () => {
    it("rolls a die per tier", () => {
        expect(cockpitDamage(4)).toBe("4d8");
    });

    it("rolls one die for a tier 1 mech", () => {
        expect(cockpitDamage(1)).toBe("1d8");
    });

    it("sets the save at 15 plus half the tier", () => {
        expect(cockpitSaveDC(6)).toBe(18);
    });

    it("rounds the half tier down", () => {
        expect(cockpitSaveDC(5)).toBe(17);
    });
});

describe("auxiliarySelection", () => {
    it("sizes the die to the systems on offer", () => {
        expect(auxiliarySelection(3)).toBe("1d3");
    });

    it("still rolls a die for a mech carrying one system", () => {
        expect(auxiliarySelection(1)).toBe("1d1");
    });

    it("offers no roll when the mech carries no auxiliary systems", () => {
        expect(auxiliarySelection(0)).toBeNull();
    });
});

describe("auxiliaryToDisable", () => {
    const systems = [{ id: "a" }, { id: "b" }, { id: "c" }];

    it("takes the first system on a 1", () => {
        expect(auxiliaryToDisable(systems, 1)).toEqual({ id: "a" });
    });

    it("takes the last system on the top face", () => {
        expect(auxiliaryToDisable(systems, 3)).toEqual({ id: "c" });
    });

    it("takes nothing for a roll off the end of the list", () => {
        expect(auxiliaryToDisable(systems, 4)).toBeNull();
    });

    it("takes nothing from an empty list", () => {
        expect(auxiliaryToDisable([], 1)).toBeNull();
    });
});

describe("chanceFailed", () => {
    it("fails on a roll at the chance", () => {
        expect(chanceFailed(25, 25)).toBe(true);
    });

    it("succeeds on the roll just past it", () => {
        expect(chanceFailed(26, 25)).toBe(false);
    });

    it("fails on the low half against a 50% chance", () => {
        expect(chanceFailed(50, 50)).toBe(true);
        expect(chanceFailed(51, 50)).toBe(false);
    });

    it("never fails when there is no chance to", () => {
        expect(chanceFailed(1, 0)).toBe(false);
    });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/module/rules/mech-system-transitions.test.js`
Expected: FAIL — cannot resolve `./mech-system-transitions.js`.

- [ ] **Step 3: Write the implementation**

Create `src/module/rules/mech-system-transitions.js`:

```js
/**
 * The effects that fire once, at the moment a component's status changes.
 *
 * Nothing here rolls. Each function either names a formula for the Foundry layer
 * to put on a card as a button, or reads a result that came back from one.
 */

/** What a power core costs its mech each time it fails further. */
const POWER_CORE_LOSS = "1d4";

/**
 * The Power Points a mech loses when its power core fails further.
 *
 * @param {string} status The status the core has just taken on.
 * @returns {string|null} The formula to roll, or null when nothing is lost.
 */
export function powerCoreLoss(status) {
    if (status === "malfunctioning" || status === "inoperable") return POWER_CORE_LOSS;

    return null;
}

/**
 * How many operators a cockpit failure hurts.
 *
 * @param {number} operatorCount How many operators are aboard.
 * @param {string} status The status the cockpit has just taken on.
 * @returns {number} The number of operators affected.
 */
export function cockpitVictimCount(operatorCount, status) {
    const aboard = Math.max(Number(operatorCount) || 0, 0);
    if (status === "inoperable") return aboard;
    if (status === "malfunctioning") return Math.ceil(aboard / 2);

    return 0;
}

/**
 * The bludgeoning damage a cockpit failure deals to one operator.
 *
 * @param {number} tier The mech's tier.
 * @returns {string} The damage formula.
 */
export function cockpitDamage(tier) {
    return `${Math.max(Number(tier) || 0, 1)}d8`;
}

/**
 * The Reflex DC to halve a cockpit failure's damage.
 *
 * @param {number} tier The mech's tier.
 * @returns {number} The save DC.
 */
export function cockpitSaveDC(tier) {
    return 15 + Math.floor(Math.max(Number(tier) || 0, 0) / 2);
}

/**
 * The die that picks which auxiliary system stops working.
 *
 * A mech with one auxiliary system still gets a die rather than a silent choice,
 * so every random outcome on the card reads the same way.
 *
 * @param {number} count How many auxiliary systems the mech carries.
 * @returns {string|null} The formula to roll, or null when there is nothing to pick from.
 */
export function auxiliarySelection(count) {
    const systems = Math.max(Number(count) || 0, 0);
    if (systems < 1) return null;

    return `1d${systems}`;
}

/**
 * The auxiliary system a selection roll names.
 *
 * @param {Array} systems The mech's auxiliary systems, in the order the die counts them.
 * @param {number} roll The result of {@link auxiliarySelection}'s die.
 * @returns {object|null} The system that stops working, or null for a roll it cannot name.
 */
export function auxiliaryToDisable(systems, roll) {
    const index = Number(roll) - 1;
    if (!Number.isInteger(index) || index < 0) return null;

    return systems?.[index] ?? null;
}

/**
 * Whether a percentage check came up as a failure.
 *
 * The die is a d100 and the chance is the share of its faces that fail, so a
 * 25% chance fails on 1 through 25.
 *
 * @param {number} roll The d100 result.
 * @param {number} chance The chance in a hundred of failing.
 * @returns {boolean} True when the system did not work.
 */
export function chanceFailed(roll, chance) {
    const value = Number(roll);
    const threshold = Number(chance) || 0;
    if (threshold <= 0) return false;

    return Number.isFinite(value) && value <= threshold;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/module/rules/mech-system-transitions.test.js`
Expected: PASS, 22 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `POWER_CORE_LOSS = "1d4"` to `"1d6"` | costs Power Points when the core first malfunctions |
| Drop `\|\| status === "inoperable"` | costs Power Points again |
| `return null` to `return POWER_CORE_LOSS` in `powerCoreLoss` | costs nothing for a working core |
| `Math.ceil` to `Math.floor` | hits half the operators, rounded up |
| Swap the `inoperable` and `malfunctioning` branches | hits every operator |
| `d8` to `d6` in `cockpitDamage` | rolls a die per tier |
| `Math.max(Number(tier) || 0, 1)` to `Number(tier) || 0` | rolls one die for a tier 1 mech (change the test's tier to 0 first, confirm, then revert both) |
| `15 +` to `10 +` | sets the save at 15 plus half the tier |
| `Math.floor` to `Math.ceil` in `cockpitSaveDC` | rounds the half tier down |
| `systems < 1` to `systems < 2` | still rolls a die for one system |
| `return null` in `auxiliarySelection` to `return "1d1"` | offers no roll for no systems |
| `Number(roll) - 1` to `Number(roll)` | takes the first system on a 1 |
| `?? null` to `?? systems[0]` | roll off the end of the list |
| `value <= threshold` to `value < threshold` | fails on a roll at the chance |
| `threshold <= 0` line removed | never fails when there is no chance |

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add src/module/rules/mech-system-transitions.js src/module/rules/mech-system-transitions.test.js
git commit -m "Work out what a mech loses the moment a component fails"
```

---

## Task 6: Prove the rules modules never roll

**Files:**
- Create: `src/module/rules/no-rolling.test.js`

**Interfaces:**
- Consumes: the three rules modules from Tasks 1-5.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

Create `src/module/rules/no-rolling.test.js`:

```js
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The rules modules decide; the Foundry layer rolls. A rules module reaching for
 * Roll would put a random outcome behind the player's back, which is exactly
 * what the mech failure cards exist to avoid - and it would make the module
 * untestable without Foundry loaded.
 */
const RULES_DIR = dirname(fileURLToPath(import.meta.url));

/** Foundry globals a pure rules module has no business touching. */
const FORBIDDEN = [/\bnew Roll\b/, /\bRoll\.create\b/, /\bgame\./, /\bCONFIG\./, /\bChatMessage\b/, /\bui\.notifications\b/];

function ruleModules() {
    return readdirSync(RULES_DIR)
        .filter(name => name.endsWith(".js") && !name.endsWith(".test.js"));
}

describe("rules modules", () => {
    it("has rules modules to check", () => {
        expect(ruleModules().length).toBeGreaterThan(0);
    });

    for (const name of ruleModules()) {
        it(`${name} decides without rolling or reaching into Foundry`, () => {
            const source = readFileSync(join(RULES_DIR, name), "utf8");
            const found = FORBIDDEN.filter(pattern => pattern.test(source)).map(String);

            expect(found).toEqual([]);
        });
    }
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/module/rules/no-rolling.test.js`
Expected: PASS if the existing modules are clean. If any existing module fails, do not weaken the test — report which module and which pattern, and stop for review.

- [ ] **Step 3: Prove the test can fail**

Temporarily add `const unused = new Roll("1d4");` to the top of `src/module/rules/mech-system-failure.js`, run the test, confirm `mech-system-failure.js decides without rolling` fails, then remove the line and re-run to green.

- [ ] **Step 4: Commit**

```bash
npm run lint
git add src/module/rules/no-rolling.test.js
git commit -m "Fail the build if a rules module rolls a die"
```

---

## Task 7: The cockpit component

**Files:**
- Modify: `src/module/data/actor/mech.mjs:253-273`
- Modify: `static/templates/actors/mech-sheet-full.hbs:272-312`
- Modify: `static/lang/en.json`, `de.json`, `es.json`, `fr.json`, `it.json`, `ja.json`, `pt-BR.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `system.attributes.systems.cockpit.value` on every mech.

- [ ] **Step 1: Add the field**

In `src/module/data/actor/mech.mjs`, inside the `systems: new fields.SchemaField({...})` block, after the `auxSystem` entry:

```js
                    auxSystem: new fields.SchemaField(
                        SFRPGActorMech._mechSystemFieldData(),
                        {label: "SFRPG.MechSheet.Systems.AuxSystem"}
                    ),
                    cockpit: new fields.SchemaField(
                        SFRPGActorMech._mechSystemFieldData(),
                        {label: "SFRPG.MechSheet.Systems.Cockpit"}
                    )
```

- [ ] **Step 2: Add the label to every language file**

In each of the seven `static/lang/*.json`, inside `SFRPG.MechSheet.Systems`, add `"Cockpit"` alphabetically after `"AuxSystem"`. English value: `"Cockpit"`. For the other six, use the same English word — a translator can replace it later; leaving the key out entirely would render the raw key on the sheet.

- [ ] **Step 3: Add the dropdown**

In `static/templates/actors/mech-sheet-full.hbs`, after the `auxSystem` form group, add:

```hbs
                        <div class="form-group">
                            <label>{{ localize "SFRPG.MechSheet.Systems.Cockpit" }}</label>
                            <div class="form-fields">
                                <select name="system.attributes.systems.cockpit.value">
                                    {{selectOptions (sfrpg "mechSystemStatus") selected=system.attributes.systems.cockpit.value localize=true}}
                                </select>
                            </div>
                        </div>
```

- [ ] **Step 4: Confirm the language files still parse**

Run: `node -e "for (const f of require('fs').readdirSync('static/lang')) JSON.parse(require('fs').readFileSync('static/lang/'+f,'utf8'))"`
Expected: no output, exit 0.

- [ ] **Step 5: Confirm the whole suite is still green**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/module/data/actor/mech.mjs static/templates/actors/mech-sheet-full.hbs static/lang
git commit -m "Give a mech a cockpit alongside its five other components"
```

---

## Task 8: Overkill, so a wrecked mech can be destroyed

**Files:**
- Modify: `src/module/actor/mixins/actor-damage.js:440-450`
- Test: covered by Task 1's `damageState` tests plus the manual check below.

**Interfaces:**
- Consumes: nothing.
- Produces: `flags.sfrpg.overkill` on a mech, a running total of damage dealt past zero Hit Points.

- [ ] **Step 1: Read the surrounding code**

Open `src/module/actor/mixins/actor-damage.js` and find, inside `_applyActorDamage`:

```js
            /** Update hitpoints */
            const newHP = Math.clamp(originalHP - remainingUndealtDamage, 0, actorData.attributes.hp.max);
            remainingUndealtDamage -= (originalHP - newHP);

            actorUpdate["system.attributes.hp.value"] = newHP;
```

- [ ] **Step 2: Add the mech branch immediately after that block**

```js
            // A mech that takes more than twice its Hit Points is destroyed and
            // cannot be repaired, but the clamp above throws away the damage past
            // zero that the count depends on. Keep it, so the state can be worked
            // out however long the beating takes.
            if (this.type === "mech" && remainingUndealtDamage > 0) {
                const overkill = (this.getFlag("sfrpg", "overkill") || 0) + remainingUndealtDamage;
                actorUpdate["flags.sfrpg.overkill"] = overkill;
            }
```

- [ ] **Step 3: Confirm nothing else broke**

Run: `npm test && npm run lint`
Expected: all pass, no new warnings.

- [ ] **Step 4: Verify in Foundry**

Build and install (see Global Constraints), open the Mechageddon world, and apply damage to Test Mech 1 larger than its remaining Hit Points. In the console, `game.actors.getName("Test Mech 1").getFlag("sfrpg", "overkill")` must show the amount past zero. Apply damage again and confirm it accumulates. Then reset: `await game.actors.getName("Test Mech 1").unsetFlag("sfrpg", "overkill")` and restore its Hit Points.

- [ ] **Step 5: Commit**

```bash
git add src/module/actor/mixins/actor-damage.js
git commit -m "Keep the damage a wrecked mech takes past zero Hit Points"
```

---

## Task 9: The failure card and its 1d20

**Files:**
- Create: `src/module/system/mech-failure-link.js`
- Create: `src/module/system/mech-failure-link.test.js`
- Create: `static/templates/chat/mech-failure-card.hbs`
- Modify: `src/sfrpg.js`
- Modify: `static/lang/*.json`

**Interfaces:**
- Consumes: `componentForRoll`, `nextStatus`, `failuresTriggered` from `mech-system-failure.js`; `promoteDiceLink` from `mech-dice-link.js`.
- Produces: `failureRecipients(users, actor) -> string[]`, `spendFailureLink(content, action) -> string`, `onMechFailureRollClick(event) -> Promise<string|null>` (the component chosen, or null), and the `mechFailureRoll` click binding.

- [ ] **Step 1: Write the failing test**

Create `src/module/system/mech-failure-link.test.js`:

```js
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { SPENT_CLASS, failureRecipients, spendFailureLink } from "./mech-failure-link.js";

/** A failure card as it is stored, with its 1d20 still unrolled. */
function card(action = "mechFailureRoll") {
    return `<div class="mech-failure"><p>Roll for the component: `
        + `<a class="enriched-link" data-action="${action}" data-formula="1d20">1d20</a></p></div>`;
}

describe("spendFailureLink", () => {
    it("unbinds the link, so a reload does not hand the roll back", () => {
        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(card(), "mechFailureRoll");

        expect(spent.querySelector("a[data-action]")).toBeNull();
    });

    it("marks the link spent, so it greys out for everyone rendering the card", () => {
        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(card(), "mechFailureRoll");

        expect(spent.querySelector(`a.${SPENT_CLASS}`)).not.toBeNull();
    });

    it("leaves a different button on the card still clickable", () => {
        const both = card("mechFailureRoll").replace("</div>",
            '<p><a data-action="mechCockpitSave" data-formula="1d20">Reflex</a></p></div>');

        const spent = document.createElement("div");
        spent.innerHTML = spendFailureLink(both, "mechFailureRoll");

        expect(spent.querySelector('a[data-action="mechCockpitSave"]')).not.toBeNull();
    });

    // The caller writes to the message only when this returns something different,
    // so a card with no such link has to come back as the same string rather than a
    // re-serialized copy. The unclosed tag makes the difference visible.
    it("returns a card holding no such link unchanged", () => {
        const content = "<p>Nothing to roll here.";

        expect(spendFailureLink(content, "mechFailureRoll")).toBe(content);
    });
});

describe("failureRecipients", () => {
    function world(owners) {
        const users = [
            { id: "gm", isGM: true },
            { id: "pilot", isGM: false },
            { id: "bystander", isGM: false }
        ];
        const actor = { testUserPermission: (user) => owners.includes(user.id) };
        return { users, actor };
    }

    it("tells the GM, who is running the fight", () => {
        const { users, actor } = world([]);

        expect(failureRecipients(users, actor)).toContain("gm");
    });

    it("tells the mech's owner, whose mech is coming apart", () => {
        const { users, actor } = world(["pilot"]);

        expect(failureRecipients(users, actor)).toContain("pilot");
    });

    it("leaves out a player with no claim on the mech", () => {
        const { users, actor } = world(["pilot"]);

        expect(failureRecipients(users, actor)).not.toContain("bystander");
    });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/module/system/mech-failure-link.test.js`
Expected: FAIL — cannot resolve `./mech-failure-link.js`.

- [ ] **Step 3: Write the module**

Create `src/module/system/mech-failure-link.js`. Write the two tested functions first, exactly as below, plus the click handler beneath them:

```js
import { componentForRoll, nextStatus } from "../rules/mech-system-failure.js";
import { RPC } from "../rpc.js";

/** The class marking a button whose roll has already been made. */
export const SPENT_CLASS = "replenish-spent";

/**
 * Who sees a mech's system failure.
 *
 * The same audience as the regeneration and Replenish messages: the mech's
 * owners, who have to act on it, and every GM.
 *
 * @param {Iterable<{id: string, isGM: boolean}>} users The users in the world.
 * @param {{testUserPermission: Function}} actor The mech that failed.
 * @returns {string[]} The ids to whisper to.
 */
export function failureRecipients(users, actor) {
    return [...users]
        .filter(user => user.isGM || actor.testUserPermission(user, "OWNER"))
        .map(user => user.id);
}

/**
 * Mark one of a card's buttons as already rolled.
 *
 * The card is stored HTML that every viewer renders, so the spent state is
 * written into that HTML rather than onto the clicked element. A button that
 * keeps its `data-action` would be picked up by the handler again after a
 * reload, so the action comes off and the class that greys it out goes on.
 *
 * Only the named action is spent; a card carrying several buttons keeps the
 * others live.
 *
 * @param {string} content The card's stored HTML.
 * @param {string} action The `data-action` to spend.
 * @returns {string} The HTML with that button spent, unchanged if it holds none.
 */
export function spendFailureLink(content, action) {
    const root = document.createElement("div");
    root.innerHTML = content ?? "";

    const link = root.querySelector(`a[data-action="${action}"]`);
    if (!link) return content;

    delete link.dataset.action;
    link.classList.add(SPENT_CLASS);

    return root.innerHTML;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/module/system/mech-failure-link.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `delete link.dataset.action` removed | unbinds the link |
| `link.classList.add(SPENT_CLASS)` removed | marks the link spent |
| Selector to `a[data-action]` | leaves a different button clickable |
| `if (!link) return content` removed | card holding no such link |
| `user.isGM \|\|` removed | tells the GM |
| `actor.testUserPermission(user, "OWNER")` to `false` | tells the mech's owner |
| The filter removed entirely | leaves out a bystander |

- [ ] **Step 6: Commit the tested half**

```bash
npm run lint
git add src/module/system/mech-failure-link.js src/module/system/mech-failure-link.test.js
git commit -m "Whisper a mech's system failure and spend its buttons once"
```

- [ ] **Step 7: Add the card template**

Create `static/templates/chat/mech-failure-card.hbs`:

```hbs
<div class="sfrpg chat-card mech-failure" data-actor-uuid="{{actorUuid}}">
    <header class="card-header flexrow">
        <img src="{{img}}" alt="{{name}}" width="36" height="36" />
        <h3>{{localize "SFRPG.MechSheet.SystemFailure.Title"}}</h3>
    </header>
    <div class="card-content">
        <p>{{{prompt}}}</p>
        {{#if outcome}}<p class="mech-failure-outcome">{{{outcome}}}</p>{{/if}}
    </div>
</div>
```

- [ ] **Step 8: Add the strings**

To every `static/lang/*.json`, under `SFRPG.MechSheet`, add a `SystemFailure` block. English:

```json
            "SystemFailure": {
                "Title": "System Failure",
                "Prompt": "{name} has suffered a system failure. Roll {formula} to see which component.",
                "RollTooltip": "Roll {formula} to determine the component that failed.",
                "Result": "{component} is now {status}.",
                "NoMech": "The mech this failure belongs to is no longer available.",
                "NotOwner": "You do not have permission to roll for this mech."
            }
```

Copy the same English values into the other six files.

- [ ] **Step 9: Write the click handler**

Append to `src/module/system/mech-failure-link.js`:

```js
/**
 * Handle a click on a failure card's 1d20, choosing and applying the component.
 *
 * Nothing has happened to the mech until this is pressed. The card names the
 * mech by uuid rather than id so an unlinked token's own copy fails rather than
 * the base actor.
 *
 * @param {Event} event The click event.
 * @returns {Promise<string|null>} The component that failed, or null if nothing was rolled.
 */
export async function onMechFailureRollClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    if (link.classList.contains(SPENT_CLASS)) return null;

    const card = link.closest("[data-actor-uuid]");
    const actor = card?.dataset.actorUuid ? await fromUuid(card.dataset.actorUuid) : null;

    if (!actor || actor.type !== "mech") {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.SystemFailure.NoMech"));
        return null;
    }

    if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.SystemFailure.NotOwner"));
        return null;
    }

    const roll = await new Roll(link.dataset.formula).evaluate();
    const component = componentForRoll(roll.total);
    if (!component) return null;

    const status = nextStatus(actor.system.attributes.systems[component]?.value);
    await actor.update({ [`system.attributes.systems.${component}.value`]: status });

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format("SFRPG.MechSheet.SystemFailure.Result", {
            component: game.i18n.localize(`SFRPG.MechSheet.Systems.${COMPONENT_LABELS[component]}`),
            status: game.i18n.localize(CONFIG.SFRPG.mechSystemStatus[status])
        }),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });

    await markSpent(card, "mechFailureRoll");

    return component;
}

/** The label key suffix for each component, as `SFRPG.MechSheet.Systems.*` names them. */
const COMPONENT_LABELS = {
    upperLimbs: "UpperLimbs",
    lowerLimbs: "LowerLimbs",
    frame: "Frame",
    auxSystem: "AuxSystem",
    powerCore: "PowerCore",
    cockpit: "Cockpit"
};

/**
 * Write a button's spent state back to the card it belongs to.
 *
 * Updating a chat message is the author's or the GM's to do, so a player
 * clicking a card someone else posted asks the GM to make the change.
 *
 * @param {Element} card The rendered chat card.
 * @param {string} action The `data-action` that was pressed.
 * @returns {Promise<void>}
 */
async function markSpent(card, action) {
    const messageId = card?.closest("[data-message-id]")?.dataset.messageId;
    const message = messageId ? game.messages.get(messageId) : null;
    if (!message) return;

    const content = spendFailureLink(message.content, action);
    if (content === message.content) return;

    if (game.user.isGM || message.isAuthor) {
        await message.update({ content });
        return;
    }

    RPC.sendMessageTo("gm", "spendMechFailure", { messageId: message.id, content });
}

/**
 * Spend a card on behalf of a player who cannot update it themselves.
 *
 * @param {object} message The RPC message.
 * @returns {Promise<void>}
 */
export async function onSpendMechFailure(message) {
    const target = game.messages.get(message.payload?.messageId);
    if (!target) return;

    await target.update({ content: message.payload.content });
}
```

- [ ] **Step 10: Post the card from the damage hook**

In `src/sfrpg.js`, add the imports beside the existing mech ones:

```js
import { damageState, failuresTriggered } from "./module/rules/mech-system-failure.js";
import { onMechFailureRollClick, onSpendMechFailure, failureRecipients } from "./module/system/mech-failure-link.js";
```

Register the handler beside the existing two, near line 707:

```js
    $("body").on("click", 'a[data-action="mechFailureRoll"]', onMechFailureRollClick);
```

Register the RPC callback beside `spendMechReplenish`, near line 679:

```js
    RPC.registerCallback("spendMechFailure", "gm", onSpendMechFailure);
```

Add the hook at the end of the file:

```js
// A mech's components fail as it takes damage. The thresholds are checked here
// rather than inside applyDamage because a mech's Hit Points also change from a
// GM typing in the box and from any module that writes them.
Hooks.on("updateActor", async (actor, changes) => {
    if (!game.users.activeGM?.isSelf) return;
    if (actor.type !== "mech") return;

    const value = foundry.utils.getProperty(changes, "system.attributes.hp.value");
    if (value === undefined) return;

    const max = actor.system.attributes.hp.max;
    const previousValue = value + (actor._sfrpgHpDelta ?? 0);
    const fired = actor.getFlag("sfrpg", "systemFailures") ?? [];

    const triggered = failuresTriggered({ value, previousValue, max, fired });
    if (triggered.length === 0) return;

    await actor.setFlag("sfrpg", "systemFailures", [...fired, ...triggered]);

    for (const threshold of triggered) {
        await postFailureCard(actor, threshold);
    }
});
```

The previous value is not on `changes`. Take it from the pre-update hook instead — add above the handler:

```js
// updateActor sees only the new value, so the old one is captured on the way in.
Hooks.on("preUpdateActor", (actor, changes) => {
    const value = foundry.utils.getProperty(changes, "system.attributes.hp.value");
    if (value === undefined) return;

    actor._sfrpgPreviousHp = actor.system.attributes.hp.value;
});
```

and read `const previousValue = actor._sfrpgPreviousHp ?? value;` in place of the `_sfrpgHpDelta` line.

- [ ] **Step 11: Add the card-posting helper**

In `src/sfrpg.js`, above the hook:

```js
/**
 * Post the card that hands a mech's owner the roll for a system failure.
 *
 * Nothing about the mech changes here. The component is not chosen until the
 * 1d20 on the card is pressed, so an unresolved failure stays visible in chat.
 *
 * @param {Actor} actor The mech that failed.
 * @param {string} threshold Which Hit Point threshold brought it on.
 * @returns {Promise<ChatMessage>} The card.
 */
async function postFailureCard(actor, threshold) {
    const formula = "1d20";
    const prompt = game.i18n.format("SFRPG.MechSheet.SystemFailure.Prompt", { name: actor.name, formula });
    const tooltip = game.i18n.format("SFRPG.MechSheet.SystemFailure.RollTooltip", { formula });
    const button = `<a class="enriched-link" data-action="mechFailureRoll" data-formula="${formula}" `
        + `data-threshold="${threshold}" data-tooltip="${tooltip}">${formula}</a>`;

    const content = await foundry.applications.handlebars.renderTemplate(
        "systems/sfrpg/templates/chat/mech-failure-card.hbs",
        {
            actorUuid: actor.uuid,
            img: actor.img,
            name: actor.name,
            prompt: prompt.replace(formula, button)
        }
    );

    return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content,
        whisper: failureRecipients(game.users, actor)
    });
}
```

- [ ] **Step 12: Confirm the suite is green and build**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 13: Verify in Foundry**

Install the build. In the Mechageddon world, damage Test Mech 1 below two-thirds of its maximum Hit Points. Confirm: a whispered card appears with a clickable `1d20`; a player who does not own the mech does not see it; clicking rolls, posts the result naming a component and its new condition, sets that component's dropdown on the sheet, and greys the button out; reloading leaves it greyed. Damage it below one-third and confirm a second card. Reset afterwards: restore Hit Points and set every dropdown back to Nominal, then `await game.actors.getName("Test Mech 1").unsetFlag("sfrpg", "systemFailures")`, and delete the cards created.

- [ ] **Step 14: Commit**

```bash
git add src/sfrpg.js src/module/system/mech-failure-link.js static/templates/chat/mech-failure-card.hbs static/lang
git commit -m "Hand a mech's owner the roll that picks the failed component"
```

---

## Task 10: The one-off effects on the card

**Files:**
- Modify: `src/module/system/mech-failure-link.js`
- Modify: `static/lang/*.json`
- Test: `src/module/system/mech-failure-link.test.js`

**Interfaces:**
- Consumes: `powerCoreLoss`, `cockpitVictimCount`, `cockpitDamage`, `cockpitSaveDC`, `auxiliarySelection`, `auxiliaryToDisable` from `mech-system-transitions.js`.
- Produces: `transitionButtons({component, status, tier, operatorCount, auxiliaryCount}) -> Array<{action: string, formula: string, label: string}>`, and the click handlers `onMechPowerCoreLossClick`, `onMechCockpitSaveClick`, `onMechAuxiliaryPickClick`.

- [ ] **Step 1: Write the failing test**

Append to `src/module/system/mech-failure-link.test.js`:

```js
import { transitionButtons } from "./mech-failure-link.js";

describe("transitionButtons", () => {
    const mech = { tier: 4, operatorCount: 3, auxiliaryCount: 2 };

    it("offers no button for a component whose failure costs nothing extra", () => {
        expect(transitionButtons({ component: "upperLimbs", status: "malfunctioning", ...mech })).toEqual([]);
    });

    it("offers the Power Point loss when the core fails", () => {
        const buttons = transitionButtons({ component: "powerCore", status: "malfunctioning", ...mech });

        expect(buttons).toEqual([{ action: "mechPowerCoreLoss", formula: "1d4", index: 0 }]);
    });

    it("offers one save per affected operator when the cockpit malfunctions", () => {
        const buttons = transitionButtons({ component: "cockpit", status: "malfunctioning", ...mech });

        expect(buttons).toEqual([
            { action: "mechCockpitSave", formula: "4d8", index: 0 },
            { action: "mechCockpitSave", formula: "4d8", index: 1 }
        ]);
    });

    it("offers a save for every operator when the cockpit is inoperable", () => {
        const buttons = transitionButtons({ component: "cockpit", status: "inoperable", ...mech });

        expect(buttons).toHaveLength(3);
    });

    it("offers the selection roll only when the auxiliary component becomes inoperable", () => {
        expect(transitionButtons({ component: "auxSystem", status: "malfunctioning", ...mech })).toEqual([]);
        expect(transitionButtons({ component: "auxSystem", status: "inoperable", ...mech }))
            .toEqual([{ action: "mechAuxiliaryPick", formula: "1d2", index: 0 }]);
    });

    it("offers no selection roll to a mech carrying no auxiliary systems", () => {
        expect(transitionButtons({ component: "auxSystem", status: "inoperable", ...mech, auxiliaryCount: 0 }))
            .toEqual([]);
    });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/module/system/mech-failure-link.test.js`
Expected: FAIL — `transitionButtons is not a function`.

- [ ] **Step 3: Implement**

Append to `src/module/system/mech-failure-link.js`, with the import added at the top:

```js
import {
    auxiliarySelection,
    cockpitDamage,
    cockpitVictimCount,
    powerCoreLoss
} from "../rules/mech-system-transitions.js";

/**
 * The buttons a component's new condition puts on the failure card.
 *
 * Every one of them is a die somebody has to press. A component whose failure
 * costs nothing at the moment it happens gets none.
 *
 * @param {object} options
 * @param {string} options.component The component that failed.
 * @param {string} options.status The status it has taken on.
 * @param {number} options.tier The mech's tier.
 * @param {number} options.operatorCount How many operators are aboard.
 * @param {number} options.auxiliaryCount How many auxiliary systems the mech carries.
 * @returns {Array<{action: string, formula: string, index: number}>} The buttons to add.
 */
export function transitionButtons({ component, status, tier = 0, operatorCount = 0, auxiliaryCount = 0 } = {}) {
    if (component === "powerCore") {
        const formula = powerCoreLoss(status);
        return formula ? [{ action: "mechPowerCoreLoss", formula, index: 0 }] : [];
    }

    if (component === "cockpit") {
        const formula = cockpitDamage(tier);
        return Array.from(
            { length: cockpitVictimCount(operatorCount, status) },
            (unused, index) => ({ action: "mechCockpitSave", formula, index })
        );
    }

    if (component === "auxSystem" && status === "inoperable") {
        const formula = auxiliarySelection(auxiliaryCount);
        return formula ? [{ action: "mechAuxiliaryPick", formula, index: 0 }] : [];
    }

    return [];
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx vitest run src/module/system/mech-failure-link.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Mutation-check every test**

| Mutation | Test that must fail |
| --- | --- |
| `return []` at the end to `[{ action: "x", formula: "1d1", index: 0 }]` | offers no button for a component that costs nothing |
| `action: "mechPowerCoreLoss"` to `"mechCockpitSave"` | offers the Power Point loss |
| `cockpitVictimCount(operatorCount, status)` to `operatorCount` | one save per affected operator |
| `cockpitDamage(tier)` to `"1d8"` | one save per affected operator |
| `status === "inoperable"` to `isFailed(status)` in the auxiliary branch | selection roll only when inoperable |
| `formula ? ... : []` to always returning the button, in the auxiliary branch | no selection roll for no auxiliary systems |
| `(unused, index) => ({..., index })` to `index: 0` | one save per affected operator |

- [ ] **Step 6: Add the buttons to the card and write the three handlers**

In `onMechFailureRollClick`, after the status is written, append the transition buttons to the result message and register their handlers in `src/sfrpg.js` alongside `mechFailureRoll`:

```js
    $("body").on("click", 'a[data-action="mechPowerCoreLoss"]', onMechPowerCoreLossClick);
    $("body").on("click", 'a[data-action="mechCockpitSave"]', onMechCockpitSaveClick);
    $("body").on("click", 'a[data-action="mechAuxiliaryPick"]', onMechAuxiliaryPickClick);
```

Each handler follows the same shape as `onMechFailureRollClick`: refuse if spent, resolve the actor from the card's uuid, refuse a non-owner, roll the link's formula, apply the outcome, mark that one button spent with `markSpent(card, "<action>")`.

- **`onMechPowerCoreLossClick`** — subtract the roll from `system.attributes.pp.value`, floored at 0, and post the amount lost.
- **`onMechCockpitSaveClick`** — read the operator from `data-operator-uuid` on the link, roll that operator's Reflex save against `cockpitSaveDC(actor.system.details.tier)` using the operator's existing `rollSave("reflex")`, roll the link's damage formula, halve it on a success, apply it with `operator.applyDamage(...)`, and post both results.
- **`onMechAuxiliaryPickClick`** — resolve the mech's `mechAuxiliarySystem` items, take `auxiliaryToDisable(systems, roll.total)`, set `system.disabledByFailure: true` on that item, and post its name.

- [ ] **Step 7: Add the strings**

Add to `SFRPG.MechSheet.SystemFailure` in all seven language files:

```json
                "PowerCoreLoss": "{name} loses {amount} PP.",
                "PowerCoreLossTooltip": "Roll {formula} for the Power Points this failure costs.",
                "CockpitSave": "{operator} takes {amount} bludgeoning damage.",
                "CockpitSaveTooltip": "Roll {operator}'s Reflex save against DC {dc} and the damage.",
                "AuxiliaryDisabled": "{name} has stopped working.",
                "AuxiliaryPickTooltip": "Roll {formula} for the auxiliary system that stops working."
```

- [ ] **Step 8: Suite, build, verify, commit**

Run `npm test && npm run lint && npm run build`, install, and in Foundry drive a power core failure, a cockpit failure with two operators, and an auxiliary failure to inoperable. Confirm each button rolls once, applies its effect, greys out, and leaves the other buttons on the card live. Reset the mech and delete the cards.

```bash
git add src/module/system/mech-failure-link.js src/module/system/mech-failure-link.test.js src/sfrpg.js static/lang
git commit -m "Put each of a failure's costs behind its own button"
```

---

## Task 11: Apply the penalties to the mech's rolls

**Files:**
- Modify: `src/module/item/item.js:1240-1290` and the `_rollMechAttack` parts assembly near line 1326
- Modify: `src/module/rules/actions/actor/mech/calculate-mech-components.js:89-92` and `219-228`
- Modify: `src/sfrpg.js` (the `onAfterUpdateCombat` regeneration block near line 942)
- Test: `src/module/rules/mech-system-effects.test.js` (already covers the decisions)

**Interfaces:**
- Consumes: `effectiveSystems`, `weaponPenalties`, `weaponUsable`, `movementRate`, `hardnessRate`, `regenerationRate` from `mech-system-effects.js`.
- Produces: nothing new.

- [ ] **Step 1: Attack penalties**

In `src/module/item/item.js`, inside `_rollMechAttack`, beside the loop that pushes condition modifiers into `parts`:

```js
        // A malfunctioning mount makes its weapons harder to aim. An inoperable
        // one is handled before the roll starts - see the unusable check below.
        const statuses = effectiveSystems(
            this.actor?.system?.attributes?.systems,
            this.actor?.getFlag("sfrpg", "systemOverrides") ?? {}
        );
        for (const penalty of weaponPenalties(statuses, this.system.slot)) {
            parts.push({
                score: penalty.value,
                explanation: game.i18n.format("SFRPG.MechSheet.SystemFailure.AttackPenalty", {
                    component: game.i18n.localize(`SFRPG.MechSheet.Systems.${COMPONENT_LABELS[penalty.component]}`)
                })
            });
        }
```

- [ ] **Step 2: Refuse an unusable weapon**

At the top of `_rollMechAttack`, before any roll is built:

```js
        if (!weaponUsable(statuses, this.system.slot)) {
            ui.notifications.warn(game.i18n.format("SFRPG.MechSheet.SystemFailure.WeaponUnusable", {
                name: this.name,
                component: game.i18n.localize(`SFRPG.MechSheet.Systems.${COMPONENT_LABELS[SLOT_COMPONENT[this.system.slot]]}`)
            }));
            return null;
        }
```

Move the `statuses` calculation above this check so both use it.

- [ ] **Step 3: Movement and hardness**

In `calculate-mech-components.js`, after the hardness is derived at line 92:

```js
        // A damaged frame stops protecting the mech.
        data.attributes.hardness = Math.floor(data.attributes.hardness * hardnessRate(statuses.frame));
```

and after the lower limb speed modifiers are applied near line 228, scale each of `land`, `fly`, `swim` and `burrow` by `movementRate(statuses.lowerLimbs)`. Auxiliary system speed bonuses are added later in the same file (near line 379) and must not be scaled — apply the rate before that block runs.

- [ ] **Step 4: Regeneration throttle**

In `src/sfrpg.js`, inside the `onAfterUpdateCombat` handler, scale what `mechTurnRegen` grants:

```js
    // A damaged power core slows what comes back, and an inoperable one stops it.
    const statuses = effectiveSystems(
        actor.system.attributes.systems,
        actor.getFlag("sfrpg", "systemOverrides") ?? {}
    );
    const rate = regenerationRate(statuses.powerCore);
```

Multiply each granted amount by `rate` and floor it, treating a rate of 0 as no regeneration and no message.

- [ ] **Step 5: Add the strings**

```json
                "AttackPenalty": "{component} malfunctioning",
                "WeaponUnusable": "{name} cannot be fired: this mech's {component} are inoperable."
```

- [ ] **Step 6: Suite, build, verify, commit**

Run `npm test && npm run lint && npm run build`, install, then in Foundry set Test Mech 1's upper limbs to Malfunctioning and confirm an upper-limb weapon's attack card shows the −2 with its explanation while a frame weapon's does not; set them Inoperable and confirm the weapon refuses to roll with the warning; set the frame Malfunctioning and confirm the sheet's hardness halves; set the lower limbs Malfunctioning and confirm speeds halve, Inoperable and confirm they reach 0; set the power core Malfunctioning and step the initiative past the mech's turn to confirm the regeneration halves. Reset every dropdown afterwards.

```bash
git add src/module/item/item.js src/module/rules/actions/actor/mech/calculate-mech-components.js src/sfrpg.js static/lang
git commit -m "Apply a failed component's penalties to the mech's rolls and rates"
```

---

## Task 12: The overcoming actions

**Files:**
- Modify: `src/module/actor/mixins/actor-mech.js`
- Modify: `src/module/actor/sheet/mech.js:288-296`
- Modify: `static/templates/actors/mech-sheet-full.hbs:541-558`
- Modify: `src/sfrpg.js` (the `onAfterUpdateCombat` handler)
- Modify: `static/lang/*.json`

**Interfaces:**
- Consumes: `overcomeActions`, `effectiveSystems` from `mech-system-effects.js`.
- Produces: `SFRPGActor#useOvercomeAction(component)`.

- [ ] **Step 1: Add the actions to the sheet data**

In `src/module/actor/sheet/mech.js`, after `actionsTab.ppActions` is built:

```js
        // One entry per component currently carrying a system failure, and none
        // at all for a mech in working order. Built from the mech rather than
        // from the static action table, so they come and go with the damage.
        const statuses = effectiveSystems(
            actorData.attributes?.systems,
            this.actor.getFlag("sfrpg", "systemOverrides") ?? {}
        );
        actionsTab.overcomeActions = overcomeActions(statuses).map(action => ({
            ...action,
            name: game.i18n.format(`SFRPG.MechSheet.SystemFailure.Overcome${action.status === "inoperable" ? "Inoperable" : "Malfunctioning"}`, {
                component: game.i18n.localize(`SFRPG.MechSheet.Systems.${COMPONENT_LABELS[action.component]}`)
            }),
            canAfford: currentPP >= action.ppCost,
            insufficientPPTooltip: insufficientPPTooltip
        }));
```

- [ ] **Step 2: Render them**

In `static/templates/actors/mech-sheet-full.hbs`, after the PP Actions `</ol>`:

```hbs
            {{#if actionsTab.overcomeActions.length}}
            <ol class="mech-action-list">
                <li class="mech-action-header flexrow">
                    <h3 class="item-name noborder">{{ localize "SFRPG.MechSheet.SystemFailure.OvercomeTitle" }}</h3>
                </li>
                {{#each actionsTab.overcomeActions as |action|}}
                <li class="mech-action-item flexrow">
                    <div class="mech-action-name">
                        <h4>{{action.name}}</h4>
                    </div>
                    {{#if @root.isOwner}}
                    <div class="mech-action-buttons">
                        <button type="button" class="tag mech-overcome-action pp-cost-button{{#unless action.canAfford}} disabled{{/unless}}" data-component="{{action.component}}" {{#unless action.canAfford}}disabled data-tooltip="{{action.insufficientPPTooltip}}"{{/unless}}>
                            {{action.ppCost}} PP
                        </button>
                    </div>
                    {{/if}}
                </li>
                {{/each}}
            </ol>
            {{/if}}
```

- [ ] **Step 3: Bind the button**

In `src/module/actor/sheet/mech.js`, beside the existing `mech-pp-action` binding near line 497, add a handler for `.mech-overcome-action` calling `this.actor.useOvercomeAction(el.dataset.component)`.

- [ ] **Step 4: Add the actor method**

In `src/module/actor/mixins/actor-mech.js`:

```js
    /**
     * Spend Power Points to shrug off one component's system failure.
     *
     * The override holds until the start of the mech's next turn. Because
     * regeneration is worked out at the end of a turn, an override bought at the
     * start of that turn is still standing when the power core's rate is read -
     * which is the point of buying it.
     *
     * @param {string} component The component to overcome.
     * @returns {Promise<boolean>} True when the Power Points were spent.
     */
    async useOvercomeAction(component) {
        const statuses = effectiveSystems(
            this.system.attributes.systems,
            this.getFlag("sfrpg", "systemOverrides") ?? {}
        );
        const action = overcomeActions(statuses).find(entry => entry.component === component);
        if (!action) return false;

        const currentPP = this.system.attributes.pp.value || 0;
        if (currentPP < action.ppCost) {
            ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Actions.InsufficientPP"));
            return false;
        }

        const overrides = { ...(this.getFlag("sfrpg", "systemOverrides") ?? {}), [component]: action.override };
        await this.update({
            "system.attributes.pp.value": currentPP - action.ppCost,
            "flags.sfrpg.systemOverrides": overrides
        });

        return true;
    }
```

- [ ] **Step 5: Clear overrides at the start of the mech's turn**

In `src/sfrpg.js`, in the `onAfterUpdateCombat` handler, act on `eventData.newCombatant` as well as the old one: when the combat moves forward onto a mech, unset `flags.sfrpg.systemOverrides` on it.

- [ ] **Step 6: Add the strings**

```json
                "OvercomeTitle": "Overcome System Failure",
                "OvercomeMalfunctioning": "Ignore Malfunctioning: {component}",
                "OvercomeInoperable": "Treat Inoperable as Malfunctioning: {component}"
```

- [ ] **Step 7: Suite, build, verify, commit**

Run `npm test && npm run lint && npm run build`, install, and confirm in Foundry: a mech with nothing failed shows no Overcome list; setting the upper limbs to Malfunctioning adds one 2 PP entry; setting the power core to Inoperable adds a second at 4 PP; pressing the first spends 2 PP, removes the −2 from an upper-limb attack, and removes that entry from the list; stepping the initiative onto the mech's turn restores it.

```bash
git add src/module/actor/mixins/actor-mech.js src/module/actor/sheet/mech.js static/templates/actors/mech-sheet-full.hbs src/sfrpg.js static/lang
git commit -m "Offer a Power Point action for each of a mech's system failures"
```

---

## Task 13: The two percentage checks

**Files:**
- Modify: `src/module/system/mech-failure-link.js`
- Modify: `src/module/actor/mixins/actor-mech.js`
- Modify: `static/templates/actors/mech-sheet-full.hbs`
- Modify: `src/sfrpg.js`
- Modify: `static/lang/*.json`

**Interfaces:**
- Consumes: `auxiliaryFailureChance` from `mech-system-effects.js`, `chanceFailed` from `mech-system-transitions.js`.
- Produces: `onMechChanceCheckClick(event)`, bound to `data-action="mechChanceCheck"`.

- [ ] **Step 1: Post the auxiliary check when an auxiliary system is activated**

In `useMechAction`, for a `gear` action on a `mechAuxiliarySystem` item, when `auxiliaryFailureChance(statuses.auxSystem)` is above zero, post a whispered card carrying a `1d100` button with `data-chance` set to that number and `data-purpose="auxiliary"` before the action's own card. The Power Points are spent either way, which the card says.

- [ ] **Step 2: Post it at the start of each turn for constant-benefit systems**

In the `onAfterUpdateCombat` handler, when the combat moves onto a mech whose auxiliary component is failed, post one such card per auxiliary system providing a constant benefit.

- [ ] **Step 3: Add the cockpit's button to the sheet**

When the cockpit's effective status is `inoperable`, show a button on the mech sheet that posts a `1d100` card with `data-chance="50"` and `data-purpose="cockpit"`, labeled so the operator knows to press it when they spend a full action piloting. The system has no notion of that action, so it cannot be detected — this is the operator's declaration that they took it.

- [ ] **Step 4: Write the handler**

`onMechChanceCheckClick` rolls the link's `1d100`, calls `chanceFailed(roll.total, Number(link.dataset.chance))`, posts the outcome in the wording for its `data-purpose`, and marks the button spent.

- [ ] **Step 5: Add the strings**

```json
                "ChanceTooltip": "Roll to see whether the system works.",
                "AuxiliaryFailed": "The auxiliary system did not function. The action and its Power Points are spent.",
                "AuxiliaryWorked": "The auxiliary system functioned.",
                "CockpitActionLost": "The controls did not respond; the mech gains no action.",
                "CockpitActionKept": "The controls responded.",
                "CockpitCheckLabel": "Piloting check (unreliable controls)"
```

- [ ] **Step 6: Suite, build, verify, commit**

Run `npm test && npm run lint && npm run build`, install, and confirm both cards appear, roll once, report the right outcome either side of the threshold, and grey out.

```bash
git add src/module/system/mech-failure-link.js src/module/actor/mixins/actor-mech.js static/templates/actors/mech-sheet-full.hbs src/sfrpg.js static/lang
git commit -m "Hand the auxiliary and cockpit chance rolls to the player"
```

---

## Task 14: The sheet's damage display, and the release notes

**Files:**
- Modify: `src/module/actor/sheet/mech.js`
- Modify: `static/templates/actors/mech-sheet-full.hbs`
- Modify: `src/less/mech.less`
- Modify: `static/lang/*.json`
- Modify: `changelist.md`

**Interfaces:**
- Consumes: `damageState`, `isFailed` from `mech-system-failure.js`; `effectiveSystems` from `mech-system-effects.js`.
- Produces: nothing.

- [ ] **Step 1: Add the state to the sheet data**

In `mech.js`, compute `damageState({ value: hp.value, max: hp.max, overkill: this.actor.getFlag("sfrpg", "overkill") ?? 0 })` and the list of failed components with their effective statuses.

- [ ] **Step 2: Render the banner and the tags**

Above the mech sheet's header block, render a banner when the state is `wrecked` or `destroyed`, and a tag per failed component reading "Upper Limbs: Malfunctioning". A component whose failure is currently overcome shows the tag struck through, so the mech's owner can see what they are paying for.

- [ ] **Step 3: Mark unusable weapons**

In the weapon lists, add a class and a tooltip to any weapon whose `weaponUsable(statuses, weapon.system.slot)` is false.

- [ ] **Step 4: Style them**

In `src/less/mech.less`, add the banner and tag styles beside the existing mech tag rules. Reuse the existing spent-link dimming for the overcome tags.

- [ ] **Step 5: Add the strings**

```json
                "Wrecked": "Wrecked",
                "WreckedHint": "This mech is at 0 Hit Points and can take no actions.",
                "Destroyed": "Destroyed",
                "DestroyedHint": "This mech has taken more than twice its Hit Points and cannot be repaired.",
                "Tag": "{component}: {status}"
```

- [ ] **Step 6: Write the changelist entry**

Add to the `# Version 14.1.2` section of `changelist.md`, in the wording the existing entries use: the damage track, the system failures and their penalties, the Power Point actions, and the note that every roll is the player's.

- [ ] **Step 7: Final check**

Run `npm test && npm run lint && npm run build`. Confirm the full suite is green and every test file added in this plan is included in the run.

- [ ] **Step 8: Install the build**

```bash
cp dist/sfrpg.js dist/sfrpg.js.map dist/sfrpg.css "/c/Users/jeff_/AppData/Local/FoundryVTT/Data/systems/sfrpg/"
cp dist/lang/*.json "/c/Users/jeff_/AppData/Local/FoundryVTT/Data/systems/sfrpg/lang/"
```

Never copy `packs/`.

- [ ] **Step 9: Verify the whole feature end to end in Foundry**

In the Mechageddon world with Test Mech 1 in a combat: damage it past two-thirds, roll the failure, confirm the tag and the penalty; damage it past one-third, roll again; buy an overcome action and confirm the penalty lifts and returns next turn; take it to 0 and confirm the wrecked banner; damage it past twice its maximum and confirm the destroyed banner. Then restore the mech — Hit Points, Shield Points, Power Points, all six dropdowns to Nominal, and `unsetFlag` for `overkill`, `systemFailures` and `systemOverrides` — and delete every chat message the test created.

- [ ] **Step 10: Commit**

```bash
git add src/module/actor/sheet/mech.js static/templates/actors/mech-sheet-full.hbs src/less/mech.less static/lang changelist.md
git commit -m "Show a mech's damage state and its failed components on its sheet"
```

---

## Self-Review Notes

Checked against the spec, section by section:

- *Rules Covered* and *Interpretations* — Tasks 1 and 2.
- *Architecture / new rules modules* — Tasks 1-5, with the spec's `mech-system-failure-effects.js` renamed `mech-system-transitions.js` (the original name read as though it belonged to the effects module).
- The spec's `systemFailureModifiers(systems, {slot})` is implemented as `weaponPenalties(statuses, slot)` plus `weaponUsable`, and `overcomeActions(systems)` takes effective statuses rather than the raw system objects. Both changes are for the same reason: every consumer needs the effective status, so resolving overrides once at the edge keeps it from being forgotten in one of them.
- *Data* — Task 7 (cockpit field), Task 8 (`overkill`), Task 9 (`systemFailures`), Task 12 (`systemOverrides`).
- *Detecting Damage* — Tasks 8 and 9.
- *Nothing Rolls Itself* — Tasks 6, 9, 10 and 13.
- *The Failure Event* — Tasks 9 and 10.
- *Ongoing Effects* — Task 11.
- *Overcoming System Failure* — Task 12.
- *Chance Rolls* — Task 13.
- *Sheet* — Task 14.
- *Testing* — every listed case is covered by a named test in Tasks 1-5, 9 and 10.

Two things this plan does not build, both named as out of scope in the spec: repairing damage, and modeling a full action to pilot a mech.
