import { SFRPGEffectType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateDroneHitpoints", (fact, context) => {
        const data = fact.data;

        const addModifier = (bonus, data, tooltip) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType !== "constant") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }
            if (computedBonus !== 0) {
                tooltip.push(game.i18n.format("SFRPG.AbilityScoreBonusTooltip", {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        let hpMax = data.attributes.hp.max;

        // Iterate through any modifiers that affect HP
        let filteredModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.HIT_POINTS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.hp.tooltip);
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.hp.tooltip);
            }

            return sum;
        }, 0);
        
        hpMax += bonus;

        data.attributes.hp.max = hpMax;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}