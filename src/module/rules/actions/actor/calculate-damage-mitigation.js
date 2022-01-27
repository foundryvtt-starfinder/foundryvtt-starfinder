import { SFRPG } from "../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";
import RollContext from "../../../rolls/rollcontext.js";
import RollTree from "../../../rolls/rolltree.js";

function tryResolveModifier(modifier, rollContext) {
    const numberModifier = Number(modifier);
    if (!Number.isNaN(numberModifier)) {
        return Number(numberModifier);
    }

    let resultValue = 0;

    const tree = new RollTree({skipUI: true});
    tree.buildRoll(modifier, rollContext, async (button, rollMode, finalFormula) => {
        try {
            const formula = Roll.replaceFormulaData(finalFormula.finalRoll, null);
            resultValue = Roll.safeEval(formula);
        } catch (error) {
            console.error(['Failed to evaluate formula, are there dice terms in there?', finalFormula.finalRoll, error, modifier]);
            resultValue = 0;
        }
    });

    try {
        const finalResult = eval(resultValue);
        const finalNumber = Number(finalResult);
        if (!Number.isNaN(finalNumber)) {
            return finalNumber;
        }

        console.log(['Failed to evaluate damage mitigation modifier to a number', modifier, rollContext, resultValue]);
    } catch (error) {
        console.log(['Error resolving damage mitigation modifier', error, modifier, rollContext]);
    }

    return 0;
}

export default function (engine) {
    engine.closures.add("calculateDamageMitigation", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        data.traits.damageMitigation = {
            damageReduction: [],
            damageReductionFirst: null,
            damageReductionTooltip: [],
            energyResistance: {}
        };

        const modifiers = fact.modifiers;
        const damageReductionModifiers = modifiers.filter(mod => { return mod.enabled && mod.modifierType === "constant" && [SFRPGEffectType.DAMAGE_REDUCTION].includes(mod.effectType); });
        const energyRessistanceModifiers = modifiers.filter(mod => { return mod.enabled && mod.modifierType === "constant" && [SFRPGEffectType.ENERGY_RESISTANCE].includes(mod.effectType); });

        const rollContext = new RollContext();
        if (actor && actor.data) {
            rollContext.addContext("actor", actor);
            rollContext.setMainContext("actor");
            actor.setupRollContexts(rollContext);
        }

        for (const drModifier of damageReductionModifiers) {
            // TODO: Resolve formula; use RollTree, as it can complete synchronously
            const resolvedModifierValue = tryResolveModifier(drModifier.modifier, rollContext);
            const modifierInfo = {
                value: resolvedModifierValue,
                negatedBy: drModifier.valueAffected,
                source: drModifier
            };

            if (modifierInfo.negatedBy === "custom") {
                modifierInfo.negatedBy = drModifier.notes;
            }

            data.traits.damageMitigation.damageReduction.push(modifierInfo);
        }

        if (data.traits.damageMitigation.damageReduction.length > 0) {
            data.traits.damageMitigation.damageReduction.sort((x, y) => {
                return y.value - x.value;
            });

            data.traits.damageMitigation.damageReductionFirst = data.traits.damageMitigation.damageReduction[0];
        }

        for (const drModifier of data.traits.damageMitigation.damageReduction) {
            let negatedBy = "-";
            if (drModifier.negatedBy) {
                negatedBy = SFRPG.damageReductionTypes[drModifier.negatedBy];
                if (!negatedBy) {
                    negatedBy = drModifier.negatedBy;
                }
            }
            data.traits.damageMitigation.damageReductionTooltip.push(`${drModifier.source.name}: ${drModifier.value} / ${negatedBy}`);
        }

        for (const erModifier of energyRessistanceModifiers) {
            const resolvedModifierValue = tryResolveModifier(erModifier.modifier, rollContext);
            const modifierInfo = {
                value: resolvedModifierValue,
                damageType: erModifier.valueAffected,
                source: erModifier
            };

            if (modifierInfo.negatedBy === "custom") {
                modifierInfo.damageType = erModifier.notes;
            }
            
            if (!data.traits.damageMitigation.energyResistance[modifierInfo.damageType] || data.traits.damageMitigation.energyResistance[modifierInfo.damageType].value < modifierInfo.value) {
                data.traits.damageMitigation.energyResistance[modifierInfo.damageType] = modifierInfo;
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}