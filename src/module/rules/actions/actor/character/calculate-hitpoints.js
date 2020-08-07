import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateHitpoints", (fact, context) => {
        const data = fact.data;

        let hpMax = 0; // Race HP + (Class HP per level * Class Level) + Modifiers

        // Race bonus
        if (fact.races) {
            for (const race of fact.races) {
                hpMax += race.data.hp.value;

                data.attributes.hp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Hitpoints.RacialTooltip", {
                    mod: race.data.hp.value,
                    source: race.name
                }));
            }
        }

        // Class bonus
        if (fact.classes) {
            for (const cls of fact.classes) {
                let classBonus = Math.floor(cls.data.levels * cls.data.hp.value);
                hpMax += classBonus;

                data.attributes.hp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Hitpoints.ClassTooltip", {
                    mod: classBonus,
                    source: cls.name
                }));
            }
        }
        
        // Iterate through any modifiers that affect HP
        const hpModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.HIT_POINTS;
        });
        
        hpModifiers.forEach(bonus => {
            let hpBonus = bonus.modifier;
            if (hpBonus !== 0) {
                hpMax += hpBonus;

                data.attributes.hp.tooltip.push(game.i18n.format("SFRPG.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }
        });

        data.attributes.hp.max = hpMax;

        return fact;
    });
}