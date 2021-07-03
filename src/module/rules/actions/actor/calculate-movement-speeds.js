import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateMovementSpeeds", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let roll = new Roll(bonus.modifier.toString(), data).evaluate({maximize: true});
            let computedBonus = roll.total;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_CHECK, SFRPGEffectType.ABILITY_CHECKS].includes(mod.effectType);
        });

        data.attributes.speed.land.value = data.attributes.speed.land.base;
        data.attributes.speed.flying.value = data.attributes.speed.flying.base;
        data.attributes.speed.swimming.value = data.attributes.speed.swimming.base;
        data.attributes.speed.burrowing.value = data.attributes.speed.burrowing.base;
        data.attributes.speed.climbing.value = data.attributes.speed.climbing.base;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}