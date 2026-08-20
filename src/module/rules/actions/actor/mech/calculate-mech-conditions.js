import { SFRPGModifierType } from "../../../../modifiers/types.js";
import { collectMechDefenseModifiers, conditionsFromItems } from "../../../mech-condition-modifiers.js";

/**
 * Fold a mech's conditions into the defenses its components have already derived.
 *
 * Runs after calculateMechComponents, which sets eac, kac, fort and ref from the
 * frame, the limbs and the tier. Conditions adjust those totals rather than
 * taking part in deriving them, so the component tooltips still read as a
 * breakdown of the machine, with the conditions listed after.
 *
 * Only the mech's own conditions apply here. Its operators' conditions reach the
 * mech's attack and damage rolls instead - see collectMechRollModifiers.
 */
export default function(engine) {
    engine.closures.add("calculateMechConditions", (fact, context) => {
        const data = fact.data;
        const conditions = conditionsFromItems(fact.items);
        if (conditions.length === 0) return fact;

        // ref carries the value; reflex is the alias rollSave resolves through, and
        // calculateMechComponents points them at the same object.
        const defenses = {
            eac: data.attributes.eac,
            kac: data.attributes.kac,
            fort: data.attributes.fort,
            reflex: data.attributes.ref,
            will: data.attributes.will
        };

        for (const [target, defense] of Object.entries(defenses)) {
            if (!defense) continue;
            defense.tooltip = defense.tooltip ?? [];

            const applicable = collectMechDefenseModifiers({ mechConditions: conditions, target })
                .map(entry => entry.modifier);
            if (applicable.length === 0) continue;

            const stacked = context.parameters.stackModifiers.process(applicable, context, { actor: fact.actor });

            let total = 0;
            for (const bucket of Object.values(stacked)) {
                for (const bonus of bucket ?? []) {
                    total += evaluateModifier(bonus, data, defense);
                }
            }

            defense.value += total;
        }

        // The alias has to keep pointing at the adjusted object, not a stale copy.
        data.attributes.reflex = data.attributes.ref;
        if (data.attributes.fort) data.attributes.fort.bonus = data.attributes.fort.value;
        if (data.attributes.ref) data.attributes.ref.bonus = data.attributes.ref.value;
        if (data.attributes.will) data.attributes.will.bonus = data.attributes.will.value;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}

/**
 * Work out what one modifier is worth and record it on the defense's tooltip.
 *
 * A formula modifier is collected for the roll to evaluate rather than folded
 * into the static total, matching how the character armor and save closures
 * treat them.
 *
 * @param {object} bonus The modifier to apply.
 * @param {object} data The mech's system data, used to resolve the formula.
 * @param {object} defense The defense being adjusted, whose tooltip is appended to.
 * @returns {number} The amount to add to the defense.
 */
function evaluateModifier(bonus, data, defense) {
    if (bonus.modifierType === SFRPGModifierType.FORMULA) {
        defense.rolledMods = [...(defense.rolledMods ?? []), { mod: bonus.modifier, bonus }];
        return 0;
    }

    let computed = 0;
    try {
        computed = Roll.create(String(bonus.modifier), data).evaluateSync({ strict: false }).total;
    } catch (error) {
        console.error(error);
        return 0;
    }

    if (computed !== 0) {
        defense.tooltip.push(game.i18n.format("SFRPG.MechSheet.Conditions.DefenseTooltip", {
            source: bonus.name,
            mod: computed.signedString()
        }));
    }

    return computed;
}
