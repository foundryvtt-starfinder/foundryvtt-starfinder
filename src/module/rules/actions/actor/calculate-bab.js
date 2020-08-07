import { SFRPGEffectType } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAttackBonus", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;
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
        const babModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.BASE_ATTACK_BONUS;
        });
        
        babModifiers.forEach(bonus => {
            let babBonus = bonus.modifier;
            if (babBonus !== 0) {
                bab += babBonus;

                data.attributes.babtooltip.push(game.i18n.format("SFRPG.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }
        });

        data.attributes.bab = bab;
        
        return fact;
    });
}