import { SFRPGEffectType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

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

        let bab = 0;

        for (const cls of classes) {
            let mod = 0;
            switch (cls.data.bab) {
                case "slow": mod += Math.floor(cls.data.levels * 0.5); break;
                case "moderate": mod += Math.floor(cls.data.levels * 0.75); break;
                case "full": mod += cls.data.levels; break;
            }

            data.attributes.babtooltip.push(game.i18n.format("SFRPG.BABTooltip", {
                class: cls.name,
                bonus: mod.signedString()
            }));

            bab += mod;
        }
        
        // Iterate through any modifiers that affect BAB
        let filteredModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.BASE_ATTACK_BONUS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.babtooltip);
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.babtooltip);
            }

            return sum;
        }, 0);

        data.attributes.bab = bab + bonus;
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}