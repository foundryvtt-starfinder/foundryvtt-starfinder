# Mech Damage and System Failure

Design for the mech damage track, system failure and its conditions, the Power
Point actions that overcome them, and the penalties those conditions place on a
mech's rolls.

Repairing damage — the Engineering checks, the hourly Hit Point repair with UPBs,
and out-of-combat Shield Point regeneration — is deliberately not part of this
design. It is a separate piece of work that reads the state this one writes.

## Rules Covered

From Mechageddon: *Wrecked and Destroyed*, *System Failure*, *Overcoming System
Failure*, and the six per-component effects.

- A mech reduced to 0 Hit Points is wrecked and can take no actions.
- A mech that takes damage exceeding twice its Hit Points is destroyed and cannot
  be repaired.
- A mech reduced to two-thirds its Hit Points, and again at one-third, suffers a
  system failure. 1d20 names the component. A component with no failure becomes
  malfunctioning; one already malfunctioning becomes inoperable.
- At the beginning of its turn a mech can spend 2 PP to ignore one component's
  malfunctioning condition, or 4 PP to treat one component's inoperable condition
  as malfunctioning.

### Interpretations

Three points in the text admit more than one reading. Each is settled here rather
than left to the implementation.

**"Two-thirds its remaining Hit Points."** Read as two-thirds of *maximum* Hit
Points. Read literally against remaining Hit Points the condition is either
always true or never reachable, depending on when it is evaluated. Each threshold
fires once per mech per encounter: at Hit Points at or below 2/3 max, and again
at or below 1/3 max.

**"Damage that exceeds twice its Hit Points."** Read as total damage taken
exceeding twice maximum Hit Points. Foundry clamps a mech's Hit Points at zero,
so the damage past zero is accumulated separately as overkill, and the mech is
destroyed once `(hp.max - hp.value) + overkill > 2 * hp.max`.

**"Either spend 2 PP ... or spend 4 PP."** Read as naming two options rather than
capping the mech at one such action per turn. Power Points are the limit. One
action is offered per failed component.

## Architecture

Pure rules modules decide; a thin Foundry layer applies. This matches
`src/module/rules/`, which already holds `mech-turn-regen.js`, `mech-replenish.js` and
`mech-condition-modifiers.js` — each a plain function of plain data,
unit tested without Foundry, called from a hook or a data-preparation closure
that owns all of the document reading and writing.

### New rules modules

`src/module/rules/mech-system-failure.js`

- `failuresTriggered({ hp, previousHp, fired })` — which thresholds a change in
  Hit Points crosses, given the ones already fired. Returns the thresholds newly
  crossed, so a single large hit carrying a mech from full to a quarter produces
  two failures.
- `componentForRoll(roll)` — the 1d20 table. 1–5 upper limbs, 6–10 lower limbs,
  11–13 frame, 14–16 auxiliary system, 17–18 power core, 19–20 cockpit.
- `nextStatus(status)` — nominal to malfunctioning to inoperable. A component
  already inoperable stays inoperable; the failure is absorbed rather than
  redirected, which is what the text says.
- `damageState({ hp, overkill })` — `"intact"`, `"wrecked"` or `"destroyed"`.

`src/module/rules/mech-system-effects.js`

- `effectiveStatus(status, override)` — the stored status stepped one better by
  an override. `"ignored"` takes malfunctioning to nominal; `"downgraded"` takes
  inoperable to malfunctioning.
- `systemFailureModifiers(systems, { slot })` — the attack penalties. Every
  malfunctioning component that mounts weapons gives −2 to attacks with weapons
  in its own slots; inoperable makes those weapons unusable.
- `regenerationRate(status)` — 1, 1/2 or 0, the power core's throttle.
- `movementRate(status)` — 1, 1/2 or 0 for speeds not provided by an auxiliary
  system.
- `hardnessRate(status)` — 1, 1/2 or 0 for the frame.
- `auxiliaryFailureChance(status)` — 0, 25 or 50.
- `overcomeActions(systems)` — the Power Point actions to offer, one per failed
  component, with its cost and what it does.

`src/module/rules/mech-system-failure-effects.js` covers the one-off effects that
fire at the moment a component's status changes rather than while it holds:

- `powerCoreLoss(status)` — `1d4` Power Points lost on first becoming
  malfunctioning and again on becoming inoperable.
- `cockpitVictims(operators, status)` — half the operators rounded up on
  malfunctioning, all of them on inoperable.
- `cockpitDamage(tier)` — `<tier>d8` — and `cockpitSaveDC(tier)` — 15 + half the
  tier.
- `auxiliaryToDisable(systems, roll)` — which auxiliary system ceases to function
  when the auxiliary component becomes inoperable.

### Data

The five existing status fields in `src/module/data/actor/mech.mjs` gain a sixth,
`cockpit`, alongside `upperLimbs`, `lowerLimbs`, `frame`, `powerCore` and
`auxSystem`. They already carry `nominal` / `malfunctioning` / `inoperable` from
`CONFIG.SFRPG.mechSystemStatus`, and the mech sheet already exposes them as
dropdowns that nothing reads. This design makes them the state of record; the
dropdowns stay, now as a GM override rather than a note.

Three flags hold state belonging to an encounter rather than to the mech:

- `flags.sfrpg.systemFailures` — the thresholds already fired, cleared by the
  existing `combatStart` hook so each encounter starts fresh. Damage taken
  outside combat still fires each threshold once.
- `flags.sfrpg.systemOverrides` — `{ upperLimbs: "ignored", powerCore:
  "downgraded" }`, cleared at the start of the mech's turn.
- `flags.sfrpg.overkill` — damage dealt past zero Hit Points, which Foundry's
  clamping otherwise discards.

Nothing is stored as a compendium condition item. The penalties are derived from
the status fields during data preparation, the way `calculate-mech-conditions.js`
already folds the mech's own conditions into its defenses. A condition item would
have to be created, found and deleted in step with the status field, and the two
could disagree.

## Detecting Damage

An `updateActor` hook, GM-side only, comparing Hit Points before and after.

The alternative — wrapping the damage application — does not reach far enough.
`applyDamage` in `src/module/actor/mixins/actor-damage.js` branches on
`starship` and `vehicle`; a mech falls through to `_applyActorDamage`. Hit Points
also change from a GM typing in the box, from a macro, and from any module. The
hook catches all of them.

Destruction needs one thing the hook cannot see. `_applyActorDamage` clamps at
zero, so the damage past zero never reaches the update. A `mech` branch is added
to `applyDamage` to accumulate that remainder into `flags.sfrpg.overkill` before
the clamp, in the same place the character branch already reads
`remainingUndealtDamage` for massive damage.

## The Failure Event

When the hook sees a threshold crossed:

1. Roll 1d20, take the component from the table, step its status.
2. Apply the one-off effects for that component and new status.
3. Write the status, record the threshold in `flags.sfrpg.systemFailures`, and
   post a card.

The card is whispered to the mech's owners and every GM, matching the
regeneration and Replenish messages. It names the component, the new condition,
and what that condition means.

The one-off effects at transition:

- **Power core** — roll 1d4 and subtract from Power Points, floored at zero.
- **Cockpit** — the card carries a Reflex button for each affected operator. The
  mech's owner presses it, the system rolls the save against DC 15 + half tier,
  rolls `<tier>d8` bludgeoning, halves it on a success, and applies it to that
  operator. Half the operators rounded up on malfunctioning; all of them on
  inoperable. Which half is the owner's choice, offered on the card.
- **Auxiliary system, on becoming inoperable** — one auxiliary system chosen at
  random ceases to function, recorded on the item.

## Ongoing Effects

Read from `effectiveStatus`, so an override suppresses them for as long as it
holds.

| Component | Malfunctioning | Inoperable |
| --- | --- | --- |
| Upper limbs | −2 attack with upper-limb weapons and with combat maneuvers not using a mech weapon | those weapons unusable |
| Lower limbs | speeds not from an auxiliary system halved; −2 attack with lower-limb weapons | those speeds 0, falling if airborne; those weapons unusable |
| Frame | −2 attack with frame weapons; hardness halved | those weapons unusable; hardness 0 |
| Auxiliary | 25% activation failure | 50%, and one auxiliary system disabled outright |
| Power core | Shield and Power Point regeneration halved | regeneration 0 |
| Cockpit | operator damage at transition | operator damage, plus 50% lost action piloting |

The attack penalties reach rolls through `collectMechRollModifiers` in
`mech-condition-modifiers.js`, which mech weapon attacks already consult. The
system-failure modifiers are appended to what that returns, so they stack with
conditions and display through the same tooltip.

Speed, hardness and regeneration are applied in the mech data-preparation
closures under `src/module/rules/actions/actor/mech/`, next to
`calculate-mech-components.js` which derives them in the first place. The power
core's throttle applies to end-of-turn regeneration only, not to Replenish, which
is a Power Point purchase rather than a rate.

Unusable weapons are marked on the mech sheet and refuse to roll, naming the
component responsible.

## Overcoming System Failure

The mech sheet's Power Point actions gain one entry per currently failed
component, built from the mech's status rather than from the static
`SFRPG.mechPPActions` table, so they appear and disappear as components fail and
are repaired. A mech with nothing failed sees none.

- Malfunctioning component: "Ignore Malfunctioning: Upper Limbs", 2 PP.
- Inoperable component: "Treat Inoperable as Malfunctioning: Power Core", 4 PP.

Using one spends the Power Points and writes
`flags.sfrpg.systemOverrides.<component>`. The override is cleared at the start
of the mech's next turn, by the same combat hook that already clears per-turn
state. Because regeneration now happens at the end of a turn, an override bought
at the start of that turn is still standing when the power core's regeneration is
worked out, which is the point of buying it.

## Chance Rolls

The two percentage checks are whispered cards with a roll button — the promoted
dice link `promoteDiceLink` builds for Aim and Replenish — sent to the mech's
owners. Neither is rolled silently: the player sees the die.

**Auxiliary activation** fires when the mech activates an auxiliary system, and
at the start of each turn for systems giving a constant benefit. On a failure the
action and the Power Points are still spent, as the text says, and the system
cannot be used until the beginning of the mech's next turn.

**Cockpit lost action** is meant to fire the first time each turn an operator uses
a full action to pilot the mech. The system has no notion of an operator spending
a full action to pilot, so there is nothing to hook. A failed cockpit puts a
button on the mech sheet that the operator presses when they take that action.
Modeling piloting properly is its own piece of work and is not part of this
design.

The cockpit's unreliable controls last while the cockpit is failed rather than
for one turn, since the condition itself is what is being tracked.

## Sheet

- Failed components show as tags near the top of the mech sheet, in the style of
  the armed attack-bonus banner.
- Wrecked and destroyed each get a banner. A destroyed mech refuses repair.
- Weapons on a failed mount are marked unusable.
- The five status dropdowns become six and stay editable, as the GM's override.

## Testing

Everything decidable is a pure function with vitest coverage. Each test is
mutation-checked individually — the assertion, selector or expected value changed
one at a time, confirmed to fail for the right reason, then reverted.

- Threshold crossing: each threshold at its boundary, both crossed by one hit,
  neither re-fired once recorded, healing back above a threshold not clearing it.
- The 1d20 table across all twenty faces, and the boundaries between rows.
- Status stepping, including the failure absorbed by an already inoperable
  component.
- Effective status under each override, and an override on a component that is
  not failed.
- The modifier table per component and state, including a weapon in a slot whose
  component is nominal picking up nothing.
- Regeneration, movement and hardness rates.
- Overkill accumulation, and the destroyed boundary either side of twice maximum
  Hit Points.
- The transition effects: power core loss, operator count rounding, and the
  damage and DC formulas by tier.

The Foundry-facing parts — the `updateActor` hook, the cards, the sheet, the
operator damage, the Power Point actions — are verified in the Mechageddon world
with Playwright, the way Replenish was.
