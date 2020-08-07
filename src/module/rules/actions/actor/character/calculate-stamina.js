import { SFRPGEffectType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateStamina", (fact, context) => {
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

        let spMax = 0; // Max(Constitution Modifier, 0) * Character level + Class' SP per level * Class Level

        // Constitution bonus
        let constitutionBonus = Math.max(data.abilities.con.mod, 0) * data.details.level.value;
        spMax += constitutionBonus;

        data.attributes.sp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Stamina.ConstitutionTooltip", {
            mod: constitutionBonus
        }));

        // Class bonus
        if (fact.classes && fact.classes.length > 0) {
            for (const cls of fact.classes) {
                let classBonus = Math.floor(cls.data.levels * cls.data.sp.value);
                spMax += classBonus;

                data.attributes.sp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Stamina.ClassTooltip", {
                    mod: classBonus,
                    source: cls.name
                }));
            }
        }
        
        // Iterate through any modifiers that affect SP
        let filteredModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.STAMINA_POINTS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.sp.tooltip);
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.sp.tooltip);
            }

            return sum;
        }, 0);
        
        spMax += bonus;

        data.attributes.sp.max = spMax;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}