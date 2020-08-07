import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateStamina", (fact, context) => {
        const data = fact.data;

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
        const spModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.STAMINA_POINTS;
        });
        
        spModifiers.forEach(bonus => {
            let spBonus = bonus.modifier;
            if (spBonus !== 0) {
                spMax += spBonus;

                data.attributes.sp.tooltip.push(game.i18n.format("SFRPG.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }
        });

        data.attributes.sp.max = spMax;

        return fact;
    });
}